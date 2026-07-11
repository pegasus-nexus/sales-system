import pymongo
from bson import json_util
import json

uri = "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0"
client = pymongo.MongoClient(uri)

try:
    print("Connected successfully.")
    databases = client.list_database_names()
    system_dbs = ['admin', 'config', 'local']

    db_info = {}

    for db_name in databases:
        if db_name in system_dbs:
            continue
        db = client[db_name]
        collections = db.list_collection_names()
        db_info[db_name] = {}
        
        for coll_name in collections:
            coll = db[coll_name]
            sample = coll.find_one()
            count = coll.count_documents({})
            db_info[db_name][coll_name] = {
                "count": count,
                "sample_document": json.loads(json_util.dumps(sample)) if sample else None
            }

    print(json.dumps(db_info, indent=2))
except Exception as e:
    print(f"Error: {e}")
