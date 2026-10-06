import sys
import re

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace mensual_agg
pattern_mensual = r"mensual_match = \{\*\*match_filter, \"created_at\": \{\"\$gte\": start_of_year_utc\}, \"estado_pago\": \{\"\$ne\": \"ANULADO\"\}\}.*?ventas_mensuales\[idx\] = float\(str\(m\[\"total\"\]\)\)"
new_mensual = """mensual_match = {**match_filter, "created_at": {"$gte": start_of_year_utc}, "estado_pago": {"$ne": "ANULADO"}}
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
            costos_mensuales[idx] = float(str(m.get("costo_total", 0)))"""
content = re.sub(pattern_mensual, new_mensual, content, flags=re.DOTALL)

# Replace grafico_mensual loop
pattern_g_mensual = r"grafico_mensual = \[\]\s*meses = \[\"Ene\", \"Feb\", \"Mar\", \"Abr\", \"May\", \"Jun\", \"Jul\", \"Ago\", \"Sep\", \"Oct\", \"Nov\", \"Dic\"\]\s*for i, total in enumerate\(ventas_mensuales\):\s*grafico_mensual\.append\(\{.*?\}\)"
new_g_mensual = """grafico_mensual = []
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
content = re.sub(pattern_g_mensual, new_g_mensual, content, flags=re.DOTALL)

# Replace diario_agg
pattern_diario = r"diario_match = \{\*\*match_filter, \"created_at\": \{\"\$gte\": start_of_month_utc\}, \"estado_pago\": \{\"\$ne\": \"ANULADO\"\}\}.*?ventas_diarias\[idx\] = float\(str\(d\[\"total\"\]\)\)"
new_diario = """diario_match = {**match_filter, "created_at": {"$gte": start_of_month_utc}, "estado_pago": {"$ne": "ANULADO"}}
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
    
    days_in_month = (end_of_month_utc - start_of_month_utc).days
    ventas_diarias = [0.0] * days_in_month
    costos_diarios = [0.0] * days_in_month
    for d in diario_agg:
        idx = d["_id"] - 1
        if 0 <= idx < days_in_month:
            ventas_diarias[idx] = float(str(d.get("ventas_totales", 0)))
            costos_diarios[idx] = float(str(d.get("costo_total", 0)))"""
content = re.sub(pattern_diario, new_diario, content, flags=re.DOTALL)

# Replace grafico_diario loop
pattern_g_diario = r"grafico_diario = \[\]\s*for i, total in enumerate\(ventas_diarias\):\s*grafico_diario\.append\(\{.*?\}\)"
new_g_diario = """grafico_diario = []
    for i, total in enumerate(ventas_diarias):
        costo = costos_diarios[i]
        margen_cliente = total - costo
        margen_dist = costo * 0.15
        grafico_diario.append({
            "dia": i + 1,
            "ventas_totales": round(total, 2),
            "margen_distribuidor": round(margen_dist, 2),
            "margen_cliente": round(margen_cliente, 2)
        })"""
content = re.sub(pattern_g_diario, new_g_diario, content, flags=re.DOTALL)

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated dashboard margins")
