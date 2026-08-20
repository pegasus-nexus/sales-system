import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_date_ranges():
    uri = 'mongodb+srv://rodrigorayomartinez_db_user:ke2PIv7kJ4uWCqgp@cluster0.teutv4o.mongodb.net/?appName=Cluster0'
    client = AsyncIOMotorClient(uri)
    db = client['salessystem']
    
    print("Obteniendo rangos de fechas de la base de datos REAL...")
    
    # Rango de 'sales' (Ventas Operativas)
    sales = db['sales']
    if await sales.count_documents({}) > 0:
        first_sale = await sales.find_one({}, sort=[("created_at", 1)])
        last_sale = await sales.find_one({}, sort=[("created_at", -1)])
        print(f"VENTAS OPERATIVAS (sales):")
        print(f"  Desde: {first_sale.get('created_at')}")
        print(f"  Hasta: {last_sale.get('created_at')}")
    
    print("-" * 40)
    
    # Rango de 'ventas_historicas_crudas'
    historicas = db['ventas_historicas_crudas']
    if await historicas.count_documents({}) > 0:
        first_hist = await historicas.find_one({}, sort=[("fecha_transaccion", 1)])
        last_hist = await historicas.find_one({}, sort=[("fecha_transaccion", -1)])
        print(f"VENTAS HISTÓRICAS (ventas_historicas_crudas):")
        print(f"  Desde: {first_hist.get('fecha_transaccion')}")
        print(f"  Hasta: {last_hist.get('fecha_transaccion')}")

if __name__ == '__main__':
    asyncio.run(get_date_ranges())
