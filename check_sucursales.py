from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

sucursales = list(db["sucursales"].find({}).limit(5))
for s in sucursales:
    print(f"Sucursal {s.get('_id')} (type: {type(s.get('_id'))}): {s.get('nombre')}")
    
