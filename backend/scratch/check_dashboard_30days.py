import asyncio
from datetime import datetime
from app.infrastructure.db import init_db
from app.services.analytics_service import get_dashboard_metrics

async def test():
    await init_db()
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    # Pasar start_date y end_date de junio, pero time_range = "30days"
    start_date = datetime.strptime("2026-06-01T00:00:00-04:00", "%Y-%m-%dT%H:%M:%S-04:00")
    end_date = datetime.strptime("2026-06-30T23:59:59-04:00", "%Y-%m-%dT%H:%M:%S-04:00")
    
    res = await get_dashboard_metrics(
        tenant_id=tenant_id,
        start_date=start_date,
        end_date=end_date,
        sucursal_id=None,
        time_range="30days" # Esto es lo que FastAPI recibe por defecto!
    )
    
    trend = res.get("revenue_trend", [])
    print(f"Total registros devueltos en la tendencia para '30days': {len(trend)}")
    
    week_sum = 0
    week_tickets = 0
    for day in trend:
        day_date = datetime.strptime(day["name"], "%Y-%m-%d").date()
        if datetime(2026, 6, 1).date() <= day_date <= datetime(2026, 6, 7).date():
            print(f"  Día {day['name']}: {day['ingresos']} bs, {day['tickets']} tkt")
            week_sum += day["ingresos"]
            week_tickets += day["tickets"]
            
    print(f"\nSuma total Tendencia de la Semana 1 (1 jun al 7 jun) para '30days':")
    print(f"  Ingresos: {week_sum}")
    print(f"  Tickets: {week_tickets}")

if __name__ == "__main__":
    asyncio.run(test())
