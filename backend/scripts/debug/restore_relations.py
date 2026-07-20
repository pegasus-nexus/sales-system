import asyncio
import bson
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

BSON_PATH = r"c:\Users\rodri\Desktop\RespaldoSaaS\dump\salessystem\users.bson"
NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

BROKEN_EMAILS = [
    "caja.matriz@gmail.com",
    "mariana.ramos@gmail.com",
    "shelly.fuentes@gmail.com",
    "admin@taboada.com",
    "facturador@taboada.com",
    "cateringmontalvo@gmail.com",
    "bdante29bol@outlook.es",
    "carolinabeltranmontalvo@gmail.com"
]

async def main():
    try:
        with open(BSON_PATH, "rb") as f:
            data = f.read()
        
        backup_users = bson.decode_all(data)
        backup_map = {u.get("email"): u for u in backup_users if u.get("email") in BROKEN_EMAILS}
        
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
        db = client[DB_NAME]
        
        fixes_applied = 0
        for email in BROKEN_EMAILS:
            backup_u = backup_map.get(email)
            if not backup_u:
                continue
                
            tenant_id = backup_u.get("tenant_id")
            sucursal_id = backup_u.get("sucursal_id")
            
            if hasattr(tenant_id, 'is_valid'): tenant_id = str(tenant_id)
            if hasattr(sucursal_id, 'is_valid'): sucursal_id = str(sucursal_id)
                
            result = await db["users"].update_one(
                {"email": email},
                {"$set": {"tenant_id": tenant_id, "sucursal_id": sucursal_id}}
            )
            if result.modified_count > 0:
                print(f"Restored {email}: Tenant {tenant_id}, Sucursal {sucursal_id}")
                fixes_applied += 1

        print(f"Total fixes applied: {fixes_applied}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
