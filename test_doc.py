from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

doc = db["inventario"].find_one({
    "sucursal_id": "69cd80098f3f6866d4cfbb64",
    "producto_id": "6a85d046431b75defd6dbbc7"
})
print(f"Document keys: {doc.keys()}")
print(f"almacen_id value: '{doc.get('almacen_id')}' (type: {type(doc.get('almacen_id'))})")
