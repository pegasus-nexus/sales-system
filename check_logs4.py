from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

logs = list(db["inventory_logs"].find({
    "producto_id": "6a85d046431b75defd6dbbc7",
    "sucursal_id": "69cd80098f3f6866d4cfbb64"
}).sort("_id", -1).limit(10))

for log in logs:
    print(f"Log {log.get('created_at')}: {log.get('tipo_movimiento')} | Cant: {log.get('cantidad_movida')} | StockResultante: {log.get('stock_resultante')}")
    
