from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
db = client["sales_system_prod"]

invs = list(db["inventario"].find({
    "producto_id": "6a85d046431b75defd6dbbc7",
    "sucursal_id": "69cd80098f3f6866d4cfbb64"
}))

print(f"Encontrados {len(invs)} registros de inventario en Heroinas:")
for inv in invs:
    print(f"ID: {inv.get('_id')}")
    print(f"  Cantidad: {inv.get('cantidad')}")
    print(f"  Almacen ID: {inv.get('almacen_id')}")
    print(f"  Tenant ID: {inv.get('tenant_id')}")

