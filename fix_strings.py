import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

# MENSUAL
old_mensual = """    mensual_match = {**match_filter, "created_at": {"$gte": start_of_year_utc}, "estado_pago": {"$ne": "ANULADO"}}
    mensual_agg = await Sale.get_motor_collection().aggregate([
        {"$match": mensual_match},
        {"$project": {
            "total": 1,
            "month": {"$month": {"date": "$created_at", "timezone": "-04:00"}}
        }},
        {"$group": {
            "_id": "$month",
            "total": {"$sum": "$total"}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(None)
    
    ventas_mensuales = [0.0] * 12
    for m in mensual_agg:
        idx = m["_id"] - 1 # 1-based to 0-based
        if 0 <= idx < 12:
            ventas_mensuales[idx] = float(str(m["total"]))

    grafico_mensual = []
    meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    for i, total in enumerate(ventas_mensuales):
        grafico_mensual.append({
            "mes": meses[i],
            "mes_index": i + 1,
            "ventas_totales": round(total, 2),
            "margen_distribuidor": round(total * 0.15, 2),
            "margen_cliente": round(total * 0.85, 2)
        })"""

new_mensual = """    mensual_match = {**match_filter, "created_at": {"$gte": start_of_year_utc}, "estado_pago": {"$ne": "ANULADO"}}
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
        })"""


old_diario = """    diario_match = {**match_filter, "created_at": {"$gte": start_of_month_utc}, "estado_pago": {"$ne": "ANULADO"}}
    diario_agg = await Sale.get_motor_collection().aggregate([
        {"$match": diario_match},
        {"$project": {
            "total": 1,
            "day": {"$dayOfMonth": {"date": "$created_at", "timezone": "-04:00"}}
        }},
        {"$group": {
            "_id": "$day",
            "total": {"$sum": "$total"}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(None)
    
    # Fill days up to current day of month
    current_day = now_lp.day
    ventas_diarias = {d["_id"]: float(str(d["total"])) for d in diario_agg}
    
    grafico_diario = []
    for day_num in range(1, current_day + 1):
        t = ventas_diarias.get(day_num, 0.0)
        grafico_diario.append({
            "dia": day_num,
            "ventas_totales": round(t, 2),
            "margen_distribuidor": round(t * 0.15, 2),
            "margen_cliente": round(t * 0.85, 2)
        })"""

new_diario = """    diario_match = {**match_filter, "created_at": {"$gte": start_of_month_utc}, "estado_pago": {"$ne": "ANULADO"}}
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
    for day_num in range(1, current_day + 1):
        t = ventas_diarias.get(day_num, 0.0)
        c = costos_diarios.get(day_num, 0.0)
        m_cliente = t - c
        m_dist = c * 0.15
        grafico_diario.append({
            "dia": day_num,
            "ventas_totales": round(t, 2),
            "margen_distribuidor": round(m_dist, 2),
            "margen_cliente": round(m_cliente, 2)
        })"""

if old_mensual in content:
    content = content.replace(old_mensual, new_mensual)
    print("Replaced mensual")
if old_diario in content:
    content = content.replace(old_diario, new_diario)
    print("Replaced diario")
    
with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
    f.write(content)
