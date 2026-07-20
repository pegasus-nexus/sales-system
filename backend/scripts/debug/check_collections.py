import asyncio
from pymongo import MongoClient

async def main():
    url = "mongodb+srv://sahian-dev-mongo:8wngkGRxGBKg3gsu@sales-system.hh277gd.mongodb.net/?appName=sales-system"
    client = MongoClient(url)
    db = client["salessystem"]
    print("Collections:", db.list_collection_names())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
