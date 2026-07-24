import asyncio
from datetime import datetime
from app.db import get_raw_db
from app.infrastructure.db import init_db

async def main():
    await init_db()
    db = await get_raw_db()
    
    print("Ventas sample:")
    v_sample = await db.ventas.find_one()
    if v_sample:
        for k, v in v_sample.items():
            print(f"  {k}: {type(v)} = {v}")
    else:
        print("  No ventas found")

    print("\nTransacciones sample:")
    t_sample = await db.transacciones.find_one()
    if t_sample:
        for k, v in t_sample.items():
            print(f"  {k}: {type(v)} = {v}")
    else:
        print("  No transacciones found")

if __name__ == "__main__":
    asyncio.run(main())
