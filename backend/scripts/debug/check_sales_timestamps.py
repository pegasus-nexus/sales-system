import asyncio
from datetime import datetime
from app.db import get_raw_db, init_db

async def inspect_sales_timestamps():
    await init_db()
    db = await get_raw_db()

    total_sales = await db.sales.count_documents({})
    print(f"Total ventas registradas en MongoDB colección 'sales': {total_sales}")

    if total_sales == 0:
        print("⚠️ No hay ventas en la colección 'sales'.")
        return

    oldest = await db.sales.find({}, {"created_at": 1, "_id": 1, "numero_ticket": 1}).sort("created_at", 1).limit(3).to_list(None)
    newest = await db.sales.find({}, {"created_at": 1, "_id": 1, "numero_ticket": 1}).sort("created_at", -1).limit(5).to_list(None)

    print("\n--- VENTAS MÁS ANTIGUAS ---")
    for s in oldest:
        print(f"Ticket: {s.get('numero_ticket', s.get('_id'))} | created_at: {s.get('created_at')} (tipo: {type(s.get('created_at'))})")

    print("\n--- VENTAS MÁS RECIENTES ---")
    for s in newest:
        print(f"Ticket: {s.get('numero_ticket', s.get('_id'))} | created_at: {s.get('created_at')} (tipo: {type(s.get('created_at'))})")

if __name__ == "__main__":
    asyncio.run(inspect_sales_timestamps())
