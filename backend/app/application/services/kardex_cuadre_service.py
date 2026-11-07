from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import bson
from app.domain.models.inventario import InventoryLog, Inventario, TipoMovimiento
from app.domain.models.product import Product as ProductModel

TOLERANCE = 0.001


class KardexCuadreService:
    @staticmethod
    async def cuadrar_kardex(
        tenant_id: str,
        sucursal_id: str = "CENTRAL",
        almacen_id: str = "default",
        producto_id: Optional[str] = None,
        producto_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Recalcula secuencialmente el Kárdex y alinea el documento de Inventario
        con el resultado matemático real (sumatoria secuencial de cantidad_movida).
        
        Soporta:
        - producto_id específico
        - producto_ids (lista de productos seleccionados estilo Odoo)
        - producto_id == "ALL" o None (todos los productos con movimientos)
        """
        almacen_id = almacen_id or "default"

        # 1. Determinar lista de productos a procesar
        if producto_ids and len(producto_ids) > 0:
            target_pids = list(dict.fromkeys([p for p in producto_ids if p]))
        elif producto_id and producto_id.upper() not in ("ALL", "BATCH"):
            target_pids = [producto_id]
        else:
            # Consultar todos los productos que tengan logs en esta sucursal y almacén
            log_base_query: dict = {"tenant_id": tenant_id, "sucursal_id": sucursal_id}
            if almacen_id == "default":
                log_base_query["$or"] = [
                    {"almacen_id": "default"},
                    {"almacen_id": {"$exists": False}},
                    {"almacen_id": None},
                ]
            else:
                log_base_query["almacen_id"] = almacen_id

            log_coll = InventoryLog.get_motor_collection()
            target_pids = await log_coll.distinct("producto_id", log_base_query)

        if not target_pids:
            return {
                "message": "No se encontraron productos o movimientos para recalcular.",
                "data": {
                    "corregidos": 0,
                    "logs_modificados": 0,
                    "inventarios_modificados": 0,
                    "detalles": [],
                },
            }

        # 2. Pre-cargar nombres y datos de productos para el reporte
        product_names: Dict[str, str] = {}
        try:
            valid_oids = [bson.ObjectId(p) for p in target_pids if bson.ObjectId.is_valid(p)]
            if valid_oids:
                prods = await ProductModel.get_pymongo_collection().find(
                    {"_id": {"$in": valid_oids}}, {"descripcion": 1}
                ).to_list(length=None)
                product_names = {str(p["_id"]): p.get("descripcion", "Sin nombre") for p in prods}
        except Exception:
            pass

        resultados: Dict[str, Any] = {
            "corregidos": 0,
            "logs_modificados": 0,
            "inventarios_modificados": 0,
            "detalles": [],
        }

        # 3. Iterar cada producto y recalcular secuencialmente
        for pid in target_pids:
            per_product_query: dict = {
                "tenant_id": tenant_id,
                "sucursal_id": sucursal_id,
                "producto_id": pid,
            }
            if almacen_id == "default":
                per_product_query["$or"] = [
                    {"almacen_id": "default"},
                    {"almacen_id": {"$exists": False}},
                    {"almacen_id": None},
                ]
            else:
                per_product_query["almacen_id"] = almacen_id

            logs = await InventoryLog.find(per_product_query).sort("+created_at").to_list()

            # Query del inventario físico actual
            inv_query: dict = {
                "tenant_id": tenant_id,
                "sucursal_id": sucursal_id,
                "producto_id": pid,
            }
            if almacen_id == "default":
                inv_query["$or"] = [
                    {"almacen_id": "default"},
                    {"almacen_id": {"$exists": False}},
                    {"almacen_id": None},
                ]
            else:
                inv_query["almacen_id"] = almacen_id

            # Consolidar documentos duplicados de inventario si existen para evitar errores de índice único
            all_invs = await Inventario.find(inv_query).to_list()
            if len(all_invs) > 1:
                canonical = next((inv for inv in all_invs if getattr(inv, "almacen_id", None) == almacen_id), all_invs[0])
                for extra in all_invs:
                    if extra.id != canonical.id:
                        await extra.delete()
                inventario = canonical
            elif len(all_invs) == 1:
                inventario = all_invs[0]
            else:
                inventario = None

            stock_anterior = float(str(inventario.cantidad)) if inventario else 0.0

            if not logs:
                # Si no tiene logs pero existe documento de inventario, saneamos almacen_id
                if inventario and (not getattr(inventario, "almacen_id", None) or inventario.almacen_id is None):
                    inventario.almacen_id = almacen_id
                    await inventario.save()
                resultados["corregidos"] += 1
                continue

            # Detección inteligente de línea base (último ajuste físico / importación de conteo)
            baseline_idx = -1
            for i, log in enumerate(logs):
                mov = getattr(log, "tipo_movimiento", None)
                notas = getattr(log, "notas", "") or ""
                if (
                    mov == TipoMovimiento.AJUSTE_FISICO
                    or "Sincronización por Excel" in notas
                    or "[Ajuste Físico" in notas
                    or "[Entrada Masiva" in notas
                    or "Ajuste de Inventario" in notas
                    or "Conteo Físico" in notas
                ):
                    baseline_idx = i

            if baseline_idx >= 0:
                stock_running = float(str(logs[baseline_idx].stock_resultante))
                logs_to_recalc = logs[baseline_idx + 1:]
            else:
                first_log = logs[0]
                stock_running = float(
                    str(first_log.stock_resultante if first_log.stock_resultante is not None else first_log.cantidad_movida)
                )
                logs_to_recalc = logs[1:]

            for log in logs_to_recalc:
                stock_running += float(str(log.cantidad_movida))
                expected = round(stock_running, 4)
                actual = round(float(str(log.stock_resultante)), 4) if log.stock_resultante is not None else None
                
                needs_save = False
                if actual is None or abs(expected - actual) > TOLERANCE:
                    log.stock_resultante = expected
                    needs_save = True
                
                # Normalizar almacen_id si es None
                if not getattr(log, "almacen_id", None) or log.almacen_id is None:
                    log.almacen_id = almacen_id
                    needs_save = True

                if needs_save:
                    await log.save()
                    resultados["logs_modificados"] += 1

            stock_final = round(stock_running, 4)

            # Si el inventario actual ya coincide con el último log registrado, preservar consistencia
            last_log_res = round(float(str(logs[-1].stock_resultante)), 4) if logs else stock_final
            if abs(stock_anterior - last_log_res) <= TOLERANCE:
                stock_final = stock_anterior

            if inventario:
                hubo_cambio = abs(stock_anterior - stock_final) > TOLERANCE
                if hubo_cambio:
                    inventario.cantidad = stock_final
                    resultados["inventarios_modificados"] += 1
                    resultados["detalles"].append({
                        "producto_id": pid,
                        "descripcion": product_names.get(pid, pid),
                        "stock_anterior": stock_anterior,
                        "stock_nuevo": stock_final,
                    })
                # Sanar almacen_id si es legacy null
                if not getattr(inventario, "almacen_id", None) or inventario.almacen_id is None:
                    inventario.almacen_id = almacen_id
                await inventario.save()
            else:
                if abs(stock_final) > TOLERANCE:
                    new_inv = Inventario(
                        tenant_id=tenant_id,
                        sucursal_id=sucursal_id,
                        almacen_id=almacen_id,
                        producto_id=pid,
                        cantidad=stock_final,
                        created_at=datetime.now(timezone.utc),
                    )
                    await new_inv.insert()
                    resultados["inventarios_modificados"] += 1
                    resultados["detalles"].append({
                        "producto_id": pid,
                        "descripcion": product_names.get(pid, pid),
                        "stock_anterior": 0.0,
                        "stock_nuevo": stock_final,
                    })

            resultados["corregidos"] += 1

        total_procesados = len(target_pids)
        return {
            "message": f"Kárdex cuadrado exitosamente: {total_procesados} producto(s) procesados, {resultados['inventarios_modificados']} stock(s) alineados.",
            "data": resultados,
        }
