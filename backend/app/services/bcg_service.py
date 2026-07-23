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
    from app.db import get_raw_db
    db = await get_raw_db()

    from datetime import timezone
    if start_date.tzinfo is None: start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None: end_date = end_date.replace(tzinfo=timezone.utc)
    
    delta = end_date - start_date
    
    periods = [
        (start_date, end_date),
        (start_date - delta, start_date),
        (start_date - 2*delta, start_date - delta),
        (start_date - 3*delta, start_date - 2*delta)
    ]

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
            match["sucursal"] = {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}

        return [
            {"$match": match},
            {
                "$project": {
                    "nombre_producto": 1,
                    "monto_total_bs": 1,
                    "cantidad_vendida": 1,
                    "costo_unitario": 1
                }
            },
            {
                "$group": {
                    "_id": "$nombre_producto",
                    "nombre": {"$first": "$nombre_producto"},
                    "ingresos": {"$sum": {"$toDouble": "$monto_total_bs"}},
                    "costo": {
                        "$sum": {
                            "$multiply": [
                                {"$toDouble": {"$ifNull": ["$costo_unitario", 0]}},
                                {"$toDouble": "$cantidad_vendida"}
                            ]
                        }
                    },
                    "cantidad": {"$sum": {"$toDouble": "$cantidad_vendida"}}
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
                    "items.cantidad": 1,
                    "items.costo_unitario": 1
                }
            },
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.descripcion",
                    "nombre": {"$first": "$items.descripcion"},
                    "ingresos": {"$sum": {"$toDouble": "$items.subtotal"}},
                    "costo": {
                        "$sum": {
                            "$multiply": [
                                {"$toDouble": {"$ifNull": ["$items.costo_unitario", 0]}},
                                {"$toDouble": "$items.cantidad"}
                            ]
                        }
                    },
                    "cantidad": {"$sum": {"$toDouble": "$items.cantidad"}}
                }
            }
        ]

    t_agg = time.time()
    
    coroutines = []
    for p_start, p_end in periods:
        coroutines.append(db["ventas_historicas_crudas"].aggregate(pipeline_for_period(p_start, p_end)).to_list(length=5000))
        coroutines.append(db["sales"].aggregate(pos_pipeline_for_period(p_start, p_end)).to_list(length=5000))
        
    results = await asyncio.gather(*coroutines)
    print(f"[BCG Profiling] Agregaciones completadas en {(time.time() - t_agg) * 1000:.2f} ms", flush=True)

    productos_dict: Dict[str, Dict[str, Any]] = {}
    max_revenues = [0.0, 0.0, 0.0, 0.0]

    for p_idx in range(4):
        cursor_hist = results[p_idx * 2]
        cursor_pos = results[p_idx * 2 + 1]
        cursor_combined = cursor_hist + cursor_pos
        
        for doc in cursor_combined:
            pid = str(doc["_id"] or "")
            if not pid:
                continue
            
            ing = float(doc.get("ingresos") or 0.0)
            cst = float(doc.get("costo") or 0.0)
            qty = float(doc.get("cantidad") or 0.0)
            
            if ing > max_revenues[p_idx]:
                max_revenues[p_idx] = ing
                
            if pid not in productos_dict:
                productos_dict[pid] = {
                    "nombre": doc.get("nombre") or pid,
                    "data": [
                        {"ingresos": 0.0, "costo": 0.0, "cantidad": 0.0},
                        {"ingresos": 0.0, "costo": 0.0, "cantidad": 0.0},
                        {"ingresos": 0.0, "costo": 0.0, "cantidad": 0.0},
                        {"ingresos": 0.0, "costo": 0.0, "cantidad": 0.0}
                    ]
                }
                
            productos_dict[pid]["nombre"] = doc.get("nombre") or pid
            productos_dict[pid]["data"][p_idx]["ingresos"] += ing
            productos_dict[pid]["data"][p_idx]["costo"] += cst
            productos_dict[pid]["data"][p_idx]["cantidad"] += qty

    crecimientos_p0 = []
    
    def calc_growth(curr, prev):
        if curr == 0 and prev == 0: return 0.0
        if prev == 0 and curr > 0: return 1.0
        if prev > 0: return (curr - prev) / prev
        return 0.0

    for pid, p_data in productos_dict.items():
        grw = calc_growth(p_data["data"][0]["ingresos"], p_data["data"][1]["ingresos"])
        p_data["crecimiento_p0"] = grw
        crecimientos_p0.append(grw)
        
    mediana_crecimiento = 0.0
    if crecimientos_p0:
        import statistics
        mediana_crecimiento = statistics.median(crecimientos_p0)

    response = BCGMatrixResponse()

    for pid, p_data in productos_dict.items():
        data = p_data["data"]
        curr = data[0]["ingresos"]
        prev = data[1]["ingresos"]

        if curr == 0 and prev == 0:
            continue

        cuota_relativa = (curr / max_revenues[0]) if max_revenues[0] > 0 else 0.0
        crecimiento = p_data["crecimiento_p0"]
        margen_p0 = curr - data[0]["costo"]

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

        pct = crecimiento * 100
        if prev == 0 and curr > 0:
            tendencia_str = "Nuevo ▲ 100%"
        elif pct >= 0:
            tendencia_str = f"Subió {pct:.1f}%"
        else:
            tendencia_str = f"Bajó {abs(pct):.1f}%"

        grw_p1 = calc_growth(data[1]["ingresos"], data[2]["ingresos"])
        cuota_p1 = (data[1]["ingresos"] / max_revenues[1]) if max_revenues[1] > 0 else 0.0
        margen_p1 = data[1]["ingresos"] - data[1]["costo"]
        
        grw_p2 = calc_growth(data[2]["ingresos"], data[3]["ingresos"])
        cuota_p2 = (data[2]["ingresos"] / max_revenues[2]) if max_revenues[2] > 0 else 0.0
        margen_p2 = data[2]["ingresos"] - data[2]["costo"]

        history = [
            {"period": "-1", "cuota_relativa": cuota_p1, "crecimiento": grw_p1, "margen_ganancia": margen_p1, "ingresos": data[1]["ingresos"], "cantidad": data[1]["cantidad"]},
            {"period": "-2", "cuota_relativa": cuota_p2, "crecimiento": grw_p2, "margen_ganancia": margen_p2, "ingresos": data[2]["ingresos"], "cantidad": data[2]["cantidad"]}
        ]

        bcg_product = BCGProduct(
            producto_id=pid,
            nombre=p_data["nombre"],
            ingresos_actuales=curr,
            ingresos_anteriores=prev,
            cantidad_vendida=data[0]["cantidad"],
            cantidad_anterior=data[1]["cantidad"],
            crecimiento=crecimiento,
            cuota_relativa=cuota_relativa,
            cuadrante=cuadrante,
            estrategia_sugerida=estrategia,
            margen_ganancia=margen_p0,
            history=history,
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

    response.estrellas.sort(key=lambda x: x.cuota_relativa, reverse=True)
    response.vacas.sort(key=lambda x: x.cuota_relativa, reverse=True)
    response.interrogantes.sort(key=lambda x: x.crecimiento, reverse=True)
    response.perros.sort(key=lambda x: x.ingresos_actuales, reverse=True)

    return response
