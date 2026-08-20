import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clone_database():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    
    db_prod = client['sales_system_prod']
    db_dev = client['sales_system_dev']
    
    print("Iniciando clonación de 'sales_system_prod' a 'sales_system_dev'...")
    
    collections = await db_prod.list_collection_names()
    
    for col_name in collections:
        if col_name == 'system.profile':
            continue
            
        count = await db_prod[col_name].count_documents({})
        if count > 0:
            print(f"Clonando colección '{col_name}' ({count} documentos)...")
            # Limpiar la colección destino por si ya existía
            await db_dev[col_name].delete_many({})
            
            # Leer de prod y escribir en dev en bloques
            cursor = db_prod[col_name].find({})
            docs = await cursor.to_list(length=None)
            
            chunk_size = 5000
            for i in range(0, len(docs), chunk_size):
                await db_dev[col_name].insert_many(docs[i:i+chunk_size])
        else:
            print(f"Omitiendo '{col_name}' (Vacía).")
            
    print("\n¡Clonación completada exitosamente!")
    print("La base de datos 'sales_system_dev' es ahora una copia exacta de Producción.")

if __name__ == '__main__':
    asyncio.run(clone_database())
