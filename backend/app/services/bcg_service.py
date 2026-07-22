from datetime import datetime
from typing import Dict, Any, Optional

import time
import asyncio
from app.utils.cache import ttl_cache
from app.schemas.analytics import BCGMatrixResponse, BCGProduct

@ttl_cache(seconds=300)
async def calculate_bcg_matrix(
    tenant_id: str,
    start_date: datetime,
    end_date: datetime,
    sucursal_id: Optional[str] = None
) -> BCGMatrixResponse:
    """
    Motor de Analítica Matriz BCG.
    Lee de ventas_historicas_crudas (datos históricos planos importados).
    Compara el periodo actual vs el periodo equivalente anterior.
    """
    from app.db import get_raw_db
    db = await get_raw_db()

    from datetime import timezone
    # Forzar zona horaria a UTC para que coincida con la DB
    if start_date.tzinfo is None: start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None: end_date = end_date.replace(tzinfo=timezone.utc)
    
    # 1. Calcular el periodo previo equivalente
    delta = end_date - start_date
    prev_end_date = start_date
    prev_start_date = start_date - delta

    print(f"[BCG] Periodo actual: {start_date} -> {end_date}")
    print(f"[BCG] Periodo previo: {prev_start_date} -> {prev_end_date}")

    # Lista blanca de sucursales minoristas para POS 'sales'
    cursor_sucursales = db.sucursales.find({"tenant_id": tenant_id})
    retail_ids = []
    async for s in cursor_sucursales:
        nl = str(s.get("nombre", "")).lower()
        if any(bad in nl for bad in ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista", "supermercados"]):
            continue
        if any(good in nl for good in ["hero", "calacoto", "recoleta"]):
            retail_ids.append(str(s["_id"]))
            try:
                from bson import ObjectId
                if ObjectId.is_valid(str(s["_id"])):
                    retail_ids.append(ObjectId(s["_id"]))
            except Exception:
                pass

    # 2. Helper de pipeline sobre ventas_historicas_crudas (colección histórica plana)
    def pipeline_for_period(start: datetime, end: datetime):
        match: Dict[str, Any] = {
            "fecha_transaccion": {"$gte": start, "$lte": end},
        }
        if tenant_id:
            match["$or"] = [
                {"tenant_id": tenant_id},
                {"tenant_id": None},
                {"tenant_id": {"$exists": False}}
            ]
        if sucursal_id:
            s_lower = sucursal_id.lower()
            if 'hero' in s_lower:
                match["sucursal"] = {"$regex": "hero.*nas?", "$options": "i"}
            else:
                match["sucursal"] = {"$regex": s_lower, "$options": "i"}
        else:
            # Filtro estricto de inclusión minorista (Heroínas, Calacoto, Recoleta)
            match["sucursal"] = {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}

        return [
            {"$match": match},
            {
                "$project": {
                    "nombre_producto": 1,
                    "monto_total_bs": 1,
                    "cantidad": 1
                }
            },
            {
                "$group": {
                    "_id": "$nombre_producto",
                    "nombre": {"$first": "$nombre_producto"},
                    "ingresos": {"$sum": "$monto_total_bs"},
                    "cantidad": {"$sum": "$cantidad"}
                }
            }
        ]

    def pos_pipeline_for_period(start: datetime, end: datetime):
        match_pos: Dict[str, Any] = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start, "$lte": end}
        }
        if sucursal_id:
            s_lower = sucursal_id.lower()
            if 'hero' in s_lower:
                match_pos["sucursal_id"] = {"$regex": "hero.*nas?", "$options": "i"}
            else:
                match_pos["sucursal_id"] = {"$regex": s_lower, "$options": "i"}
        else:
            if retail_ids:
                match_pos["sucursal_id"] = {"$in": retail_ids}

        return [
            {"$match": match_pos},
            {
                "$project": {
                    "items.descripcion": 1,
                    "items.subtotal": 1,
                    "items.cantidad": 1
                }
            },
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.descripcion",
                    "nombre": {"$first": "$items.descripcion"},
                    "ingresos": {"$sum": {"$toDouble": "$items.subtotal"}},
                    "cantidad": {"$sum": {"$toDouble": "$items.cantidad"}}
                }
            }
        ]

    import time
    t_start = time.time()
    
    # 3. Ejecutar consultas paralelas (Historial + POS) con asyncio.gather
    print(f"[BCG] Iniciando agregaciones en BD...", flush=True)
    t_agg = time.time()
    
    results = await asyncio.gather(
        db["ventas_historicas_crudas"].aggregate(pipeline_for_period(start_date, end_date)).to_list(length=5000),
        db["sales"].aggregate(pos_pipeline_for_period(start_date, end_date)).to_list(length=5000),
        db["ventas_historicas_crudas"].aggregate(pipeline_for_period(prev_start_date, prev_end_date)).to_list(length=5000),
        db["sales"].aggregate(pos_pipeline_for_period(prev_start_date, prev_end_date)).to_list(length=5000)
    )
    
    cursor_current_hist, cursor_current_pos, cursor_prev_hist, cursor_prev_pos = results
    print(f"[BCG Profiling] Agregaciones completadas en {(time.time() - t_agg) * 1000:.2f} ms", flush=True)

    # Consolidar current y prev
    cursor_current = cursor_current_hist + cursor_current_pos
    cursor_prev = cursor_prev_hist + cursor_prev_pos

    # 4. Fusionar datos en RAM
    productos_dict: Dict[str, Dict[str, Any]] = {}

    for doc in cursor_prev:
        pid = str(doc["_id"] or "")
        if not pid:
            continue
        productos_dict[pid] = {
            "nombre": doc.get("nombre") or pid,
            "prev": float(doc.get("ingresos") or 0.0),
            "curr": 0.0,
            "prev_qty": float(doc.get("cantidad") or 0.0),
            "curr_qty": 0.0
        }

    max_revenue = 0.0
    for doc in cursor_current:
        pid = str(doc["_id"] or "")
        if not pid:
            continue
        ingresos_curr = float(doc.get("ingresos") or 0.0)
        cantidad_curr = float(doc.get("cantidad") or 0.0)

        if ingresos_curr > max_revenue:
            max_revenue = ingresos_curr

        if pid in productos_dict:
            productos_dict[pid]["curr"] += ingresos_curr
            productos_dict[pid]["curr_qty"] += cantidad_curr
            productos_dict[pid]["nombre"] = doc.get("nombre") or pid
        else:
            productos_dict[pid] = {
                "nombre": doc.get("nombre") or pid,
                "prev": 0.0,
                "curr": ingresos_curr,
                "prev_qty": 0.0,
                "curr_qty": cantidad_curr
            }

    print(f"[BCG] Total productos únicos: {len(productos_dict)} | Max revenue: {max_revenue}")

    # 5. Calcular métricas BCG y crecimiento general
    crecimientos = []
    
    # Pre-calcular todos los crecimientos para obtener la mediana (Eje Y Dinámico)
    for pid, data in productos_dict.items():
        curr = data["curr"]
        prev = data["prev"]
        if curr == 0 and prev == 0:
            data["crecimiento"] = 0.0
            continue
            
        if prev == 0 and curr > 0:
            data["crecimiento"] = 1.0
        elif prev > 0:
            data["crecimiento"] = (curr - prev) / prev
        else:
            data["crecimiento"] = 0.0
            
        # Considerar para la mediana estadística solo los productos que tuvieron alguna venta o crecimiento
        crecimientos.append(data["crecimiento"])
        
    # Calcular Mediana de Crecimiento (Umbral Eje Y)
    mediana_crecimiento = 0.0
    if crecimientos:
        import statistics
        mediana_crecimiento = statistics.median(crecimientos)
    print(f"[BCG] Mediana de Crecimiento Dinámica (Corte Eje Y): {mediana_crecimiento*100:.2f}%")

    response = BCGMatrixResponse()

    for pid, data in productos_dict.items():
        curr = data["curr"]
        prev = data["prev"]

        # Ignorar si no ha vendido nada en los últimos 2 periodos
        if curr == 0 and prev == 0:
            continue

        # Cuota Relativa (0.0 a 1.0) comparado con la Máxima Estrella actual
        cuota_relativa = (curr / max_revenue) if max_revenue > 0 else 0.0

        crecimiento = data["crecimiento"]

        # Reglas de Clasificación BCG (Umbrales Matemáticos)
        # ALTO CRECIMIENTO: > mediana_crecimiento
        # ALTA CUOTA: >= 0.50 (50% de penetración frente al líder)
        es_alto_crecimiento = crecimiento > mediana_crecimiento
        es_alta_cuota = cuota_relativa >= 0.50

        if es_alto_crecimiento and es_alta_cuota:
            cuadrante = "ESTRELLA"
            estrategia = "Inversión y Mantenimiento de Stock"
        elif not es_alto_crecimiento and es_alta_cuota:
            cuadrante = "VACA"
            estrategia = "Optimización de Costos y Cosecha"
        elif es_alto_crecimiento and not es_alta_cuota:
            cuadrante = "INTERROGANTE"
            estrategia = "Desarrollo Selectivo / Campaña Focalizada"
        else:
            cuadrante = "PERRO"
            estrategia = "Desinversión / Liquidación de Inventario"

        # Generar tendencia legible
        pct = crecimiento * 100
        if prev == 0 and curr > 0:
            tendencia_str = "Nuevo ▲ 100%"
        elif pct >= 0:
            tendencia_str = f"Subió {pct:.1f}%"
        else:
            tendencia_str = f"Bajó {abs(pct):.1f}%"

        bcg_product = BCGProduct(
            producto_id=pid,
            nombre=data["nombre"],
            ingresos_actuales=curr,
            ingresos_anteriores=prev,
            cantidad_vendida=data["curr_qty"],
            cantidad_anterior=data["prev_qty"],
            crecimiento=crecimiento,
            cuota_relativa=cuota_relativa,
            cuadrante=cuadrante,
            estrategia_sugerida=estrategia,
            tendencia_str=tendencia_str,
            badge="up" if crecimiento >= 0 else "down",
            nota="Sugerencia: Liquidación o descontinuar" if cuadrante == "PERRO" and crecimiento < -0.1 else None
        )

        if cuadrante == "ESTRELLA":
            response.estrellas.append(bcg_product)
        elif cuadrante == "VACA":
            response.vacas.append(bcg_product)
        elif cuadrante == "INTERROGANTE":
            response.interrogantes.append(bcg_product)
        else:
            response.perros.append(bcg_product)

    # Ordenar Arrays
    response.estrellas.sort(key=lambda x: x.cuota_relativa, reverse=True)
    response.vacas.sort(key=lambda x: x.cuota_relativa, reverse=True)
    response.interrogantes.sort(key=lambda x: x.crecimiento, reverse=True)
    response.perros.sort(key=lambda x: x.ingresos_actuales, reverse=True)

    # 6. PRINT AUDITORÍA TOP 5 PRODUCTOS EVALUADOS
    all_evaluated = (
        response.estrellas + response.vacas + response.interrogantes + response.perros
    )
    all_evaluated.sort(key=lambda x: x.ingresos_actuales, reverse=True)
    top_5 = all_evaluated[:5]

    print("\n" + "="*125)
    print("AUDITORÍA DE DATOS CRUDOS MATRIZ BCG (TOP 5 PRODUCTOS RETAIL)")
    print("="*125)
    header = f"{'Nombre del Producto':<38} | {'V.Ant (Bs)':<10} | {'V.Act (Bs)':<10} | {'Líder (Bs)':<10} | {'Crec (%)':<9} | {'Cuota (Ratio)':<13} | {'Cuadrante':<12}"
    print(header)
    print("-" * len(header))
    for p in top_5:
        growth_pct = p.crecimiento * 100
        print(f"{p.nombre[:38]:<38} | {p.ingresos_anteriores:<10.2f} | {p.ingresos_actuales:<10.2f} | {max_revenue:<10.2f} | {growth_pct:<9.1f} | {p.cuota_relativa:<13.3f} | {p.cuadrante:<12}")
    print("="*125 + "\n")

    print(f"[BCG] Estrellas: {len(response.estrellas)} | Vacas: {len(response.vacas)} | Interrogantes: {len(response.interrogantes)} | Perros: {len(response.perros)}")

    return response
