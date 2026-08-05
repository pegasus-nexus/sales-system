import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import get_raw_db, init_db
from datetime import datetime

async def report_2026():
    await init_db()
    db = await get_raw_db()
    start_2026 = datetime(2026, 1, 1, 0, 0, 0)
    end_2026 = datetime(2026, 12, 31, 23, 59, 59)

    # 1. Total ventas POS (sales) en 2026
    pipeline_sales = [
        {'$match': {'created_at': {'$gte': start_2026, '$lte': end_2026}, 'estado': {'$ne': 'anulado'}, 'anulada': {'$ne': True}}},
        {'$group': {
            '_id': {'$month': '$created_at'},
            'total_bs': {'$sum': '$total'},
            'count': {'$sum': 1}
        }},
        {'$sort': {'_id': 1}}
    ]
    sales_by_month = await db.sales.aggregate(pipeline_sales).to_list(100)

    # 2. Ventas por sucursal POS en 2026
    pipeline_suc = [
        {'$match': {'created_at': {'$gte': start_2026, '$lte': end_2026}, 'estado': {'$ne': 'anulado'}, 'anulada': {'$ne': True}}},
        {'$group': {
            '_id': '$sucursal_id',
            'total_bs': {'$sum': '$total'},
            'count': {'$sum': 1}
        }}
    ]
    sales_by_suc = await db.sales.aggregate(pipeline_suc).to_list(100)

    # Nombres sucursales
    sucs = await db.sucursales.find().to_list(100)
    suc_map = {str(s['_id']): s.get('nombre') for s in sucs}

    print('=== RESUMEN VENTAS POS 2026 ===')
    def to_f(v):
        return float(str(v or 0))

    total_2026_bs = sum(to_f(m['total_bs']) for m in sales_by_month)
    total_2026_count = sum(m['count'] for m in sales_by_month)
    print(f'Total Ventas POS 2026: Bs. {total_2026_bs:,.2f} ({total_2026_count:,} transacciones)\n')
    
    print('--- DESGLOSE POR MES (2026) ---')
    meses_nombres = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    for m in sales_by_month:
        m_num = m['_id']
        m_name = meses_nombres[m_num] if 1 <= m_num <= 12 else str(m_num)
        print(f'  - {m_name} 2026: Bs. {to_f(m["total_bs"]):,.2f} ({m["count"]:,} transacciones)')

    print('\n--- DESGLOSE POR SUCURSAL (2026) ---')
    for s in sales_by_suc:
        sid = str(s['_id'])
        sname = suc_map.get(sid, sid)
        print(f'  - {sname}: Bs. {to_f(s["total_bs"]):,.2f} ({s["count"]:,} transacciones)')

    # 3. Ventas históricas crudas en 2026
    pipeline_hist = [
        {'$match': {'fecha_transaccion': {'$gte': start_2026, '$lte': end_2026}}},
        {'$group': {
            '_id': '$sucursal',
            'total_bs': {'$sum': '$monto_total_bs'},
            'count': {'$sum': 1}
        }}
    ]
    hist_by_suc = await db.ventas_historicas_crudas.aggregate(pipeline_hist).to_list(100)
    if hist_by_suc:
        print('\n--- VENTAS HISTÓRICAS CRUDAS 2026 ---')
        for h in hist_by_suc:
            print(f'  - {h["_id"]}: Bs. {to_f(h["total_bs"]):,.2f} ({h["count"]:,} registros)')

    # 4. Top 5 Días con más ventas en 2026
    pipeline_days = [
        {'$match': {'created_at': {'$gte': start_2026, '$lte': end_2026}, 'estado': {'$ne': 'anulado'}, 'anulada': {'$ne': True}}},
        {'$group': {
            '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at', 'timezone': 'America/La_Paz'}},
            'total_bs': {'$sum': '$total'},
            'count': {'$sum': 1}
        }},
        {'$sort': {'total_bs': -1}},
        {'$limit': 5}
    ]
    top_days = await db.sales.aggregate(pipeline_days).to_list(5)
    print('\n--- TOP 5 DÍAS CON MAYOR FACTURACIÓN EN 2026 ---')
    for d in top_days:
        print(f'  - {d["_id"]}: Bs. {to_f(d["total_bs"]):,.2f} ({d["count"]:,} transacciones)')

if __name__ == '__main__':
    asyncio.run(report_2026())
