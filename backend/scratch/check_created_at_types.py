import asyncio
import motor.motor_asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority')
    db = client.sales_system_prod
    
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    
    sales = await db.sales.find({'tenant_id': tenant_id}).to_list(100)
    print(f"Total sales fetched for tenant: {len(sales)}")
    
    date_types = set()
    sample_dates = []
    for s in sales:
        c = s.get('created_at')
        date_types.add(type(c))
        if len(sample_dates) < 5:
            sample_dates.append(c)
            
    print("Types found:", date_types)
    print("Sample dates:", sample_dates)

if __name__ == '__main__':
    asyncio.run(main())
