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
        if not user:
            print(f"User {email} NOT FOUND.")
            return

        print("--- USER RECORD ---")
        for k, v in user.items():
            if k != "hashed_password":
                print(f"{k}: {v}")
                
        print("\n--- TENANT CHECK ---")
        tenant_id = user.get("tenant_id")
        if tenant_id:
            tenant = await db["tenants"].find_one({"_id": tenant_id})
            if tenant:
                print(f"Tenant found: {tenant.get('name')} (is_active: {tenant.get('is_active')})")
            else:
                print(f"CRITICAL: Tenant {tenant_id} NOT FOUND in 'tenants' collection.")
        else:
            print("User has no tenant_id assigned.")

        print("\n--- SUCURSAL CHECK ---")
        sucursal_id = user.get("sucursal_id")
        if sucursal_id:
            sucursal = await db["sucursales"].find_one({"_id": sucursal_id})
            if sucursal:
                print(f"Sucursal found: {sucursal.get('name')} (is_active: {sucursal.get('is_active')})")
            else:
                print(f"CRITICAL: Sucursal {sucursal_id} NOT FOUND in 'sucursales' collection.")
        else:
            print("User has no sucursal_id assigned.")

    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
