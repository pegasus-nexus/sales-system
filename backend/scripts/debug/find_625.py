import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def find_625():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    db = c["salessystem"]
    collection = db["sales"]

    # 1. Buscar cualquier venta con 625
    query_625 = {
        "$or": [
            {"total": 625},
            {"total": 625.0},
            {"total": "625"},
            {"total_neto": 625},
            {"total_neto": 625.0},
            {"total": {"$gte": 624.99, "$lte": 625.01}}
        ]
    }
    docs_625 = await collection.find(query_625).to_list(length=None)
    print(f"\n🎯 Ventas con monto 625 (total {len(docs_625)}):")
    for d in docs_625:
        print(f"   - ID: {d.get('_id')} | Fecha Bolivia: {d.get('fecha_bolivia')} | Created At: {d.get('created_at')} | Total: {d.get('total')}")

    # 2. Agrupar por fecha donde la suma de ventas del día sea 625.00
    all_docs = await collection.find({}).to_list(length=None)
    daily_totals = {}
    for d in all_docs:
        fb = d.get("fecha_bolivia") or str(d.get("created_at"))[:10]
        monto = float(d.get("total", 0.0) or d.get("total_neto", 0.0))
        daily_totals[fb] = daily_totals.get(fb, 0.0) + monto

    print("\n📅 Días con total de ventas cercano o igual a 625.00:")
    for dt, tot in daily_totals.items():
        if 600 <= tot <= 650:
            print(f"   • Fecha: {dt} -> Total: Bs. {tot:,.2f}")

    # 3. Buscar si hay ventas en fechas de septiembre en general
    sep_docs = [d for d in all_docs if "-09-" in str(d.get("fecha_bolivia")) or "-09-" in str(d.get("created_at"))]
    print(f"\n🍂 Ventas en cualquier septiembre (mes 09): {len(sep_docs)}")
    for d in sep_docs:
        print(f"   - ID: {d.get('_id')} | Fecha: {d.get('fecha_bolivia')} | Created At: {d.get('created_at')} | Total: {d.get('total')}")

    # 4. Revisar si hay otra colección de ventas o historicos
    col_names = await db.list_collection_names()
    print(f"\nColecciones en 'salessystem': {col_names}")

if __name__ == "__main__":
    asyncio.run(find_625())
