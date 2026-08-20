import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def migrate_data():
    uri_old = 'mongodb+srv://rodrigorayomartinez_db_user:ke2PIv7kJ4uWCqgp@cluster0.teutv4o.mongodb.net/?appName=Cluster0'
    uri_new = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    
    print("Conectando a ambos clusters...")
    client_old = AsyncIOMotorClient(uri_old)
    client_new = AsyncIOMotorClient(uri_new)
    
    db_old = client_old['salessystem']
    db_new = client_new['sales_system_prod']
    
    collections_to_copy = [
        'users', 'sucursales', 'inventario', 'clientes', 'categories', 
        'products', 'inventory_logs', 'deudas', 'descuentos', 'recipes', 
        'almacenes', 'meal_schedules', 'plans', 'etiquetas', 'comunidad_visitas', 
        'cuentas_credito', 'pedido_items', 'caja_sesiones', 'caja_movimientos', 
        'sale_items', 'tenants', 'comunidad_users', 'audit_logs', 'caja_gasto_categorias',
        'pedidos_internos', 'meal_plan_templates', 'product_cost_history', 'recipe_ingredients',
        'client_meal_plans', 'traslados_inventario'
    ]
    
    print("Iniciando migración desde Cluster Viejo al Nuevo Producción...")
    for col_name in collections_to_copy:
        try:
            count_old = await db_old[col_name].count_documents({})
            if count_old > 0:
                print(f"Migrando {col_name}: {count_old} documentos...")
                # Borramos lo que haya en el nuevo para no duplicar (sobre-escribir con la fuente original)
                await db_new[col_name].delete_many({})
                
                # Leemos todo y lo insertamos en bloques
                cursor = db_old[col_name].find({})
                docs = await cursor.to_list(length=None)
                
                # Insertar en el nuevo en chunks
                chunk_size = 5000
                for i in range(0, len(docs), chunk_size):
                    await db_new[col_name].insert_many(docs[i:i+chunk_size])
                print(f"  -> {col_name} migrado con éxito.")
            else:
                print(f"Omitiendo {col_name} (Vacío).")
        except Exception as e:
            print(f"Error migrando {col_name}: {e}")
            
    print("\n>>> MIGRACIÓN COMPLETADA <<<")

if __name__ == '__main__':
    asyncio.run(migrate_data())
