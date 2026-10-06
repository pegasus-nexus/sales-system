import re

with open('frontend/src/api/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'unidades_actual' not in content:
    content = content.replace('diferencia_tx_pct: number;', '''diferencia_tx_pct: number;
        unidades_actual: number;
        unidades_anterior: number;
        diferencia_unidades_pct: number;
        ticket_promedio_productos_actual: number;
        ticket_promedio_productos_anterior: number;
        diferencia_tkt_prod_pct: number;''')

    with open('frontend/src/api/api.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched API successfully")
