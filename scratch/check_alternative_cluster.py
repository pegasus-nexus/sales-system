import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    uri = 'mongodb+srv://rodrigorayomartinez_db_user:ke2PIv7kJ4uWCqgp@cluster0.teutv4o.mongodb.net/?appName=Cluster0'
    print(f"Conectando al cluster alternativo...")
    client = AsyncIOMotorClient(uri)
    try:
        dbs = await client.list_database_names()
        print('Databases encontradas:', dbs)
        
        for db_name in dbs:
            if db_name in ['admin', 'local', 'config']:
                continue
            print(f'\n--- Revisando DB: {db_name} ---')
            db = client[db_name]
            collections = await db.list_collection_names()
            for col in collections:
                count = await db[col].count_documents({})
                print(f'{col}: {count} documentos')
                
                # If it's sales or historicas, let's get max date
                if col in ['sales', 'ventas_historicas_crudas'] and count > 0:
                    try:
                        # find the latest document by sorting created_at or fecha_transaccion descending
                        if col == 'sales':
                            latest = await db[col].find_one({}, sort=[("created_at", -1)])
                            date_val = latest.get("created_at")
                            print(f'  -> Última venta registrada: {date_val}')
                        elif col == 'ventas_historicas_crudas':
                            latest = await db[col].find_one({}, sort=[("fecha_transaccion", -1)])
                            date_val = latest.get("fecha_transaccion")
                            print(f'  -> Último registro histórico: {date_val}')
                    except Exception as ex:
                        pass
                        
    except Exception as e:
        print("Error de conexion o acceso:", e)

if __name__ == '__main__':
    asyncio.run(main())
