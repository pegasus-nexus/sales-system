from pymongo import MongoClient
import json
from decimal import Decimal
from bson import Decimal128

client = MongoClient("mongodb+srv://admin_pegasus:pEq6G01zZEMk8dZp@pegasus-cluster.w7l51.mongodb.net/?retryWrites=true&w=majority&appName=pegasus-cluster")
db = client["pegasus_db"]

# Find product
product = db["products"].find_one({"descripcion": {"$regex": "(?i)bomb.n a la crema.*100.*"}})
if not product:
    print("Product not found")
else:
    print(f"Product found: {product['descripcion']} (ID: {product['_id']})")
    
    # Get inventory
    invs = list(db["inventarios"].find({"producto_id": str(product['_id'])}))
    print("\n--- INVENTORY ---")
    for i in invs:
        print(f"Sucursal: {i['sucursal_id']}, Cantidad: {i['cantidad']}")
        
    # Get Kardex
    logs = list(db["inventory_logs"].find({"producto_id": str(product['_id'])}).sort("created_at", 1))
    print("\n--- KARDEX (Last 20) ---")
    for log in logs[-20:]:
        print(f"[{log['created_at']}] {log['tipo_movimiento']} | Qty: {log['cantidad_movida']} -> Stock Resultante: {log['stock_resultante']} | {log['notas']}")

