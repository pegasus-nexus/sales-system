import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    indexes = await db["ventas_historicas_crudas"].index_information()
    print("Indexes on ventas_historicas_crudas:")
    for name, info in indexes.items():
        print(f"- {name}: {info['key']}")

if __name__ == "__main__":
    asyncio.run(run())
