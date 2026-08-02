import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load .env file
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

async def test_connection():
    mongo_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("MONGODB_DB_NAME", "sales_system_prod")
    
    print(f"Connecting to MongoDB: {mongo_url.split('@')[-1] if mongo_url else 'None'}")
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection by listing collections
        collections = await db.list_collection_names()
        print("Success! Connected to MongoDB Atlas.")
        print(f"Database: '{db_name}'")
        print(f"Collections found: {collections}")
        
        # Count documents in each collection
        for col_name in collections:
            count = await db[col_name].count_documents({})
            print(f" - {col_name}: {count} documents")
            
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
