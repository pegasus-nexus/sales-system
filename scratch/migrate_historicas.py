import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def migrate_historicas():
    uri_old = 'mongodb+srv://rodrigorayomartinez_db_user:ke2PIv7kJ4uWCqgp@cluster0.teutv4o.mongodb.net/?appName=Cluster0'
    uri_new = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    
    client_old = AsyncIOMotorClient(uri_old)
    client_new = AsyncIOMotorClient(uri_new)
    
    db_old = client_old['salessystem']
    db_new = client_new['sales_system_prod']
    
    col_name = 'ventas_historicas_crudas'
    count_old = await db_old[col_name].count_documents({})
    print(f"Migrando {col_name}: {count_old} documentos...")
    await db_new[col_name].delete_many({})
    
    cursor = db_old[col_name].find({})
    docs = await cursor.to_list(length=None)
    
    chunk_size = 5000
    for i in range(0, len(docs), chunk_size):
        await db_new[col_name].insert_many(docs[i:i+chunk_size])
    print(f"  -> {col_name} migrado con éxito.")

if __name__ == '__main__':
    asyncio.run(migrate_historicas())
