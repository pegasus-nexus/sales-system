import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_sucursales():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    db = c["salessystem"]
    
    pipeline = [
        {"$group": {
            "_id": {
                "fecha": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at", "timezone": "America/La_Paz"}},
                "sucursal_id": "$sucursal_id"
            },
            "total": {"$sum": "$total"},
            "tickets": {"$sum": 1}
        }},
        {"$sort": {"_id.fecha": 1}}
    ]
    
    results = await db.sales.aggregate(pipeline).to_list(length=None)
    print("\n🔍 Agrupación por fecha y sucursal buscando 625.00:")
    found = False
    for r in results:
        tot = r["total"]
        if tot == 625 or tot == 625.0 or (624 <= tot <= 626):
            print(f"👉 FECHA: {r['_id']['fecha']} | Sucursal: {r['_id']['sucursal_id']} | Total: Bs. {tot} | Tickets: {r['tickets']}")
            found = True
            
    if not found:
        print("No se encontró ningún día/sucursal con exactamente 625.00 en MongoDB local.")

    # Buscar en toda la colección sales cualquier campo que tenga 625
    cursor = db.sales.find({"$where": "JSON.stringify(this).indexOf('625') !== -1"})
    try:
        matching_where = await cursor.to_list(length=None)
        print(f"\nDocumentos en 'sales' que contienen '625' en cualquier campo: {len(matching_where)}")
        for m in matching_where:
            print(f"  - {m}")
    except Exception as e:
        print(f"Error $where: {e}")

if __name__ == "__main__":
    asyncio.run(check_sucursales())
