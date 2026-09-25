from fastapi import APIRouter, Depends, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
import pytz
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User, UserRole
from app.domain.models.sale import Sale
from app.domain.models.compra import PurchaseOrder
from app.domain.models.sucursal import Sucursal
from app.domain.models.tenant import Tenant
import motor.motor_asyncio

router = APIRouter()
LA_PAZ_TZ = pytz.timezone("America/La_Paz")

@router.get("")
async def get_dashboard_matriz(
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or ""
    
    # Time boundaries in UTC
    now_lp = datetime.now(LA_PAZ_TZ)
    start_of_today_lp = now_lp.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_today_lp = start_of_today_lp + timedelta(days=1)
    
    start_of_month_lp = now_lp.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_year_lp = now_lp.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Convert to UTC for DB queries
    start_of_today_utc = start_of_today_lp.astimezone(pytz.UTC)
    end_of_today_utc = end_of_today_lp.astimezone(pytz.UTC)
    start_of_month_utc = start_of_month_lp.astimezone(pytz.UTC)
    start_of_year_utc = start_of_year_lp.astimezone(pytz.UTC)

    match_filter = {"tenant_id": tenant_id}
    if sucursal_id and sucursal_id != "all":
        match_filter["sucursal_id"] = sucursal_id
        
    # --- 1. Ventas Hoy ---
    ventas_hoy_match = {**match_filter, "created_at": {"$gte": start_of_today_utc, "$lt": end_of_today_utc}, "estado_pago": {"$ne": "ANULADO"}}
    ventas_hoy_agg = await Sale.get_motor_collection().aggregate([
        {"$match": ventas_hoy_match},
        {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    
    ventas_hoy = float(str(ventas_hoy_agg[0]["total"])) if ventas_hoy_agg else 0.0
    transacciones_ventas = int(ventas_hoy_agg[0]["count"]) if ventas_hoy_agg else 0

    # --- 2. Transacciones Compras Hoy ---
    compras_hoy_match = {**match_filter, "created_at": {"$gte": start_of_today_utc, "$lt": end_of_today_utc}}
    compras_hoy_count = await PurchaseOrder.find(compras_hoy_match).count()

    # --- 3. Anulaciones Hoy ---
    anulaciones_match = {**match_filter, "created_at": {"$gte": start_of_today_utc, "$lt": end_of_today_utc}, "estado_pago": "ANULADO"}
    anulaciones_hoy = await Sale.find(anulaciones_match).count()

    # --- 4. Personal Activo Hoy y sus Ventas ---
    # Group by cashier for today's sales
    cajeros_agg = await Sale.get_motor_collection().aggregate([
        {"$match": ventas_hoy_match},
        {"$group": {"_id": "$cajero_id", "total_vendido": {"$sum": "$total"}, "count": {"$sum": 1}}}
    ]).to_list(None)
    
    sales_by_user = {str(c["_id"]): c for c in cajeros_agg if c["_id"]}

    # All users for this tenant
    all_users = await User.find({"tenant_id": current_user.tenant_id, "is_active": True}).to_list()
    personal_activo = []
    
    now_utc = datetime.now(timezone.utc)

    for user in all_users:
        uid = str(user.id)
        has_sales = uid in sales_by_user
        
        # Online status calculation (same as users.py)
        is_online = False
        if user.last_active_at:
            last_active = user.last_active_at
            if last_active.tzinfo is None:
                last_active = last_active.replace(tzinfo=timezone.utc)
            diff_seconds = (now_utc - last_active).total_seconds()
            if diff_seconds <= 180:
                is_online = True
        
        if is_online or has_sales:
            p_data = sales_by_user.get(uid, {"total_vendido": 0, "count": 0})
            personal_activo.append({
                "id": uid,
                "nombre": user.full_name or user.username,
                "ventas_hoy": float(str(p_data["total_vendido"])),
                "transacciones": int(str(p_data["count"])),
                "is_online": is_online
            })
    
    # Sort by online first, then by sales desc
    personal_activo.sort(key=lambda x: (x["is_online"], x["ventas_hoy"]), reverse=True)

    # --- 5. Productos más vendidos hoy ---
    # We unwind items and sum quantities
    top_products_agg = await Sale.get_motor_collection().aggregate([
        {"$match": ventas_hoy_match},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.producto_id",
            "nombre": {"$first": "$items.producto_nombre"},
            "cantidad_vendida": {"$sum": "$items.cantidad"},
            "ingreso_generado": {"$sum": "$items.subtotal"}
        }},
        {"$sort": {"cantidad_vendida": -1}},
        {"$limit": 10}
    ]).to_list(None)
    
    productos_mas_vendidos = []
    for p in top_products_agg:
        productos_mas_vendidos.append({
            "producto_id": str(p["_id"]),
            "nombre": p["nombre"],
            "cantidad": float(str(p["cantidad_vendida"])),
            "ingresos": float(str(p["ingreso_generado"]))
        })

    # --- 6. Gráfico Mensual (Ene - Dic) ---
    # We group by month. Since UTC might shift the day, we project the date in La Paz TZ
    mensual_match = {**match_filter, "created_at": {"$gte": start_of_year_utc}, "estado_pago": {"$ne": "ANULADO"}}
    mensual_agg = await Sale.get_motor_collection().aggregate([
        {"$match": mensual_match},
        {"$project": {
            "total": 1,
            "month": {"$month": {"date": "$created_at", "timezone": "-04:00"}},
            "costos_array": {
                "$map": {
                    "input": {"$ifNull": ["$items", []]},
                    "as": "item",
                    "in": {"$multiply": [{"$ifNull": ["$$item.cantidad", 0]}, {"$ifNull": ["$$item.costo_unitario", 0]}]}
                }
            }
        }},
        {"$project": {
            "month": 1,
            "total": 1,
            "costo_total": {"$sum": "$costos_array"}
        }},
        {"$group": {
            "_id": "$month",
            "ventas_totales": {"$sum": "$total"},
            "costo_total": {"$sum": "$costo_total"}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(None)
    
    ventas_mensuales = [0.0] * 12
    costos_mensuales = [0.0] * 12
    for m in mensual_agg:
        idx = m["_id"] - 1 # 1-based to 0-based
        if 0 <= idx < 12:
            ventas_mensuales[idx] = float(str(m.get("ventas_totales", 0)))
            costos_mensuales[idx] = float(str(m.get("costo_total", 0)))

    grafico_mensual = []
    meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    for i, total in enumerate(ventas_mensuales):
        costo = costos_mensuales[i]
        margen_cliente = total - costo
        margen_dist = costo * 0.15
        grafico_mensual.append({
            "mes": meses[i],
            "mes_index": i + 1,
            "ventas_totales": round(total, 2),
            "margen_distribuidor": round(margen_dist, 2),
            "margen_cliente": round(margen_cliente, 2)
        })

    # --- 7. Gráfico Diario (Mes en curso) ---
    diario_match = {**match_filter, "created_at": {"$gte": start_of_month_utc}, "estado_pago": {"$ne": "ANULADO"}}
    diario_agg = await Sale.get_motor_collection().aggregate([
        {"$match": diario_match},
        {"$project": {
            "total": 1,
            "day": {"$dayOfMonth": {"date": "$created_at", "timezone": "-04:00"}},
            "costos_array": {
                "$map": {
                    "input": {"$ifNull": ["$items", []]},
                    "as": "item",
                    "in": {"$multiply": [{"$ifNull": ["$$item.cantidad", 0]}, {"$ifNull": ["$$item.costo_unitario", 0]}]}
                }
            }
        }},
        {"$project": {
            "day": 1,
            "total": 1,
            "costo_total": {"$sum": "$costos_array"}
        }},
        {"$group": {
            "_id": "$day",
            "ventas_totales": {"$sum": "$total"},
            "costo_total": {"$sum": "$costo_total"}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(None)
    
    # Fill days up to current day of month
    current_day = now_lp.day
    ventas_diarias = {d["_id"]: float(str(d.get("ventas_totales", 0))) for d in diario_agg}
    costos_diarios = {d["_id"]: float(str(d.get("costo_total", 0))) for d in diario_agg}
    
    grafico_diario = []
    for day in range(1, current_day + 1):
        t = ventas_diarias.get(day, 0.0)
        c = costos_diarios.get(day, 0.0)
        m_cliente = t - c
        m_dist = c * 0.15
        grafico_diario.append({
            "dia": day,
            "ventas_totales": round(t, 2),
            "margen_distribuidor": round(m_dist, 2),
            "margen_cliente": round(m_cliente, 2)
        })

    return {
        "ventas_hoy": round(ventas_hoy, 2),
        "transacciones_ventas": transacciones_ventas,
        "transacciones_compras": compras_hoy_count,
        "anulaciones_hoy": anulaciones_hoy,
        "personal_activo": personal_activo,
        "productos_mas_vendidos": productos_mas_vendidos,
        "grafico_mensual": grafico_mensual,
        "grafico_diario": grafico_diario,
        "mes_actual": now_lp.month,
        "dia_actual": now_lp.day
    }
