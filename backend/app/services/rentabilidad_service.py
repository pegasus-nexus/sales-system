"""
rentabilidad_service.py — OPTIMIZADO
=====================================
- Queries paralelas con asyncio.gather
- Caché en memoria (60s TTL para 'today', 300s para el resto)
- Aggregation pipelines en MongoDB para reducir data transfer
"""

import asyncio
import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.db import get_raw_db

# ─── Caché en memoria ─────────────────────────────────────────────────────────
_rent_cache: Dict[str, tuple] = {}

# IDs de sucursales RETAIL (Heroínas, Recoleta, Calacoto).
# Solo estas se cuentan por defecto, igual que el dashboard.
# Excluye: Distribución, Fuerza de Ventas, Supermercados, FEXCO, etc.
SUCURSALES_RETAIL_IDS = [
    "69cd80098f3f6866d4cfbb64",  # Suc. Heroinas
    "69cd84c58f3f6866d4cfbc8b",  # Suc. Recoleta
    "69ce6b7e8a00124dac6ecc99",  # Suc. Calacoto
    "69d7a199640252a16936cb0b",  # Vendedor: Rodrigo.heroinas (asoc. Heroinas)
]

# Sucursales retail en historial (nombres que matchean)
SUCURSALES_RETAIL_HIST_REGEX = r"hero|recoleta|calacoto|rodrigo"

def _suc_regex(sucursal_id: str) -> dict:
    s = sucursal_id.lower()
    if "hero" in s:
        return {"$regex": "hero.*nas?", "$options": "i"}
    return {"$regex": s, "$options": "i"}


