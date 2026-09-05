from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

confs = db["web_configs"].find()
for conf in confs:
    print(conf)
