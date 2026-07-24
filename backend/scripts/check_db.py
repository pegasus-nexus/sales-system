import asyncio
from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
db = client["sales_system_prod"]

tenant_id = "69cd7f0a8f3f6866d4cfbb62"

count_sales = db["sales"].count_documents({"tenant_id": tenant_id})
count_hist = db["ventas_historicas_crudas"].count_documents({"tenant_id": tenant_id})

print("Sales count:", count_sales)
print("Hist count:", count_hist)

sample_hist = db["ventas_historicas_crudas"].find_one()
print("Sample hist tenant:", sample_hist.get("tenant_id") if sample_hist else "None")
