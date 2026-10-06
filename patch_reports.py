import re

with open('backend/app/api/v1/endpoints/reports.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we don't duplicate
if 'unidades_actual' not in content:
    content = content.replace('tx_prev = int(prev["transacciones"])', '''tx_prev = int(prev["transacciones"])

    unidades_latest = float(latest.get("unidades", 0.0))
    unidades_prev = float(prev.get("unidades", 0.0))
    diff_unidades_pct = ((unidades_latest - unidades_prev) / unidades_prev * 100.0) if unidades_prev > 0 else (100.0 if unidades_latest > 0 else 0.0)

    tkt_prod_latest = round(unidades_latest / tx_latest, 2) if tx_latest > 0 else 0.0
    tkt_prod_prev = round(unidades_prev / tx_prev, 2) if tx_prev > 0 else 0.0
    diff_tkt_prod_pct = ((tkt_prod_latest - tkt_prod_prev) / tkt_prod_prev * 100.0) if tkt_prod_prev > 0 else (100.0 if tkt_prod_latest > 0 else 0.0)
''')

    content = content.replace('"transacciones_anterior": tx_prev,', '''"transacciones_anterior": tx_prev,
            "unidades_actual": round(unidades_latest, 2),
            "unidades_anterior": round(unidades_prev, 2),
            "diferencia_unidades_pct": round(diff_unidades_pct, 1),
            "ticket_promedio_productos_actual": tkt_prod_latest,
            "ticket_promedio_productos_anterior": tkt_prod_prev,
            "diferencia_tkt_prod_pct": round(diff_tkt_prod_pct, 1),''')

    with open('backend/app/api/v1/endpoints/reports.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Already patched")
