import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        users_cursor = db["users"].find({})
        users = await users_cursor.to_list(length=None)
        
        tenants_cache = set()
        sucursales_cache = set()
        
        # Populate caches for faster lookup
        async for t in db["tenants"].find({}, {"_id": 1}):
            tenants_cache.add(str(t["_id"]))
            
        async for s in db["sucursales"].find({}, {"_id": 1}):
            sucursales_cache.add(str(s["_id"]))

        invalid_users = []

        for user in users:
            uid = str(user["_id"])
            email = user.get("email", "NO_EMAIL")
            tenant_id = user.get("tenant_id")
            sucursal_id = user.get("sucursal_id")
            role = user.get("role")
            
            issues = []
            
            # Check Tenant
            if tenant_id:
                if str(tenant_id) not in tenants_cache:
                    issues.append(f"Invalid tenant_id: {tenant_id}")
            elif role not in ["SUPERADMIN"]:
                issues.append("Missing tenant_id for non-superadmin")
                
            # Check Sucursal
            if sucursal_id:
                if str(sucursal_id) not in sucursales_cache:
                    issues.append(f"Invalid sucursal_id: {sucursal_id}")
            elif role in ["ADMIN_SUCURSAL", "CAJERO", "VENDEDOR", "SUPERVISOR"]:
                issues.append(f"Missing sucursal_id for role {role}")
                
            if issues:
                invalid_users.append({
                    "email": email,
                    "role": role,
                    "issues": issues
                })
                
        print(f"Total Users Checked: {len(users)}")
        print(f"Users with Broken Relations: {len(invalid_users)}\n")
        
        for idx, iu in enumerate(invalid_users, 1):
            print(f"{idx}. {iu['email']} (Role: {iu['role']})")
            for issue in iu['issues']:
                print(f"   - {issue}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
