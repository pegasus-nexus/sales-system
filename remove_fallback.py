import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

old_cost = """{"$ifNull": ["$$item.costo_unitario", {"$multiply": [{"$ifNull": ["$$item.precio_unitario", 0]}, 0.70]}]}"""
new_cost = """{"$ifNull": ["$$item.costo_unitario", 0]}"""

if old_cost in content:
    content = content.replace(old_cost, new_cost)
    with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Removed 70% fallback!")
else:
    print("Could not find fallback string.")
