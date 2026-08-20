import asyncio
import json
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import json_util

MONGODB_URL = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"
BACKUP_DIR = f"c:/Users/rodri/Desktop/BACKUP_PROD_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

async def backup():
    print(f"Conectando a {DB_NAME} en producción...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    collections = await db.list_collection_names()
    print(f"Encontradas {len(collections)} colecciones. Descargando...")
    
    for coll_name in collections:
        print(f"Exportando {coll_name}...")
        cursor = db[coll_name].find({})
        docs = await cursor.to_list(length=None)
        
        filepath = os.path.join(BACKUP_DIR, f"{coll_name}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(json_util.dumps(docs, ensure_ascii=False, indent=2))
            
    print(f"\n¡Backup completado exitosamente!\nTodos los datos están guardados en:\n{BACKUP_DIR}")

if __name__ == "__main__":
    asyncio.run(backup())
