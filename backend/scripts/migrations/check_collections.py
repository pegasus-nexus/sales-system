import os
from pymongo import MongoClient

mongo_url = os.getenv("MONGODB_URL", "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0")
client = MongoClient(mongo_url)

print("Databases:", client.list_database_names())
for db_name in client.list_database_names():
    db = client[db_name]
    print(f"\nDatabase: {db_name}")
    print("Collections:", db.list_collection_names())
