import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from zoneinfo import ZoneInfo
from app.db import get_raw_db

BOLIVIA_TZ = ZoneInfo("America/La_Paz")

async def get_bcg_matrix(
    tenant_id: str,
    sucursal_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Calcula la Matriz BCG completa agrupando ventas del mes actual y mes anterior.
    Aísla las ventas estrictamente por sucursal cuando se especifica sucursal_id.
    """
    tenant_id = tenant_id or "69cd7f0a8f3f6866d4cfbb62"
    db = await get_raw_db()
    
    # 1. Definir fechas (Mes Actual y Mes Anterior) en hora local de Bolivia
    now_local = datetime.now(BOLIVIA_TZ)
    
    current_start_local = now_local.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now_local.month == 1:
        prev_start_local = now_local.replace(year=now_local.year-1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        prev_start_local = now_local.replace(month=now_local.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    prev_end_local = current_start_local

    # Fechas para sales (UTC)
    current_start_utc = current_start_local.astimezone(timezone.utc)
    now_utc = now_local.astimezone(timezone.utc)
    prev_start_utc = prev_start_local.astimezone(timezone.utc)
    prev_end_utc = prev_end_local.astimezone(timezone.utc)

    # Fechas para ventas históricas crudas (Naive Local)
    current_start_naive = current_start_local.replace(tzinfo=None)
    now_naive = now_local.replace(tzinfo=None)
    prev_start_naive = prev_start_local.replace(tzinfo=None)
    prev_end_naive = prev_end_local.replace(tzinfo=None)

    req_suc = (sucursal_id or "").strip().lower()
    es_global = not req_suc or req_suc in ["todas", "global", "all"]

    # 2. Pipelines con filtrado aislado por sucursal
    def build_hist_pipeline(start: datetime, end: datetime):
        match: Dict[str, Any] = {
            "fecha_transaccion": {"$gte": start, "$lt": end},
        }
        if tenant_id:
            match["tenant_id"] = str(tenant_id)
            
        if not es_global:
            pattern = "hero.*nas?" if "hero" in req_suc else f".*{req_suc}.*"
            match["sucursal"] = {"$regex": pattern, "$options": "i"}

        return [
            {"$match": match},
            {"$group": {
                "_id": "$nombre_producto",
                "ventas": {"$sum": "$monto_total_bs"},
                "costo": {"$sum": "$costo_total"}
            }}
        ]

    def build_pos_pipeline(start: datetime, end: datetime):
        match_pos: Dict[str, Any] = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start, "$lt": end},
            "tenant_id": str(tenant_id)
        }
        
        if not es_global:
            pattern = "hero.*nas?" if "hero" in req_suc else f".*{req_suc}.*"
            match_pos["$or"] = [
                {"sucursal": {"$regex": pattern, "$options": "i"}},
                {"sucursal_id": {"$regex": pattern, "$options": "i"}},
                {"sucursal_nombre": {"$regex": pattern, "$options": "i"}}
            ]

        return [
            {"$match": match_pos},
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.descripcion",
                "ventas": {"$sum": {"$toDouble": "$items.subtotal"}},
                "costo": {"$sum": {"$multiply": [{"$toDouble": "$items.costo_unitario"}, {"$toDouble": "$items.cantidad"}]}}
            }}
        ]

    # 3. Consultas en paralelo
    product_query = {"tenant_id": tenant_id} if tenant_id else {}
    
    coroutines = [
        db["products"].find(product_query, {"descripcion": 1, "codigo_corto": 1, "categoria_id": 1}).to_list(length=3000),
        db["categories"].find(product_query).to_list(length=500),
        db["ventas_historicas_crudas"].aggregate(build_hist_pipeline(current_start_naive, now_naive)).to_list(length=5000),
        db["sales"].aggregate(build_pos_pipeline(current_start_utc, now_utc)).to_list(length=5000),
        db["ventas_historicas_crudas"].aggregate(build_hist_pipeline(prev_start_naive, prev_end_naive)).to_list(length=5000),
        db["sales"].aggregate(build_pos_pipeline(prev_start_utc, prev_end_utc)).to_list(length=5000)
    ]
    
    results = await asyncio.gather(*coroutines)
    products_db, categories_db, curr_hist, curr_pos, prev_hist, prev_pos = results

    cat_map = {str(c["_id"]): c.get("name", "Sin Categoría") for c in categories_db}

    # 4. Consolidar ventas aisladas por sucursal
    current_sales_map = {}
    prev_sales_map = {}

    def merge_sales(docs, target_map):
        for doc in docs:
            pid = str(doc["_id"]).strip().upper()
            if not pid: continue
            if pid not in target_map:
                target_map[pid] = {"ventas": 0.0, "costo": 0.0}
            target_map[pid]["ventas"] += float(doc.get("ventas", 0))
            target_map[pid]["costo"] += float(doc.get("costo", 0))

    merge_sales(curr_hist, current_sales_map)
    merge_sales(curr_pos, current_sales_map)
    merge_sales(prev_hist, prev_sales_map)
    merge_sales(prev_pos, prev_sales_map)

    total_ventas_actuales = sum(data["ventas"] for data in current_sales_map.values())
    avg_participacion = (100.0 / len(products_db)) if products_db else 0

    # 5. Generar Array Final Aislado
    nombre_sucursal_display = "Global" if es_global else sucursal_id.capitalize()
    
    bcg_results = []
    
    for prod in products_db:
        prod_id = str(prod["_id"])
        nombre = prod.get("descripcion") or "Producto Desconocido"
        nombre_key = nombre.strip().upper()
        
        cat_id = prod.get("categoria_id")
        categoria = cat_map.get(str(cat_id), "Sin Categoría")

        curr_data = current_sales_map.get(nombre_key, {"ventas": 0.0, "costo": 0.0})
        ventas_actuales = curr_data["ventas"]
        costo_actual = curr_data["costo"]
        margen_absoluto = ventas_actuales - costo_actual

        prev_data = prev_sales_map.get(nombre_key, {"ventas": 0.0, "costo": 0.0})
        ventas_pasadas = prev_data["ventas"]

        # Eje Y: Crecimiento
        if ventas_pasadas > 0:
            crecimiento = ((ventas_actuales - ventas_pasadas) / ventas_pasadas) * 100.0
        elif ventas_actuales > 0:
            crecimiento = 100.0
        else:
            crecimiento = 0.0

        # Eje X: Participación Relativa
        if total_ventas_actuales > 0:
            participacion = (ventas_actuales / total_ventas_actuales) * 100.0
        else:
            participacion = 0.0

        # Eje Z: Margen Pct
        if ventas_actuales > 0:
            margen_pct = (margen_absoluto / ventas_actuales) * 100.0
        else:
            margen_pct = 0.0

        cuadrante = 'Perro'
        if participacion > avg_participacion and crecimiento >= 10:
            cuadrante = 'Estrella'
        elif participacion <= avg_participacion and crecimiento >= 10:
            cuadrante = 'Interrogante'
        elif participacion > avg_participacion and crecimiento < 10:
            cuadrante = 'Vaca Lechera'
        else:
            cuadrante = 'Perro'

        bcg_results.append({
            "id": prod_id,
            "name": nombre,
            "categoria": categoria,
            "sucursal": nombre_sucursal_display,
            "ventas": round(ventas_actuales, 2),
            "participacion": round(participacion, 2),
            "crecimiento": round(crecimiento, 2),
            "margen": round(margen_pct, 2),
            "cuadrante": cuadrante,
            "vsMesAnterior": f"+{round(crecimiento, 1)}%" if crecimiento >= 0 else f"{round(crecimiento, 1)}%"
        })

    bcg_results.sort(key=lambda x: x["ventas"], reverse=True)
    return bcg_results
