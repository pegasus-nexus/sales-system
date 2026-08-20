import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def search_sara():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    colls = await db.list_collection_names()
    for col_name in colls:
        try:
            docs = await db[col_name].find().to_list(None)
            for doc in docs:
                doc_str = str(doc).lower()
                if "sara" in doc_str and "lazart" in doc_str:
                    print(f"FOUND IN {col_name}: {doc.get('_id')}")
        except Exception as e:
            pass

if __name__ == '__main__':
    asyncio.run(search_sara())
