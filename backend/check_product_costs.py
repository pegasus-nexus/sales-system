import asyncio
import sys
import os

sys.path.append(os.getcwd())
from app.infrastructure.db import init_db
from app.domain.models.product import Product

async def main():
    await init_db()
    products = await Product.find({"tenant_id": "69cd7f0a8f3f6866d4cfbb62"}).limit(10).to_list()
    for p in products:
        print(f"Producto: {p.descripcion} | Precio: {p.precio_venta} | Costo: {p.costo_producto}")
    
asyncio.run(main())
