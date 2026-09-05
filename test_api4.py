from pymongo import MongoClient
import json

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

q1 = {
    "sucursal_id": "69cd80098f3f6866d4cfbb64",
    "producto_id": "6a85d046431b75defd6dbbc7",
    "": [{"almacen_id": "default"}, {"almacen_id": {"": False}}]
}
q2 = {
    "sucursal_id": "69cd80098f3f6866d4cfbb64",
    "producto_id": "6a85d046431b75defd6dbbc7"
}
doc2 = db["inventario"].find_one(q2)
print("doc2:", doc2)
doc1 = db["inventario"].find_one(q1)
print("doc1:", doc1)
