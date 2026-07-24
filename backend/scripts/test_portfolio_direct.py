import asyncio
from datetime import datetime, timezone
import json
from bson import ObjectId

async def run():
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    start = datetime.fromisoformat("2026-06-01T00:00:00.000Z").replace(tzinfo=timezone.utc)
    end = datetime.fromisoformat("2026-06-30T23:59:59.999Z").replace(tzinfo=timezone.utc)
    
    # Run the exact code from portfolio_service
    from app.services.portfolio_service import get_portfolio_data
    
    try:
        data = await get_portfolio_data(tenant_id, start, end, None)
        # Convert to dict and check for NaN or weird values
        products = data.products
        print(f"Total products: {len(products)}")
        for p in products:
            if not isinstance(p.total_ventas, (int, float)) or not isinstance(p.total_unidades, (int, float)):
                print(f"WEIRD TYPES: {p.nombre} -> ventas={p.total_ventas}, unidades={p.total_unidades}")
        print("First 2 products:")
        print(products[:2])
    except Exception as e:
        import traceback
        print(f"API service crashed: {repr(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
