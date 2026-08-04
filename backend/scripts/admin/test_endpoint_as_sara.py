import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    # 1. Find user sara.lazarte.ramirez
    user = await db.users.find_one({"username": {"$regex": "sara.lazarte", "$options": "i"}})
    t_id = str(user.get("tenant_id"))
    s_id = str(user.get("sucursal_id"))
    
    prods = await db.products.find({"tenant_id": t_id}).to_list(1000)
    
    p_ids = [str(p['_id']) for p in prods]
    p_id_match = []
    for pid in p_ids:
        p_id_match.append(pid)
        if ObjectId.is_valid(pid):
            p_id_match.append(ObjectId(pid))
            
    suc_match = [s_id]
    if ObjectId.is_valid(s_id):
        suc_match.append(ObjectId(s_id))
        
    # Check types of tenant_id in inventario
    invs_str = await db.inventario.count_documents({"tenant_id": t_id})
    invs_obj = await db.inventario.count_documents({"tenant_id": ObjectId(t_id)}) if ObjectId.is_valid(t_id) else 0
    print(f"\nInventarios for tenant_id as string '{t_id}': {invs_str}")
    print(f"Inventarios for tenant_id as ObjectId: {invs_obj}")
        
    print(f"\n--- TESTING QUERY IN LINE 82 FOR SARA ---")
    print(f"tenant_id: {repr(t_id)}")
    print(f"suc_match: {suc_match}")
    print(f"p_id_match count: {len(p_id_match)}")
    
    # Query 1: Exactly line 82
    c1 = await db.inventario.find(
        {"producto_id": {"$in": p_id_match}, "sucursal_id": {"$in": suc_match}, "tenant_id": t_id},
        {"producto_id": 1, "precio_sucursal": 1, "_id": 0}
    ).to_list(100)
    print(f"\nQuery 1 (exact line 82) returned {len(c1)} records out of {len(prods)} products.")
    for r in c1[:10]:
        print("  ", r)
        
    # Query 2: Without tenant_id
    c2 = await db.inventario.find(
        {"producto_id": {"$in": p_id_match}, "sucursal_id": {"$in": suc_match}},
        {"producto_id": 1, "precio_sucursal": 1, "_id": 0}
    ).to_list(100)
    print(f"\nQuery 2 (without tenant_id filter) returned {len(c2)} records.")
    for r in c2[:10]:
        print("  ", r)
        
    # Query 3: With ObjectId(tenant_id)
    tenant_match = [t_id]
    if ObjectId.is_valid(t_id):
        tenant_match.append(ObjectId(t_id))
    c3 = await db.inventario.find(
        {"producto_id": {"$in": p_id_match}, "sucursal_id": {"$in": suc_match}, "tenant_id": {"$in": tenant_match}},
        {"producto_id": 1, "precio_sucursal": 1, "_id": 0}
    ).to_list(100)
    print(f"\nQuery 3 (tenant_id as str OR ObjectId) returned {len(c3)} records.")
    for r in c3[:10]:
        print("  ", r)

asyncio.run(main())
