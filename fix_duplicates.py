import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run_cleanup():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {
            "_id": {
                "sucursal_id": "$sucursal_id",
                "producto_id": "$producto_id"
            },
            "docs": {"$push": {"id": "$_id", "cantidad": "$cantidad", "almacen_id": "$almacen_id"}},
            "count": {"$sum": 1}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    duplicates = await db.inventario.aggregate(pipeline).to_list(None)
    
    print(f"Found {len(duplicates)} duplicated inventory combinations.")
    
    for dup in duplicates:
        docs = dup['docs']
        # Find the one to keep (e.g. the one with "default" or the newest)
        # We will merge all cantidades.
        total_cantidad = sum(d.get('cantidad', 0) for d in docs)
        
        # We prefer to keep the one with almacen_id == "default"
        keep_doc = None
        for d in docs:
            if d.get('almacen_id') == 'default':
                keep_doc = d
                break
        
        if not keep_doc:
            keep_doc = docs[0]
            
        delete_ids = [d['id'] for d in docs if d['id'] != keep_doc['id']]
        
        print(f"Merging product {dup['_id']['producto_id']} in sucursal {dup['_id']['sucursal_id']} -> Total stock: {total_cantidad}. Deleting {len(delete_ids)} duplicates.")
        
        # Update the keep doc
        await db.inventario.update_one(
            {"_id": keep_doc['id']},
            {"$set": {"cantidad": total_cantidad, "almacen_id": "default"}}
        )
        
        # Delete the others
        if delete_ids:
            await db.inventario.delete_many({"_id": {"$in": delete_ids}})
            
    print("Cleanup complete.")

asyncio.run(run_cleanup())