async def get_rentabilidad_real(
    tenant_id: str,
    start_date: datetime,
    end_date: datetime,
    sucursal_id: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Tabla de rentabilidad por producto con costos REALES.
    Usa asyncio.gather para lanzar todas las queries en paralelo.
    """
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)

    # Caché key — incluye hora exacta para evitar colisiones entre rangos
    now_ts = time.time()
    # "Hoy" en Bolivia (UTC-4): comparar fecha local Bolivia
    from datetime import timedelta
    bolivia_offset = timedelta(hours=-4)
    hoy_bo = (datetime.now(timezone.utc) + bolivia_offset).date()
    start_bo = (start_date.astimezone(timezone.utc) + bolivia_offset).date()
    end_bo   = (end_date.astimezone(timezone.utc) + bolivia_offset).date()
    is_today = (start_bo == end_bo == hoy_bo)
    ttl = 20 if is_today else 300
    cache_key = f"rent_{sucursal_id}_{start_date.isoformat()}_{end_date.isoformat()}_{limit}"
    if cache_key in _rent_cache:
        cached_ts, cached_data = _rent_cache[cache_key]
        if now_ts - cached_ts < ttl:
            return cached_data

    db = await get_raw_db()

    # ── Resolver sucursal_ids en paralelo con los demás queries ───────────────
    async def get_suc_ids():
        if not sucursal_id:
            return None
        docs = await db.sucursales.find(
            {"nombre": _suc_regex(sucursal_id)}, {"_id": 1}
        ).to_list(20)
        return [str(d["_id"]) for d in docs]

    async def get_product_costs():
        prods = await db.products.find(
            {}, {"descripcion": 1, "costo_producto": 1, "proveedor": 1}
        ).to_list(5000)
        costs: Dict[str, dict] = {}
        for p in prods:
            k = str(p.get("descripcion", "")).strip().upper()
            try:
                costs[k] = {
                    "costo": float(str(p.get("costo_producto", 0))),
                    "proveedor": str(p.get("proveedor", "")).strip().lower()
                }
            except Exception:
                costs[k] = {"costo": 0.0, "proveedor": ""}
        return costs

    async def get_suc_names():
        docs = await db.sucursales.find({}, {"_id": 1, "nombre": 1}).to_list(100)
        m = {str(d["_id"]): d["nombre"] for d in docs}
        m["CENTRAL"] = "Central"
        return m

    # Lanzar lookup de sucursal_ids + costos + nombres de sucursal EN PARALELO
    suc_ids, product_costs, suc_name_map = await asyncio.gather(
        get_suc_ids(),
        get_product_costs(),
        get_suc_names(),
    )

    # ── Build match filters ────────────────────────────────────────────────────
    pos_match: Dict[str, Any] = {
        "anulada": {"$ne": True},
        "created_at": {"$gte": start_date, "$lte": end_date},
    }
    if suc_ids:
        # Filtro por sucursal específica pedida por el usuario
        pos_match["sucursal_id"] = {"$in": suc_ids}
    elif sucursal_id:
        pos_match["sucursal_id"] = {"$regex": sucursal_id, "$options": "i"}
    else:
        # Sin filtro explícito → solo sucursales RETAIL (igual que el dashboard)
        pos_match["sucursal_id"] = {"$in": SUCURSALES_RETAIL_IDS}

    hist_match: Dict[str, Any] = {
        "fecha_transaccion": {"$gte": start_date, "$lte": end_date},
    }
    if sucursal_id:
        hist_match["sucursal"] = _suc_regex(sucursal_id)
    else:
        # Solo historial de sucursales retail
        hist_match["sucursal"] = {"$regex": SUCURSALES_RETAIL_HIST_REGEX, "$options": "i"}

    # ── Pipelines de aggregation (procesan en MongoDB, no en Python) ──────────
    pos_pipeline = [
        {"$match": pos_match},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.descripcion",
            "unidades":        {"$sum": {"$toInt": "$items.cantidad"}},
            "ingreso_bruto":   {"$sum": {"$toDouble": "$items.subtotal"}},
            "costo_real":      {"$sum": {"$multiply": [
                {"$toDouble": "$items.costo_unitario"},
                {"$toDouble": "$items.cantidad"}
            ]}},
            "descuentos":      {"$sum": {"$multiply": [
                {"$toDouble": "$items.descuento_unitario"},
                {"$toDouble": "$items.cantidad"}
            ]}},
            "producto_id_ref": {"$first": "$items.producto_id"},
        }},
    ]

    hist_pipeline = [
        {"$match": hist_match},
        {"$group": {
            "_id": "$nombre_producto",
            "unidades":      {"$sum": {"$toDouble": {"$ifNull": ["$cantidad_vendida", 1]}}},
            "ingreso_bruto": {"$sum": {"$toDouble": "$monto_total_bs"}},
        }},
    ]

    # ── Lanzar POS + Historial EN PARALELO ────────────────────────────────────
    pos_docs, hist_docs = await asyncio.gather(
        db.sales.aggregate(pos_pipeline).to_list(5000),
        db.ventas_historicas_crudas.aggregate(hist_pipeline).to_list(5000),
    )

    # ── Construir mapas ───────────────────────────────────────────────────────
    pos_map: Dict[str, dict] = {}
    for d in pos_docs:
        name = str(d["_id"] or "Sin nombre").strip()
        name_key = name.upper()
        pos_map[name_key] = {
            "nombre":          name,
            "unidades":        int(d.get("unidades", 0)),
            "ingreso_bruto":   float(d.get("ingreso_bruto", 0)),
            "costo_real_pos":  float(d.get("costo_real", 0)),
            "descuentos":      float(d.get("descuentos", 0)),
            "producto_id_ref": str(d.get("producto_id_ref", "")),
            "fuente": "POS",
        }

    hist_map: Dict[str, dict] = {}
    for d in hist_docs:
        name = str(d["_id"] or "Sin nombre").strip()
        name_key = name.upper()
        unidades = float(d.get("unidades", 1) or 1)
        ingreso  = float(d.get("ingreso_bruto", 0))
        prod_info = product_costs.get(name_key, {"costo": 0.0, "proveedor": ""})
        costo_base = prod_info["costo"]
        hist_map[name_key] = {
            "nombre":          name,
            "unidades":        unidades,
            "ingreso_bruto":   ingreso,
            "costo_real_pos":  costo_base * unidades,
            "descuentos":      0.0,
            "producto_id_ref": "",
            "fuente": "HIST",
        }

    # ── MERGE ──────────────────────────────────────────────────────────────────
    # REGLA ANTI-DUPLICADO:
    # Las ventas POS se copian automáticamente a ventas_historicas_crudas.
    # Por eso: si un producto tiene datos POS en ese período → usar SOLO POS.
    # El historial solo aporta productos que NO aparecen en POS (ej: datos importados
    # de períodos anteriores al sistema POS).
    merged: Dict[str, dict] = {}

    # 1. Poblar con pos_map primero (fuente más confiable y sin duplicados)
    for name_key, data in pos_map.items():
        merged[name_key] = dict(data)

    # 2. Agregar del historial SOLO los productos que NO tienen dato POS
    for name_key, data in hist_map.items():
        if name_key not in merged:
            merged[name_key] = dict(data)

    # ── STOCK: query en paralelo al inventario ────────────────────────────────
    prod_ids = list({v["producto_id_ref"] for v in merged.values() if v.get("producto_id_ref")})
    inv_docs = await db.inventario.find(
        {"producto_id": {"$in": prod_ids}},
        {"producto_id": 1, "sucursal_id": 1, "cantidad": 1}
    ).to_list(50000)

    stock_map: Dict[str, Dict[str, int]] = {}
    for inv in inv_docs:
        pid   = str(inv.get("producto_id", ""))
        sname = suc_name_map.get(str(inv.get("sucursal_id", "")), str(inv.get("sucursal_id", "")))
        qty   = int(inv.get("cantidad", 0) or 0)
        stock_map.setdefault(pid, {})[sname] = qty

    # ── Calcular métricas finales ─────────────────────────────────────────────
    result = []
    for name_key, d in merged.items():
        ingreso  = d["ingreso_bruto"]
        unidades = d["unidades"]
        
        prod_info = product_costs.get(name_key, {"costo": 0.0, "proveedor": ""})
        costo_base = prod_info["costo"]
        proveedor = prod_info["proveedor"]
        
        costo_real = d["costo_real_pos"] if d["costo_real_pos"] > 0 else (costo_base * unidades)
        
        # Regla Taboada (alineada al Dashboard)
        es_taboada = "taboada" in proveedor
        if es_taboada:
            # Matriz gana el 15% sobre el costo base de los productos
            ganancia_matriz = costo_real * 0.15
            # La sucursal gana la diferencia entre el ingreso y el costo base
            ganancia_suc = ingreso - costo_real
        else:
            ganancia_matriz = 0.0
            ganancia_suc = ingreso - costo_real
            
        margen_pct = (ganancia_suc / ingreso * 100) if ingreso > 0 else 0.0
        
        result.append({
            "nombre":          d["nombre"],
            "unidades":        int(unidades),
            "ingreso_bruto":   round(ingreso, 2),
            "costo_real":      round(costo_real, 2),
            "ganancia_suc":    round(ganancia_suc, 2),
            "ganancia_matriz": round(ganancia_matriz, 2),
            "descuentos":      round(d["descuentos"], 2),
            "margen_pct":      round(margen_pct, 1),
            "precio_prom":     round(ingreso / unidades, 2) if unidades > 0 else 0.0,
            "costo_prom":      round(costo_base, 2) if costo_base > 0 else (round(costo_real / unidades, 2) if unidades > 0 else 0.0),
            "stock":           stock_map.get(d.get("producto_id_ref", ""), {}),
            "fuente":          d.get("fuente", "?"),
        })

    result.sort(key=lambda x: x["ingreso_bruto"], reverse=True)
    result = result[:limit]

    # Guardar en caché
    _rent_cache[cache_key] = (time.time(), result)
    return result


async def get_kpis_reales(
    tenant_id: str,
    start_date: datetime,
    end_date: datetime,
    sucursal_id: Optional[str] = None,
) -> Dict[str, Any]:
    productos = await get_rentabilidad_real(tenant_id, start_date, end_date, sucursal_id, limit=5000)
    ingreso  = sum(p["ingreso_bruto"]   for p in productos)
    costo    = sum(p["costo_real"]       for p in productos)
    gan_suc  = sum(p["ganancia_suc"]     for p in productos)
    gan_mat  = sum(p["ganancia_matriz"]  for p in productos)
    return {
        "ingreso_bruto":   round(ingreso, 2),
        "costo_real":      round(costo, 2),
        "ganancia_suc":    round(gan_suc, 2),
        "ganancia_matriz": round(gan_mat, 2),
        "margen_pct":      round((gan_suc / ingreso * 100) if ingreso > 0 else 0, 1),
    }

