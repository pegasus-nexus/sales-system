import asyncio
from app.infrastructure.db import init_db
from app.domain.models.product import Product

async def test():
    await init_db()
    
    p1 = await Product.get("69a7bafdd0fa79d2299f987c")
    p2 = await Product.get("69a6fe979515c926b5a12629")
    
    print(f"Product 1: {p1.tenant_id} - {p1.descripcion}")
    print(f"Product 2: {p2.tenant_id} - {p2.descripcion}")

asyncio.run(test())
