# -*- coding: utf-8 -*-
"""
Servicio Unificado de Ventas Diarias Oficiales (SSOT).
Proporciona la función centralizada `get_official_daily_sales` para ser reutilizada
tanto por el Reporte Diario de Ventas (/reports/daily) como por el Dashboard General.
"""
from typing import Dict, Any, Optional
from decimal import Decimal
from datetime import datetime

from app.db import get_raw_db
from app.domain.models.sucursal import Sucursal

_ZERO = Decimal("0")

async def get_official_daily_sales(
    tenant_id: str,
    start_dt: datetime,
    end_dt: datetime,
    sucursal_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    SINGLE SOURCE OF TRUTH (SSOT):
    Calcula de manera centralizada las ventas netas reales pagadas en el POS (campo total)
    excluyendo tickets anulados. Usa PyMongo raw para máxima tolerancia a esquemas históricos.
    """
    db = await get_raw_db()
    if not tenant_id or tenant_id == "default":
        tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    # 1. Mapeo de sucursales del tenant
    sucursales = await db.sucursales.find({"tenant_id": tenant_id}).to_list(length=None)
    suc_map = {str(s["_id"]): str(s.get("nombre", "")) for s in sucursales}

    # 2. Filtro principal de búsqueda
    match_query = {
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }

    if sucursal_id and sucursal_id != "all" and sucursal_id != "CENTRAL":
        match_query["sucursal_id"] = sucursal_id

    sales = await db.sales.find(match_query).to_list(length=None)

    # 3. Fallback a ventas_historicas_crudas si sales no contiene registros para este rango
    hist_match = {
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start_dt, "$lte": end_dt},
        "estado": {"$ne": "anulado"}
    }
    if sucursal_id and sucursal_id != "all" and sucursal_id != "CENTRAL":
        hist_match["sucursal"] = {"$regex": sucursal_id, "$options": "i"}

    hist_sales = await db.ventas_historicas_crudas.find(hist_match).to_list(length=None)

    total_ventas = _ZERO
    total_descuentos = _ZERO
    anuladas_count = 0
    anuladas_monto = _ZERO

    por_sucursal: Dict[str, float] = {}

    for s in sales:
        is_anulada = bool(s.get("anulada", False)) or str(s.get("estado", "")).lower() == "anulado"
        monto_ticket = Decimal(str(s.get("total", 0)))

        if is_anulada:
            anuladas_count += 1
            anuladas_monto += monto_ticket
            continue

        total_ventas += monto_ticket

        # Calcular descuento si existe
        try:
            raw_d = s.get("descuento", 0)
            if isinstance(raw_d, (int, float, str, Decimal)):
                disc_val = Decimal(str(raw_d))
            else:
                disc_val = _ZERO
        except Exception:
            disc_val = _ZERO
        total_descuentos += disc_val

        # Agrupar por nombre de sucursal
        sid = str(s.get("sucursal_id", ""))
        sname = suc_map.get(sid, str(s.get("sucursal", "Desconocido")))
        
        # Normalizar nombres de retail
        sname_norm = "Heroínas" if "hero" in sname.lower() else "Recoleta" if "recoleta" in sname.lower() else "Calacoto" if "calacoto" in sname.lower() else sname
        
        por_sucursal[sname_norm] = por_sucursal.get(sname_norm, 0.0) + float(monto_ticket)

    for hs in hist_sales:
        monto_hist = Decimal(str(hs.get("monto_total_bs", 0)))
        total_ventas += monto_hist
        sname_h = str(hs.get("sucursal", "Heroínas"))
        sname_h_norm = "Heroínas" if "hero" in sname_h.lower() else "Recoleta" if "recoleta" in sname_h.lower() else "Calacoto" if "calacoto" in sname_h.lower() else sname_h
        por_sucursal[sname_h_norm] = por_sucursal.get(sname_h_norm, 0.0) + float(monto_hist)

    return {
        "total_ventas": float(total_ventas),
        "total_descuentos": float(total_descuentos),
        "anuladas_count": anuladas_count,
        "anuladas_monto": float(anuladas_monto),
        "sucursales": por_sucursal,
        "raw_sales": sales
    }
