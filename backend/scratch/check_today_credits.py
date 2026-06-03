import asyncio
import os
import sys
from datetime import datetime, timedelta
import zoneinfo

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.infrastructure.db import init_db
from app.domain.models.sale import Sale

async def main():
    await init_db()
    
    # Bolivia time is UTC-4
    tz_bolivia = zoneinfo.ZoneInfo("America/La_Paz")
    
    # Let's search all sales for May 26, 2026
    start_dt = datetime(2026, 5, 26, 0, 0, 0, tzinfo=tz_bolivia)
    end_dt = datetime(2026, 5, 26, 23, 59, 59, tzinfo=tz_bolivia)
    
    # Convert to UTC for database matching
    start_utc = start_dt.astimezone(zoneinfo.ZoneInfo("UTC")).replace(tzinfo=None)
    end_utc = end_dt.astimezone(zoneinfo.ZoneInfo("UTC")).replace(tzinfo=None)
    
    print(f"Searching sales between UTC {start_utc} and {end_utc}...")
    
    sales = await Sale.find(
        Sale.created_at >= start_utc,
        Sale.created_at <= end_utc
    ).to_list()
    
    print(f"\nFound {len(sales)} total sales for today:")
    for s in sales:
        pagado = sum((p.monto for p in s.pagos), 0)
        print(f"ID: {s.id} | Ticket: {s.ticket_id or 'N/A'}")
        print(f"  Sucursal: {s.sucursal_id}")
        print(f"  Total: {s.total} | Pagado: {pagado} | Estado: {s.estado_pago}")
        print(f"  Anulada: {s.anulada}")
        print(f"  Pagos: {[(p.metodo, p.monto) for p in s.pagos]}")
        print(f"  Created At (UTC): {s.created_at}")

if __name__ == "__main__":
    asyncio.run(main())
