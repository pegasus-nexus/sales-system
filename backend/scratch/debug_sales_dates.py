import asyncio
import motor.motor_asyncio
import pandas as pd
from datetime import datetime, timezone

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority')
    db = client.sales_system_prod
    
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    LOCAL_TZ = 'America/La_Paz'
    
    hoy_local = pd.Timestamp.now(tz=LOCAL_TZ).normalize()
    start_hoy_utc = hoy_local.tz_convert('UTC').to_pydatetime()
    end_hoy_utc = (hoy_local + pd.Timedelta(days=1)).tz_convert('UTC').to_pydatetime()
    
    print('start_hoy_utc:', start_hoy_utc)
    print('end_hoy_utc:  ', end_hoy_utc)
    
    # Fetch all sales from sales collection for this tenant
    sales = await db.sales.find({'tenant_id': tenant_id}).to_list(1000)
    print(f"Total sales in DB for tenant {tenant_id}: {len(sales)}")
    
    match_count = 0
    for s in sales:
        dt = s.get('created_at')
        if dt:
            # Check if dt in range
            dt_utc = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
            if start_hoy_utc <= dt_utc < end_hoy_utc:
                match_count += 1
                print(f"  Matched sale: {s['_id']}, created_at: {dt}, total: {s.get('total')}")
                
    print(f"Total matched sales today in python loop: {match_count}")

if __name__ == '__main__':
    asyncio.run(main())
