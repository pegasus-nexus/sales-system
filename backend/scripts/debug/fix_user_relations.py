import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        email = "sucursal.heroinas.taboada@gmail.com"
        user = await db["users"].find_one({"email": email})

        print("\n--- AVAILABLE SUCURSALES ---")
        cursor = db["sucursales"].find({}, {"_id": 1, "nombre": 1, "tenant_id": 1})
        sucursales = await cursor.to_list(length=100)
        suc_to_assign = None
        tenant_to_assign = None
        for s in sucursales:
            print(f"{s['_id']} - {s.get('nombre')} (Tenant: {s.get('tenant_id')})")
            if "Heroinas" in s.get("nombre", "") or "heroinas" in s.get("nombre", "").lower():
                suc_to_assign = s["_id"]
                tenant_to_assign = s.get("tenant_id")

        if user and tenant_to_assign and suc_to_assign:
            print(f"\nUPDATING USER with Tenant {tenant_to_assign} and Sucursal {suc_to_assign}...")
            await db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {"tenant_id": str(tenant_to_assign), "sucursal_id": str(suc_to_assign)}}
            )
            print("User updated successfully!")
        else:
            print("\nCould not automatically find a matching sucursal 'Heroinas'.")

    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
