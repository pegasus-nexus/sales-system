import asyncio
from pymongo import MongoClient
import pprint

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
db = client["sales_system_prod"]
tenant_id = "69cd7f0a8f3f6866d4cfbb62"

sucursales = list(db["sucursales"].find({"tenant_id": tenant_id}))
print(f"Total sucursales: {len(sucursales)}")
for s in sucursales:
    print(f"ID: {s['_id']}, Nombre: {s.get('nombre')}, Tipo: {s.get('tipo')}")

# Also let's check a June sale's sucursal_id
from datetime import datetime, timezone
start = datetime(2026, 6, 1, tzinfo=timezone.utc)
end = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)

sale = db["sales"].find_one({"created_at": {"$gte": start, "$lte": end}})
print(f"\nSample sale sucursal_id: {sale.get('sucursal_id')}")

# Check how many sales match retail_ids
retail_ids = [str(s["_id"]) for s in sucursales if "retail" in s.get("tipo", "").lower() or "retail" in s.get("nombre", "").lower()]
print(f"Retail IDs: {retail_ids}")

count_retail_sales = db["sales"].count_documents({
    "created_at": {"$gte": start, "$lte": end},
    "sucursal_id": {"$in": retail_ids}
})
print(f"Sales matching retail_ids in June: {count_retail_sales}")

