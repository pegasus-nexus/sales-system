import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority')
    db = client.sales_system_prod
    
    sale_id = ObjectId('6a5f9858cd9c1cd81464c6e9')
    res = await db.sales.aggregate([
        {'$match': {'_id': sale_id}},
        {'$project': {'type_created_at': {'$type': '$created_at'}, 'created_at': 1}}
    ]).to_list(1)
    print('Mongo BSON type of created_at in sales collection:', res)

    # Let's check sales created today in sales collection
    all_today = await db.sales.find({}).sort('created_at', -1).limit(5).to_list(5)
    for s in all_today:
        print('Sale:', s['_id'], s.get('created_at'), type(s.get('created_at')))

if __name__ == '__main__':
    asyncio.run(main())
