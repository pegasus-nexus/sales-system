import asyncio
from pymongo import MongoClient
from datetime import datetime, timezone
import pprint

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
db = client["sales_system_prod"]

start = datetime(2026, 6, 1, tzinfo=timezone.utc)
end = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)

sample_sale = db["sales"].find_one({"created_at": {"$gte": start, "$lte": end}})
print("Sample June sale:")
pprint.pprint(sample_sale)
