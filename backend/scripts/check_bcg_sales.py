import asyncio
from pymongo import MongoClient
from datetime import datetime, timezone
from bson import ObjectId

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
db = client["sales_system_prod"]

tenant_id = "69cd7f0a8f3f6866d4cfbb62"

# 1. Fetch sucursales just like bcg_service
cursor_sucursales = db.sucursales.find({"tenant_id": tenant_id})
retail_ids = []
for s in cursor_sucursales:
    nl = str(s.get("nombre", "")).lower()
    if any(bad in nl for bad in ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista", "supermercados"]):
        continue
    if any(good in nl for good in ["hero", "calacoto", "recoleta"]):
        retail_ids.append(str(s["_id"]))
        try:
            if ObjectId.is_valid(str(s["_id"])):
                retail_ids.append(ObjectId(s["_id"]))
        except Exception:
            pass

print("Retail IDs:", retail_ids)

start = datetime(2026, 6, 1, tzinfo=timezone.utc)
end = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)

# 2. Check pos match
match_pos = {
    "anulada": {"$ne": True},
    "created_at": {"$gte": start, "$lte": end},
    "sucursal_id": {"$in": retail_ids}
}

count_pos = db["sales"].count_documents(match_pos)
print("POS Sales matching in June:", count_pos)
