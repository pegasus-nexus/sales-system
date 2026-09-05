from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

c = db["clientes"].find_one({"is_miembro_comunidad": True, "datos_crm.premios_canjeados.0": {"$exists": True}})
if c:
    print(c["datos_crm"]["premios_canjeados"])
else:
    print("None found")
