import os
from pymongo import MongoClient

mongo_url = os.getenv("MONGODB_URL", "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0")
client = MongoClient(mongo_url)
db = client.salessystem

logs = list(db.inventory_logs.find({"tipo_movimiento": {"$in": ["ENTRADA_MANUAL", "SALIDA_MANUAL"]}}).limit(10))
print("--- Sample Manual Adjustment Logs ---")
for l in logs:
    print(f"ID: {l['_id']} | Tipo: {l.get('tipo_movimiento')} | Descripcion: {repr(l.get('descripcion'))} | Notas: {l.get('notas')}")
