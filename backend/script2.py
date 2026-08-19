import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    cols = await db.list_collection_names()
    print("Colecciones:", cols)
    
    venta_col_name = "venta" if "venta" in cols else "ventas"
    if venta_col_name in cols:
        venta = await db[venta_col_name].find_one({}, sort=[("created_at", -1)])
        if venta:
            print(f"Ultima venta fecha: {venta.get('created_at')} (tipo {type(venta.get('created_at'))})")
        else:
            print("No hay ventas")

if __name__ == '__main__':
    asyncio.run(check_db())
