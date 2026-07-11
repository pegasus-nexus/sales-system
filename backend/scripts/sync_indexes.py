import asyncio
import os
from pymongo import MongoClient, IndexModel, ASCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0")
DB_NAME = os.getenv("MONGO_DB_NAME", "sales_system_db")

def sync_inventario_indexes():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    coll = db["inventario"]

    print("--- 1. Buscando y limpiando documentos duplicados en Inventario ---")
    pipeline = [
        {
            "$group": {
                "_id": {
                    "tenant_id": "$tenant_id",
                    "sucursal_id": "$sucursal_id",
                    "almacen_id": "$almacen_id",
                    "producto_id": "$producto_id"
                },
                "count": {"$sum": 1},
                "docs": {"$push": "$_id"},
                "cantidades": {"$push": "$cantidad"}
            }
        },
        {
            "$match": {
                "count": {"$gt": 1}
            }
        }
    ]

    duplicates = list(coll.aggregate(pipeline))
    if not duplicates:
        print("[OK] No se encontraron duplicados. Todo en orden.")
    else:
        print(f"[!] Se encontraron {len(duplicates)} grupos de duplicados. Limpiando...")
        docs_to_delete = []
        for dup in duplicates:
            # Mantener el primer documento (o el que consideres mejor, aquí conservamos el primero)
            ids_to_remove = dup["docs"][1:]
            docs_to_delete.extend(ids_to_remove)
            print(f"   -> Resolviendo duplicados para producto_id {dup['_id']['producto_id']}. Eliminando {len(ids_to_remove)} documentos sobrantes.")
        
        if docs_to_delete:
            result = coll.delete_many({"_id": {"$in": docs_to_delete}})
            print(f"[OK] Se eliminaron {result.deleted_count} documentos huérfanos/duplicados.")

    print("\n--- 2. Asegurando Índice Único en MongoDB ---")
    try:
        # Intentar crear el índice único
        index = IndexModel(
            [("tenant_id", ASCENDING), ("sucursal_id", ASCENDING), ("almacen_id", ASCENDING), ("producto_id", ASCENDING)],
            unique=True,
            name="tenant_branch_warehouse_product_unique"
        )
        coll.create_indexes([index])
        print("[OK] Índice 'tenant_branch_warehouse_product_unique' creado o validado con éxito.")
    except Exception as e:
        print(f"[ERROR] Error al crear el índice: {e}")

if __name__ == "__main__":
    sync_inventario_indexes()
