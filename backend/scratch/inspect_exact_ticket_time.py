import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    await init_db()
    db = await get_raw_db()

    # Search for ticket CCAE3F or CCAE3F in sales
    tickets = ["CCAE3F", "CCAE2A", "CCAE24", "CCAE1F", "CCAE1A", "CCAE12", "CCAE08", "CCAE01", "CCADFB"]
    
    docs = await db.sales.find({
        "$or": [
            {"numero_ticket": {"$in": tickets}},
            {"codigo_ticket": {"$in": tickets}}
        ]
    }).to_list(100)

    if not docs:
        # Search by last characters of ID or regex
        docs = await db.sales.find({
            "tenant_id": "69cd7f0a8f3f6866d4cfbb62"
        }).to_list(1000)
        
        # filter by matching total 332.00, 113.00, etc.
        docs = [d for d in docs if str(d.get("_id")).endswith("ccae3f") or d.get("total") in [332, "332", 332.0, 113, "113", 113.0]]

    print(f"Documentos encontrados ({len(docs)}):")
    for d in docs:
        print(f"  Ticket: {d.get('numero_ticket')} | ID: {d.get('_id')} | created_at (BSON UTC): {d.get('created_at')} | total: {d.get('total')}")

asyncio.run(main())
