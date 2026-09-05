from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

q1 = {
    "sucursal_id": "69cd80098f3f6866d4cfbb64",
    "producto_id": "6a85d046431b75defd6dbbc7",
    "$or": [{"almacen_id": "default"}, {"almacen_id": {"$exists": False}}]
}
doc1 = db["inventario"].find_one(q1)
print(f"doc1 with $or: {doc1 is not None}")
