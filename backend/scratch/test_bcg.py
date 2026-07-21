import asyncio
import pandas as pd
from datetime import datetime, timezone, timedelta
from app.db import init_db
from app.services.bcg_service import calculate_bcg_matrix

async def main():
    await init_db()
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=30)
    
    print("Ejecutando matriz BCG para tenant predeterminado...")
    # Se consulta la Matriz BCG pasando un tenant_id de prueba / admin
    res = await calculate_bcg_matrix(
        tenant_id="admin_tenant",
        start_date=start_date,
        end_date=end_date
    )
    print("Completado.")

if __name__ == "__main__":
    asyncio.run(main())
