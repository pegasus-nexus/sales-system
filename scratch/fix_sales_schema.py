import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_sales_schema():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    print("Corrigiendo esquema en coleccion sales...")
    
    # Solo buscar los que tengan el problema
    query = {"items.product_id": {"$exists": True}}
    
    # Dado que items es un array, tenemos que mapear sus elementos. 
    # Es mas facil usar un script de python para traer y modificar
    cursor = db.sales.find(query)
    docs = await cursor.to_list(length=None)
    
    print(f"Encontrados {len(docs)} ventas con esquema incorrecto.")
    
    bulk_ops = []
    from pymongo import UpdateOne
    
    for doc in docs:
        new_items = []
        for item in doc.get("items", []):
            if "product_id" in item:
                new_item = {
                    "producto_id": item.get("product_id", ""),
                    "descripcion": item.get("product_name", ""),
                    "cantidad": item.get("quantity", 1.0),
                    "precio_unitario": item.get("unit_price", 0.0),
                    "costo_unitario": item.get("costo_unitario", 0.0),
                    "descuento_unitario": item.get("descuento_unitario", 0.0),
                    "subtotal": item.get("subtotal", 0.0),
                    "almacen_id": item.get("almacen_id", "default")
                }
                new_items.append(new_item)
            else:
                new_items.append(item)
                
        # Also fix some other potential issues like 'anulada' vs 'pagos' etc if needed
        # In restore_data.py I did:
        # "numero_ticket", "sucursal_id", "created_at", "total", "anulada", "cajero", "metodos_pago", "items"
        # The schema expects 'pagos': List[PagoItem]
        # I stored 'metodos_pago' (string). 'pagos' might be empty. It defaults to []. So that's fine.
        # 'cajero' is not in schema, schema has 'cashier_name'. Let's rename 'cajero' to 'cashier_name'
        
        updates = {"items": new_items}
        if "cajero" in doc:
            updates["cashier_name"] = doc["cajero"]
            
        bulk_ops.append(UpdateOne(
            {"_id": doc["_id"]},
            {"$set": updates, "$unset": {"cajero": ""}}
        ))
        
    if bulk_ops:
        chunk_size = 1000
        total_modified = 0
        for i in range(0, len(bulk_ops), chunk_size):
            res = await db.sales.bulk_write(bulk_ops[i:i+chunk_size])
            total_modified += res.modified_count
        print(f"Actualizadas {total_modified} ventas exitosamente.")
    else:
        print("No hay ventas que corregir.")

if __name__ == '__main__':
    asyncio.run(fix_sales_schema())
