import asyncio
import sys
import os
from datetime import datetime, date, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from app.utils.date_utils import utc_to_bolivia

async def find_193():
    await init_db()
    db = await get_raw_db()
    
    print("==========================================================================")
    print("BUSCANDO EL ORIGEN DE 'Bs. 193.00' Y '7 ÓRDENES' EN MONGODB:")
    print("==========================================================================")

    # 1. Agrupar ventas en `sales` por fecha local Bolivia
    cursor = db.sales.find({"tenant_id": "69cd7f0a8f3f6866d4cfbb62", "anulada": {"$ne": True}})
    
    sales_by_date = {}
    async for doc in cursor:
        ca_utc = doc.get("created_at")
        if not ca_utc:
            continue
        ca_bo = utc_to_bolivia(ca_utc)
        d_str = ca_bo.strftime("%Y-%m-%d")
        tot = float(str(doc.get("total", 0)))
        
        if d_str not in sales_by_date:
            sales_by_date[d_str] = {"total": 0.0, "count": 0, "sales": []}
        sales_by_date[d_str]["total"] += tot
        sales_by_date[d_str]["count"] += 1
        sales_by_date[d_str]["sales"].append((str(doc["_id"]), tot, ca_bo.strftime("%H:%M:%S")))

    print("\nVentas por Día en MongoDB (colección sales):")
    for d_str, info in sorted(sales_by_date.items(), reverse=True):
        print(f"  Fecha {d_str} -> Total: Bs. {info['total']:>8.2f} | Transacciones: {info['count']} ordenes")
        if abs(info["total"] - 193.00) < 1.0 or info["count"] == 7:
            print(f"    *** MATCH ENCONTRADO PARA Bs. 193.00 / 7 ÓRDENES EN LA FECHA {d_str} ***")

    # 2. Revisar si hay algún endpoint o componente que envíe una fecha distinta (ej. 2026-08-11 o 2026-08-10)
if __name__ == '__main__':
    asyncio.run(find_193())
