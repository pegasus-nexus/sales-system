import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def process_inventory():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64"
    almacen_id = "default"
    
    print("Leyendo archivo CSV...")
    df = pd.read_csv(r'c:\Users\rodri\Desktop\sales-system\plan_implementations\INVENTARIO GENERAL - INVENTARIO AL 17-08.csv')
    df['FECHA'] = pd.to_datetime(df['FECHA'], errors='coerce')
    
    # Obtener el último stock resultante por producto
    latest_stock = df.sort_values('FECHA', ascending=False).drop_duplicates('PRODUCTO')
    
    updates_count = 0
    missing_products = []
    
    for _, row in latest_stock.iterrows():
        prod_name = str(row['PRODUCTO']).strip()
        stock = float(row['STOCK RESULTANTE'])
        
        # Buscar el producto por nombre en la base de datos (ignorando mayusculas)
        prod = await db.products.find_one({
            "tenant_id": tenant_id, 
            "descripcion": {"$regex": f"^{prod_name}$", "$options": "i"}
        })
        
        if not prod:
            # Intentar búsqueda parcial si la exacta falla
            prod = await db.products.find_one({
                "tenant_id": tenant_id, 
                "descripcion": {"$regex": prod_name, "$options": "i"}
            })
            
        if prod:
            prod_id = str(prod['_id'])
            
            # Upsert en inventario
            await db.inventario.update_one(
                {
                    "tenant_id": tenant_id,
                    "sucursal_id": sucursal_id,
                    "almacen_id": almacen_id,
                    "producto_id": prod_id
                },
                {"$set": {
                    "cantidad": stock,
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )
            updates_count += 1
        else:
            missing_products.append(prod_name)
            
    print(f"\n--- RESUMEN ---")
    print(f"Productos actualizados con éxito en Suc. Heroinas: {updates_count}")
    if missing_products:
        print(f"Productos del CSV no encontrados en la Base de Datos ({len(missing_products)}):")
        for m in missing_products[:10]:
            print(f" - {m}")
        if len(missing_products) > 10:
            print(" ... y más")

if __name__ == '__main__':
    asyncio.run(process_inventory())
