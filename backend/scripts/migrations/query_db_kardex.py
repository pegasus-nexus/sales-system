import os
import pymongo
from pymongo import MongoClient

# MongoDB URL from the environment or default
mongo_url = os.getenv("MONGODB_URL", "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0")
client = MongoClient(mongo_url)
db = client.salessystem

# Let's list all sucursal IDs containing Heroinas
sucursales = list(db.sucursales.find())
heroinas_ids = [str(s['_id']) for s in sucursales if 'heroinas' in s.get('nombre', '').lower()]
print("Heroinas Sucursal IDs:", heroinas_ids)

product_names = [
    "TABLETA BLANCA C/FRUTILLAS DESHIDRATADAS- 100G",
    "TABLETA SEMI AMARGO SIN AZÚCAR 50 gr taboada"
]

# Find products
products = []
for name in product_names:
    p_docs = list(db.products.find({"descripcion": {"$regex": name.replace('-', ' '), "$options": "i"}}))
    p_docs_raw = list(db.products.find({"descripcion": {"$regex": name, "$options": "i"}}))
    p_docs = p_docs + [p for p in p_docs_raw if p not in p_docs]
    for p in p_docs:
        products.append(p)

for p in products:
    p_id = str(p['_id'])
    p_name = p['descripcion']
    
    for s_id in heroinas_ids:
        s_name = next(s.get('nombre') for s in sucursales if str(s['_id']) == s_id)
        
        logs = list(db.inventory_logs.find({"producto_id": p_id, "sucursal_id": s_id}).sort("created_at", 1))
        if not logs:
            continue
            
        print(f"\n=======================================================")
        print(f"Product: {p_name} ({p_id}) | Sucursal: {s_name} ({s_id})")
        print(f"=======================================================")
        print(f"{'FECHA':<20} | {'TIPO':<15} | {'QTY':<5} | {'STOCK RESULT':<12} | {'NOTAS':<30} | {'ID':<24}")
        print("-" * 115)
        for log in logs:
            fecha_str = log['created_at'].strftime("%Y-%m-%d %H:%M:%S") if 'created_at' in log else 'None'
            tipo = log.get('tipo_movimiento', 'None')
            qty = log.get('cantidad_movida', 0)
            stock_res = log.get('stock_resultante', 0)
            notes = log.get('notas', '')[:30]
            log_id = str(log['_id'])
            print(f"{fecha_str:<20} | {tipo:<15} | {qty:<5} | {stock_res:<12} | {notes:<30} | {log_id:<24}")
