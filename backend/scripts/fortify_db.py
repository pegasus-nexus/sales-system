import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0")
DB_NAME = os.getenv("MONGO_DB_NAME", "sales_system_db")

def fortify_db():
    client = MongoClient(MONGO_URI)
    
    # 1. Cleanup Unused Databases
    print("--- 1. Eliminando Bases de Datos Innecesarias ---")
    databases_to_drop = ['sample_mflix', 'taboada', 'test']
    existing_dbs = client.list_database_names()
    
    for db in databases_to_drop:
        if db in existing_dbs:
            client.drop_database(db)
            print(f"[OK] Base de datos eliminada: {db}")
        else:
            print(f"[INFO] Base de datos ya no existe: {db}")

    # 2. JSON Schema Validation
    print("\n--- 2. Aplicando JSON Schema Validation (Nivel 3 NoSQL) ---")
    db = client[DB_NAME]
    
    # Validacion estricta para 'inventario'
    # Requiere que SIEMPRE exista tenant_id, producto_id, sucursal_id y cantidad sea numérico
    inventario_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["tenant_id", "producto_id", "sucursal_id", "cantidad"],
            "properties": {
                "tenant_id": {
                    "bsonType": "string",
                    "description": "must be a string and is required for multitenant isolation"
                },
                "producto_id": {
                    "bsonType": ["string", "objectId"],
                    "description": "must be a string or objectId and is required"
                },
                "cantidad": {
                    "bsonType": ["double", "int", "long", "decimal"],
                    "description": "must be a numeric type and is required"
                }
            }
        }
    }
    
    try:
        db.command("collMod", "inventario", validator=inventario_schema, validationLevel="strict")
        print("[OK] Validación estricta JSON Schema aplicada a la colección 'inventario'")
    except Exception as e:
        if "ns does not exist" in str(e):
            db.create_collection("inventario", validator=inventario_schema)
            print("[OK] Colección 'inventario' creada con Validación Estricta")
        else:
            print(f"[ERROR] Error al aplicar validación a inventario: {e}")

    # Validacion estricta para 'products'
    products_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["tenant_id", "descripcion"],
            "properties": {
                "tenant_id": {
                    "bsonType": "string",
                    "description": "must be a string and is required"
                },
                "descripcion": {
                    "bsonType": "string",
                    "description": "must be a string and is required"
                }
            }
        }
    }

    try:
        db.command("collMod", "products", validator=products_schema, validationLevel="strict")
        print("[OK] Validación estricta JSON Schema aplicada a la colección 'products'")
    except Exception as e:
        if "ns does not exist" in str(e):
            db.create_collection("products", validator=products_schema)
            print("[OK] Colección 'products' creada con Validación Estricta")
        else:
            print(f"[ERROR] Error al aplicar validación a products: {e}")

    print("\n--- ¡Fortificación Completa! ---")

if __name__ == "__main__":
    fortify_db()
