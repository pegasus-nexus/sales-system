import asyncio
from pymongo import MongoClient
from datetime import datetime, timezone

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
db = client["sales_system_prod"]

tenant_id = "69cd7f0a8f3f6866d4cfbb62"

start = datetime(2026, 6, 1, tzinfo=timezone.utc)
end = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)

count_sales_june = db["sales"].count_documents({"created_at": {"$gte": start, "$lte": end}})
count_hist_june = db["ventas_historicas_crudas"].count_documents({
    "tenant_id": tenant_id,
    "fecha_venta": {"$gte": start.strftime("%Y-%m-%d"), "$lte": end.strftime("%Y-%m-%d")}
})

print("June sales (created_at):", count_sales_june)
print("June hist (fecha_venta):", count_hist_june)

# If June sales (created_at) is 0, let's see what the earliest created_at is!
first_sale = db["sales"].find().sort("created_at", 1).limit(1)
for s in first_sale:
    print("Earliest sale created_at:", s.get("created_at"))
