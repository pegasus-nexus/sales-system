from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
import time

from app.schemas.analytics import PortfolioResponse, PortfolioProduct

async def get_portfolio_data(
    tenant_id: str,
    start_date: datetime,
    end_date: datetime,
    sucursal_id: Optional[str] = None
) -> PortfolioResponse:
    from app.db import get_raw_db
    db = await get_raw_db()

    if start_date.tzinfo is None: start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None: end_date = end_date.replace(tzinfo=timezone.utc)

    # 1. Resolver Sucursales si aplica
    retail_ids = []
    if not sucursal_id:
        sucursales = await db["sucursales"].find({"tenant_id": tenant_id}).to_list(None)
        for s in sucursales:
            nl = str(s.get("nombre", "")).lower()
            tl = str(s.get("tipo", "")).lower()
            if any(bad in nl for bad in ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista", "supermercados"]):
                continue
            if any(good in nl for good in ["hero", "calacoto", "recoleta"]) or "fisica" in tl or "física" in tl or "retail" in tl:
                try:
                    if ObjectId.is_valid(str(s["_id"])):
                        retail_ids.append(ObjectId(s["_id"]))
                except Exception:
                    pass

    # 2. Pipelines de Agregación
    def pipeline_for_period(start: datetime, end: datetime):
        match: Dict[str, Any] = {
            "fecha_transaccion": {"$gte": start, "$lte": end},
        }
        if tenant_id:
            match["tenant_id"] = tenant_id
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
                    "costo_total": 1,
                    "categoria": 1
                }
            },
            {
                "$group": {
                    "_id": "$nombre_producto",
                    "nombre": {"$first": "$nombre_producto"},
                    "categoria": {"$first": "$categoria"},
                    "ventas": {"$sum": "$monto_total_bs"},
                    "cantidad": {"$sum": {"$toDouble": "$cantidad_vendida"}},
                    "costo": {"$sum": "$costo_total"}
                }
            }
        ]

    def pos_pipeline_for_period(start: datetime, end: datetime):
        match_pos: Dict[str, Any] = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start, "$lte": end},
            "tenant_id": tenant_id
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
            {"$unwind": "$items"},
            {
                "$project": {
                    "items.descripcion": 1,
                    "items.subtotal": 1,
                    "items.cantidad": 1,
                    "items.costo_unitario": 1
                }
            },
            {
                "$group": {
                    "_id": "$items.descripcion",
                    "nombre": {"$first": "$items.descripcion"},
                    "ventas": {"$sum": {"$toDouble": "$items.subtotal"}},
                    "cantidad": {"$sum": {"$toDouble": "$items.cantidad"}},
                    "costo": {"$sum": {"$multiply": [{"$toDouble": "$items.costo_unitario"}, {"$toDouble": "$items.cantidad"}]}}
                }
            }
        ]

    # Ejecutar ambas consultas en paralelo
    import asyncio
    coroutines = [
        db["ventas_historicas_crudas"].aggregate(pipeline_for_period(start_date, end_date)).to_list(length=5000),
        db["sales"].aggregate(pos_pipeline_for_period(start_date, end_date)).to_list(length=5000)
    ]
    results = await asyncio.gather(*coroutines)
    hist_results, pos_results = results[0], results[1]

    # Unificar productos
    productos_dict = {}

    def merge_product(doc):
        pid = str(doc["_id"])
        if pid not in productos_dict:
            productos_dict[pid] = {
                "nombre": doc.get("nombre") or pid,
                "categoria": doc.get("categoria") or "Uncategorized",
                "ventas": 0.0,
                "cantidad": 0.0,
                "costo": 0.0
            }
        
        # Prefer historical category if exists and currently uncategorized
        if "categoria" in doc and doc["categoria"] and productos_dict[pid]["categoria"] == "Uncategorized":
             productos_dict[pid]["categoria"] = doc["categoria"]

        productos_dict[pid]["ventas"] += float(doc.get("ventas", 0))
        productos_dict[pid]["cantidad"] += float(doc.get("cantidad", 0))
        productos_dict[pid]["costo"] += float(doc.get("costo", 0))

    for doc in hist_results:
        merge_product(doc)
    
    for doc in pos_results:
        merge_product(doc)

    # Convertir a Pydantic
    final_products = []
    for pid, data in productos_dict.items():
        if data["ventas"] <= 0 and data["cantidad"] <= 0:
            continue
            
        margen = data["ventas"] - data["costo"]
        final_products.append(
            PortfolioProduct(
                producto_id=pid,
                nombre=data["nombre"],
                categoria=data["categoria"],
                ventas=data["ventas"],
                cantidad=data["cantidad"],
                margen=margen
            )
        )

    # Sort descending by ventas
    final_products.sort(key=lambda x: x.ventas, reverse=True)

    period_str = start_date.strftime("%Y-%m")
    
    return PortfolioResponse(
        period=period_str,
        products=final_products
    )
