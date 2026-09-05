from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

q1 = {
    "sucursal_id": "69cd80098f3f6866d4cfbb64",
    "producto_id": "6a85d046431b75defd6dbbc7",
    "": [{"almacen_id": "default"}, {"almacen_id": {"": False}}]
}

explain = db.command('explain', {'find': 'inventario', 'filter': q1})
import pprint
pprint.pprint(explain)
