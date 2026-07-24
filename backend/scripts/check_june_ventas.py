import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    start_date = datetime.fromisoformat("2026-06-01T00:00:00.000Z").replace(tzinfo=timezone.utc)
    end_date = datetime.fromisoformat("2026-06-30T23:59:59.999Z").replace(tzinfo=timezone.utc)
    
    match = {
        "fecha_transaccion": {"$gte": start_date, "$lte": end_date},
        "$or": [
            {"tenant_id": tenant_id},
            {"tenant_id": None},
            {"tenant_id": {"$exists": False}}
        ],
        "sucursal": {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}
    }
    
    print("Match query:")
    print(match)
    
    count = await db["ventas_historicas_crudas"].count_documents(match)
    print(f"Total matching docs in June: {count}")
    
    # Check POS
    pos_match = {
        "created_at": {"$gte": start_date, "$lte": end_date},
        "tenant_id": tenant_id,
        "anulada": {"$ne": True}
    }
    count_pos = await db["sales"].count_documents(pos_match)
    print(f"Total POS matching docs in June: {count_pos}")

if __name__ == "__main__":
    asyncio.run(run())
