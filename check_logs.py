from pymongo import MongoClient
import json

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

# Find inventory logs for this product today
logs = list(db["inventory_logs"].find({
    "producto_id": "6a85d046431b75defd6dbbc7",
    "tipo_movimiento": {"": ["TRASLADO", "VENTA", "AJUSTE_MASIVO", "RECEPCION_INTERNA"]}
}).sort("_id", -1).limit(10))

for log in logs:
    print(f"Log {log.get('created_at')}: {log.get('tipo_movimiento')} | Cant: {log.get('cantidad_movida')} | Suc: {log.get('sucursal_id')} | Notas: {log.get('notas')}")

