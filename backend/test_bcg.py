import asyncio
import os
import sys

from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db
from app.services.bcg_service import get_bcg_matrix

async def main():
    await init_db()
    res = await get_bcg_matrix(
        tenant_id="69cd7f0a8f3f6866d4cfbb62",
        sucursal_id=None
    )
    
    # print matrix counts
    print(f"Total productos en BCG: {len(res)}")
    if len(res) > 0:
        print(f"Primer producto: {res[0]}")

if __name__ == "__main__":
    asyncio.run(main())
