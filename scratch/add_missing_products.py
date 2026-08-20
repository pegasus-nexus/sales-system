import asyncio
import pandas as pd
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def add_missing_products():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64"
    almacen_id = "default"
    cat_id = "6a85d01975c35c90b251b5be" # Nuevos CSV
    
    df = pd.read_csv(r'c:\Users\rodri\Desktop\sales-system\plan_implementations\INVENTARIO GENERAL - INVENTARIO AL 17-08.csv')
    df['FECHA'] = pd.to_datetime(df['FECHA'], errors='coerce')
    latest_stock = df.sort_values('FECHA', ascending=False).drop_duplicates('PRODUCTO')
    
    missing_products = []
    
    for _, row in latest_stock.iterrows():
        prod_name = str(row['PRODUCTO']).strip()
        stock = float(row['STOCK RESULTANTE'])
        costo_str = str(row['COSTO UNIT.']).replace(',', '.') if not pd.isna(row['COSTO UNIT.']) else '0'
        precio_str = str(row['PRECIO VENTA UNIT.']).replace(',', '.') if not pd.isna(row['PRECIO VENTA UNIT.']) else '0'
        costo = float(costo_str)
        precio = float(precio_str)
        
        prod = await db.products.find_one({
            "tenant_id": tenant_id, 
            "descripcion": {"$regex": f"^{prod_name}$", "$options": "i"}
        })
        if not prod:
            prod = await db.products.find_one({
                "tenant_id": tenant_id, 
                "descripcion": {"$regex": prod_name, "$options": "i"}
            })
            
        if not prod:
            print(f"Agregando nuevo producto: {prod_name}")
            
            # Generar codigo corto y sistema
            codigo_sistema = str(uuid.uuid4())[:8].upper()
            codigo_corto = f"N-{codigo_sistema[:4]}"
            
            new_prod = {
                "tenant_id": tenant_id,
                "codigo_sistema": codigo_sistema,
                "codigo_corto": codigo_corto,
                "descripcion": prod_name,
                "categoria_id": cat_id,
                "costo_producto": costo,
                "precio_venta": precio,
                "tipo_item": "FISICO",
                "show_on_web": True,
                "is_destacado": False,
                "created_at": datetime.utcnow()
            }
            res = await db.products.insert_one(new_prod)
            prod_id = str(res.inserted_id)
            missing_products.append(prod_name)
            
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
            
    print(f"\nSe agregaron {len(missing_products)} productos nuevos al catálogo y se actualizó su inventario en Suc. Heroinas.")

if __name__ == '__main__':
    asyncio.run(add_missing_products())
