from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from beanie import PydanticObjectId

from app.domain.models.momentos_taboada import (
    PremioMomentosTaboada,
    MovimientoCajaChicaTaboada,
    MovimientoStockPremio,
    CanjeMomentosTaboada,
)
from app.domain.models.sucursal import Sucursal
from app.domain.models.user import User


class MomentosTaboadaLogisticaService:
    """
    Servicio de logística, surtido de almacén central a sucursales,
    traslados entre tiendas y registro de egresos de caja chica promocional.
    """

    @staticmethod
    async def surtir_stock(
        tenant_id: str,
        premio_id: str,
        sucursal_id: str,
        cantidad: int,
        motivo: Optional[str],
        current_user: User,
    ) -> Dict[str, Any]:
        """
        Inyecta existencias físicas de un premio en una sucursal (ej: lote llegado de fábrica)
        y genera un registro de auditoría inmutable.
        """
        if cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad a surtir debe ser mayor a 0")

        if not PydanticObjectId.is_valid(premio_id):
            raise HTTPException(status_code=400, detail="ID de premio inválido")

        premio = await PremioMomentosTaboada.get(PydanticObjectId(premio_id))
        if not premio or premio.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Premio no encontrado")

        sucursal = (
            await Sucursal.get(PydanticObjectId(sucursal_id))
            if PydanticObjectId.is_valid(sucursal_id)
            else None
        )
        sucursal_nombre = sucursal.nombre if sucursal else "Sucursal"

        stock_anterior = premio.stock_por_sucursal.get(sucursal_id, 0)
        nuevo_stock = stock_anterior + cantidad
        premio.stock_por_sucursal[sucursal_id] = nuevo_stock
        premio.updated_at = datetime.now(timezone.utc)
        await premio.save()

        # Auditoría de movimiento
        mov = MovimientoStockPremio(
            tenant_id=tenant_id,
            premio_id=str(premio.id),
            premio_codigo=premio.codigo,
            premio_nombre=premio.nombre,
            tipo="SURTIDO_INGRESO",
            sucursal_destino_id=sucursal_id,
            sucursal_destino_nombre=sucursal_nombre,
            cantidad=cantidad,
            motivo=motivo or "Ingreso / Surtido de fábrica",
            usuario_id=str(current_user.id),
            usuario_nombre=current_user.full_name or current_user.username,
        )
        await mov.create()

        return {
            "status": "success",
            "message": f"Se surtieron +{cantidad} unidades de {premio.nombre} a {sucursal_nombre}",
            "premio_id": str(premio.id),
            "sucursal_id": sucursal_id,
            "stock_anterior": stock_anterior,
            "nuevo_stock": nuevo_stock,
            "movimiento_id": str(mov.id),
        }

    @staticmethod
    async def trasladar_stock(
        tenant_id: str,
        premio_id: str,
        sucursal_origen_id: str,
        sucursal_destino_id: str,
        cantidad: int,
        motivo: Optional[str],
        current_user: User,
    ) -> Dict[str, Any]:
        """
        Traslada existencias físicas de un premio de una sucursal origen a una sucursal destino.
        """
        if sucursal_origen_id == sucursal_destino_id:
            raise HTTPException(
                status_code=400, detail="La sucursal de origen y destino no pueden ser iguales"
            )

        if cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad a trasladar debe ser mayor a 0")

        if not PydanticObjectId.is_valid(premio_id):
            raise HTTPException(status_code=400, detail="ID de premio inválido")

        premio = await PremioMomentosTaboada.get(PydanticObjectId(premio_id))
        if not premio or premio.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Premio no encontrado")

        stock_origen = premio.stock_por_sucursal.get(sucursal_origen_id, 0)
        if stock_origen < cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente en origen. Disponible: {stock_origen}, Solicitado: {cantidad}",
            )

        # Nombres de sucursales
        suc_origen = (
            await Sucursal.get(PydanticObjectId(sucursal_origen_id))
            if PydanticObjectId.is_valid(sucursal_origen_id)
            else None
        )
        suc_destino = (
            await Sucursal.get(PydanticObjectId(sucursal_destino_id))
            if PydanticObjectId.is_valid(sucursal_destino_id)
            else None
        )
        nom_origen = suc_origen.nombre if suc_origen else "Origen"
        nom_destino = suc_destino.nombre if suc_destino else "Destino"

        # Aplicar traslado
        premio.stock_por_sucursal[sucursal_origen_id] = stock_origen - cantidad
        premio.stock_por_sucursal[sucursal_destino_id] = (
            premio.stock_por_sucursal.get(sucursal_destino_id, 0) + cantidad
        )
        premio.updated_at = datetime.now(timezone.utc)
        await premio.save()

        # Registro inmutable
        mov = MovimientoStockPremio(
            tenant_id=tenant_id,
            premio_id=str(premio.id),
            premio_codigo=premio.codigo,
            premio_nombre=premio.nombre,
            tipo="TRASLADO_INTERNO",
            sucursal_origen_id=sucursal_origen_id,
            sucursal_origen_nombre=nom_origen,
            sucursal_destino_id=sucursal_destino_id,
            sucursal_destino_nombre=nom_destino,
            cantidad=cantidad,
            motivo=motivo or f"Traslado de {nom_origen} a {nom_destino}",
            usuario_id=str(current_user.id),
            usuario_nombre=current_user.full_name or current_user.username,
        )
        await mov.create()

        return {
            "status": "success",
            "message": f"Traslado exitoso de {cantidad} {premio.nombre} desde {nom_origen} hacia {nom_destino}",
            "stock_origen_restante": premio.stock_por_sucursal[sucursal_origen_id],
            "stock_destino_nuevo": premio.stock_por_sucursal[sucursal_destino_id],
            "movimiento_id": str(mov.id),
        }

    @staticmethod
    async def get_movimientos_stock(
        tenant_id: str,
        premio_id: Optional[str] = None,
        sucursal_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retorna el historial de movimientos de inventario de premios para auditoría."""
        filtros: Dict[str, Any] = {"tenant_id": tenant_id}
        if premio_id:
            filtros["premio_id"] = premio_id
        if sucursal_id and sucursal_id != "TODAS":
            filtros["$or"] = [
                {"sucursal_destino_id": sucursal_id},
                {"sucursal_origen_id": sucursal_id},
            ]

        movs = await MovimientoStockPremio.find(filtros).sort("-created_at").limit(100).to_list()
        return [
            {
                "id": str(m.id),
                "fecha": m.created_at.isoformat(),
                "premio_nombre": m.premio_nombre,
                "premio_codigo": m.premio_codigo,
                "tipo": m.tipo,
                "cantidad": m.cantidad,
                "origen": m.sucursal_origen_nombre,
                "destino": m.sucursal_destino_nombre,
                "motivo": m.motivo,
                "usuario_nombre": m.usuario_nombre,
            }
            for m in movs
        ]

    @staticmethod
    async def registrar_egreso_caja_chica(
        tenant_id: str,
        sucursal_id: str,
        monto: float,
        metodo_pago: str,
        descripcion: str,
        current_user: User,
    ) -> Dict[str, Any]:
        """
        Registra una salida de dinero del fondo promocional (ej: empaques, reposición de cerámica)
        para mantener balance neto real.
        """
        if monto <= 0:
            raise HTTPException(status_code=400, detail="El monto del egreso debe ser mayor a 0")
        if not descripcion.strip():
            raise HTTPException(status_code=400, detail="La descripción del gasto es obligatoria")

        sucursal = (
            await Sucursal.get(PydanticObjectId(sucursal_id))
            if PydanticObjectId.is_valid(sucursal_id)
            else None
        )
        sucursal_nombre = sucursal.nombre if sucursal else "Sucursal Central"

        egreso = MovimientoCajaChicaTaboada(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            sucursal_nombre=sucursal_nombre,
            tipo="EGRESO_FONDO",
            monto=round(monto, 2),
            metodo_pago=metodo_pago if metodo_pago in ["EFECTIVO", "QR"] else "EFECTIVO",
            descripcion=descripcion.strip(),
            usuario_id=str(current_user.id),
            usuario_nombre=current_user.full_name or current_user.username,
        )
        await egreso.create()

        return {
            "status": "success",
            "message": f"Egreso de Bs {monto:.2f} registrado en fondo de {sucursal_nombre}",
            "movimiento_id": str(egreso.id),
        }

    @staticmethod
    async def get_resumen_logistico(tenant_id: str) -> Dict[str, Any]:
        """
        Calcula el estado de salud de stock por premio y sucursales (alertas de agotado y bajo).
        """
        premios = await PremioMomentosTaboada.find(
            {"tenant_id": tenant_id, "is_active": True}
        ).to_list()

        canjes = await CanjeMomentosTaboada.find(
            {"tenant_id": tenant_id, "estado": "COMPLETADO"}
        ).to_list()

        sucursales = await Sucursal.find({"tenant_id": tenant_id}).to_list()
        sucursal_map = {str(s.id): s.nombre for s in sucursales}

        alertas_agotados: List[Dict[str, Any]] = []
        alertas_bajos: List[Dict[str, Any]] = []

        resumen_premios = []
        for p in premios:
            stock_total = sum(p.stock_por_sucursal.values())
            canjes_premio = sum(1 for c in canjes if c.premio_codigo == p.codigo)

            # Verificar por cada sucursal si hay stock 0 o <= 3
            for s_id, s_nom in sucursal_map.items():
                stk = p.stock_por_sucursal.get(s_id, 0)
                if stk == 0:
                    alertas_agotados.append({
                        "premio_nombre": p.nombre,
                        "sucursal_nombre": s_nom,
                        "sucursal_id": s_id,
                    })
                elif stk <= 3:
                    alertas_bajos.append({
                        "premio_nombre": p.nombre,
                        "sucursal_nombre": s_nom,
                        "sucursal_id": s_id,
                        "stock_actual": stk,
                    })

            resumen_premios.append({
                "id": str(p.id),
                "codigo": p.codigo,
                "nombre": p.nombre,
                "stock_total": stock_total,
                "stock_por_sucursal": p.stock_por_sucursal,
                "total_canjeados": canjes_premio,
            })

        return {
            "total_premios_activos": len(premios),
            "alertas": {
                "agotados_count": len(alertas_agotados),
                "bajos_count": len(alertas_bajos),
                "agotados": alertas_agotados,
                "bajos": alertas_bajos,
            },
            "premios": resumen_premios,
        }
