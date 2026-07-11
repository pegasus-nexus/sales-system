import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

ATLAS = "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0"
DBS = ["SalesSystem_Dev", "SalesSystem_Staging", "sales_system_db", "salessystem"]

async def find_tenant():
    client = AsyncIOMotorClient(ATLAS)
    print("Buscando tenant TABOADA en todas las bases de datos...\n")
    for db_name in DBS:
        db = client[db_name]
        count = await db.tenants.count_documents({})
        all_t = await db.tenants.find({}, {"name": 1}).to_list(20)
        names = [t.get("name", "?") for t in all_t]
        regex_filter = {"name": {"$regex": "taboada", "$options": "i"}}
        tenant = await db.tenants.find_one(regex_filter)
        found = "*** TABOADA ENCONTRADO ***" if tenant else ""
        print(f"[{db_name}]  tenants={count}  nombres={names}  {found}")
    client.close()

asyncio.run(find_tenant())
