import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db
from app.services.bcg_service import get_bcg_matrix

async def main():
    await init_db()
    res = await get_bcg_matrix("69cd7f0a8f3f6866d4cfbb62")
    
    # print matrix counts
    print("Cuadrantes:")
    for quad, items in res.get("matrix", {}).items():
        print(f"  {quad}: {len(items)} productos")
    print(f"Total Ingresos: {res.get('total_revenue')}")
    print(f"Productos Totales Evaluados: {res.get('total_products_evaluated')}")

if __name__ == "__main__":
    asyncio.run(main())
