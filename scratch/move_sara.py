import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def move_sara():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    username = "sara.lazarte.ramirez"
    tenant_chocolates = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_heroinas_chocolates = "69cd80098f3f6866d4cfbb64"
    
    print(f"Moviendo cajera {username} al tenant Chocolates Taboada...")
    
    res = await db.users.update_one(
        {"username": username},
        {"$set": {
            "tenant_id": tenant_chocolates,
            "sucursal_id": sucursal_heroinas_chocolates
        }}
    )
    
    if res.modified_count > 0:
        print("Cajera movida exitosamente a 'Chocolates taboada' -> 'Suc. Heroinas'.")
    else:
        print("No se encontró la cajera o ya estaba en esa sucursal/tenant.")

if __name__ == '__main__':
    asyncio.run(move_sara())
