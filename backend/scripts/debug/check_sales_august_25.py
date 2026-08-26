import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd
from app.db import get_raw_db, init_db
from app.core.config import BUSINESS_TIMEZONE
from app.utils.date_utils import get_range_bolivia

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def check_august_25_sales():
    await init_db()
    db = await get_raw_db()

    start_dt, end_dt = get_range_bolivia("2026-08-25", "2026-08-25")
    print(f"Rango de Fechas get_range_bolivia('2026-08-25'): {start_dt} a {end_dt}")

    # Consultar ventas del 25 de agosto en la colección sales
    sales_docs = await db.sales.find({
        "created_at": {"$gte": start_dt, "$lte": end_dt},
        "anulada": {"$ne": True}
    }).to_list(None)

    print(f"\nTotal ventas encontradas en MongoDB 'sales' para el 25/08/2026: {len(sales_docs)}")

    if len(sales_docs) > 0:
        total_monto = sum(float(s.get("total", 0.0) or 0.0) for s in sales_docs)
        print(f"Monto total de ventas el 25/08/2026: Bs. {total_monto:,.2f}")
        print("\n--- PRIMERAS 5 VENTAS DEL 25/08/2026 ---")
        for s in sales_docs[:5]:
            print(f"  Ticket: {s.get('numero_ticket', s.get('_id'))} | created_at: {s.get('created_at')} | tenant_id: {s.get('tenant_id')} | total: Bs. {s.get('total')}")
    else:
        print("⚠️ No hay ventas registradas el 25/08/2026 en la colección 'sales'.")

    # Consultar si existen ventas en la colección ventas_historicas_crudas o similares
    all_collections = await db.list_collection_names()
    print(f"\nColecciones disponibles en MongoDB: {all_collections}")

    for coll_name in all_collections:
        if "sale" in coll_name or "venta" in coll_name:
            coll = db[coll_name]
            count_25 = await coll.count_documents({
                "created_at": {"$gte": start_dt, "$lte": end_dt}
            })
            print(f"  Colección '{coll_name}': {count_25} documentos con created_at en 25/08/2026")

if __name__ == "__main__":
    asyncio.run(check_august_25_sales())
