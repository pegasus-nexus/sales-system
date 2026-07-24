import asyncio
from datetime import datetime, timezone
import dateutil.parser
from pymongo import MongoClient
import os
import sys

# Import calculate_bcg_matrix
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "app"))
from services.bcg_service import calculate_bcg_matrix

async def test():
    # Exactly what frontend sends
    start_str = "2026-06-01T04:00:00.000Z"
    end_str = "2026-07-01T03:59:59.999Z"
    
    start_date = dateutil.parser.isoparse(start_str)
    end_date = dateutil.parser.isoparse(end_str)
    
    print(f"Parsed start: {start_date}, tz: {start_date.tzinfo}")
    print(f"Parsed end: {end_date}, tz: {end_date.tzinfo}")
    
    client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    res = await calculate_bcg_matrix(db, tenant_id, start_date, end_date)
    
    print("Estrellas:", len(res.estrellas))
    print("Vacas:", len(res.vacas))
    print("Interrogantes:", len(res.interrogantes))
    print("Perros:", len(res.perros))
    
    if len(res.perros) > 0:
        print("Sample perro:", res.perros[0].model_dump())

if __name__ == "__main__":
    asyncio.run(test())
