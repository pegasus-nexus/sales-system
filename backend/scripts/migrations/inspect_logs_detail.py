import os
import pymongo
from pymongo import MongoClient

# MongoDB URL from the environment or default
mongo_url = os.getenv("MONGODB_URL", "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0")
client = MongoClient(mongo_url)
db = client.salessystem

# Let's inspect the logs for the two products specifically in Suc. Heroinas
p1_id = "69a7bafdd0fa79d2299f985f" # TABLETA BLANCA C/FRUTILLAS DESHIDRATADAS- 100G
p2_id = "69cd81b68f3f6866d4cfbc2d" # TABLETA SEMI AMARGO SIN AZÚCAR 50 gr taboada
suc_id = "69cd80098f3f6866d4cfbb64" # Suc. Heroinas

print("--- Product 1 Logs Detail ---")
logs1 = list(db.inventory_logs.find({"producto_id": p1_id, "sucursal_id": suc_id}).sort("created_at", 1))
for l in logs1:
    print(f"ID: {l['_id']} | FECHA: {l.get('created_at')} | TIPO: {l.get('tipo_movimiento')} | TENANT: {l.get('tenant_id')} | QTY: {l.get('cantidad_movida')} | STOCK: {l.get('stock_resultante')} | NOTAS: {l.get('notas')}")

print("\n--- Product 2 Logs Detail ---")
logs2 = list(db.inventory_logs.find({"producto_id": p2_id, "sucursal_id": suc_id}).sort("created_at", 1))
for l in logs2:
    print(f"ID: {l['_id']} | FECHA: {l.get('created_at')} | TIPO: {l.get('tipo_movimiento')} | TENANT: {l.get('tenant_id')} | QTY: {l.get('cantidad_movida')} | STOCK: {l.get('stock_resultante')} | NOTAS: {l.get('notas')}")
