import asyncio
import sys
import os

sys.path.append(os.getcwd())

from app.api.v1.endpoints.dashboard_matriz import get_dashboard_matriz
from app.domain.models.user import User

async def main():
    try:
        from app.infrastructure.core.database import init_db
        # We don't have db connection, so this will fail, but we want to see if the syntax is correct.
        pass
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
print("Syntax is OK")
