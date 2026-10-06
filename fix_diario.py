import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

old_diario = """    # --- 7. Gráfico Diario (Mes en curso) ---
    diario_match = {**match_filter, "created_at": {"$gte": start_of_month_utc}, "estado_pago": {"$ne": "ANULADO"}}
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
    for day in range(1, current_day + 1):
        total = ventas_diarias.get(day, 0.0)
        grafico_diario.append({
            "dia": day,
            "ventas_totales": round(total, 2),
            "margen_distribuidor": round(total * 0.15, 2),
            "margen_cliente": round(total * 0.85, 2)
        })"""

new_diario = """    # --- 7. Gráfico Diario (Mes en curso) ---
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
        })"""

if old_diario in content:
    content = content.replace(old_diario, new_diario)
    with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated diario!")
else:
    print("Could not find old_diario")
