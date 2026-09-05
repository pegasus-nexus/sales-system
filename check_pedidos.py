from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
dbs = client.list_database_names()
print(f"Databases: {dbs}")

db_name = None
for d in dbs:
    if "prod" in d.lower():
        db_name = d
        
if not db_name:
    db_name = "sales_system"

db = client[db_name]
print(f"Using DB: {db_name}")

# Get the last 3 pedidos internos
pedidos = list(db["pedidos_internos"].find().sort("_id", -1).limit(3))
for p in pedidos:
    print(f"\nPedido {p.get('_id')}:")
    print(f"  Origen: {p.get('sucursal_origen_id')}, Destino: {p.get('sucursal_destino_id')}")
    print(f"  Tipo: {p.get('tipo_pedido')}, Estado: {p.get('estado')}")
    print(f"  Notas: {p.get('notas')}")
    print(f"  Items: {p.get('items')}")
    
