from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

search_query = {
    "sucursal_id": "69cd80098f3f6866d4cfbb64",
    "producto_id": "6a85d046431b75defd6dbbc7",
    "almacen_id": "default"
}

doc = db["inventario"].find_one(search_query)
print(f"Doc found with explicit almacen_id: {doc is not None}")
