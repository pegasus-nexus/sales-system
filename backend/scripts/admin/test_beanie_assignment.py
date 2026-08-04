import asyncio
from app.infrastructure.db import init_db
from app.domain.models.product import Product

async def main():
    await init_db()
    
    # Fetch 1 product
    p = await Product.find_one()
    print("Original p.precio_venta:", p.precio_venta, type(p.precio_venta))
    print("Original model_dump():", p.model_dump().get("precio_venta"))
    
    # Assign float to p.precio_venta
    p.precio_venta = 63.0
    print("\nAfter assigning p.precio_venta = 63.0:")
    print("p.precio_venta attribute:", p.precio_venta, type(p.precio_venta))
    print("model_dump():", p.model_dump().get("precio_venta"))

if __name__ == "__main__":
    asyncio.run(main())
