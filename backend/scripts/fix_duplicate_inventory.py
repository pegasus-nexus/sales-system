import asyncio
import os
import sys

# Agregar la ruta raíz del backend para importar los módulos correctamente
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infrastructure.core.config import settings
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

async def main():
    print("Conectando a la base de datos...")
    client = MongoClient(settings.MONGODB_URL)
    db = client.get_database()
    coll = db["inventario"]

    # 1. Encontrar todos los productos duplicados por (tenant_id, sucursal_id, producto_id)
    pipeline = [
        {
            "$group": {
                "_id": {
                    "t": "$tenant_id",
                    "s": "$sucursal_id",
                    "p": "$producto_id"
                },
                "count": {"$sum": 1},
                "docs": {"$push": "$$ROOT"}
            }
        },
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    duplicados = list(coll.aggregate(pipeline))
    print(f"Se encontraron {len(duplicados)} grupos de productos duplicados en el inventario.")

    # 2. Unificar duplicados sumando sus cantidades
    for grupo in duplicados:
        tenant_id = grupo["_id"]["t"]
        sucursal_id = grupo["_id"]["s"]
        producto_id = grupo["_id"]["p"]
        docs = grupo["docs"]

        # Determinar el documento principal que mantendremos (preferiblemente uno que ya tenga almacen_id)
        doc_principal = next((d for d in docs if d.get("almacen_id") == "default"), docs[0])
        
        # Sumar el inventario total de todos los duplicados
        total_cantidad = sum(d.get("cantidad", 0) for d in docs)
        
        # Obtener los IDs de todos los documentos EXCEPTO el principal
        ids_a_borrar = [d["_id"] for d in docs if d["_id"] != doc_principal["_id"]]

        # Actualizar el documento principal con la suma total y asegurar almacen_id="default"
        coll.update_one(
            {"_id": doc_principal["_id"]},
            {
                "$set": {
                    "cantidad": total_cantidad,
                    "almacen_id": "default"
                }
            }
        )

        # Eliminar los documentos sobrantes
        coll.delete_many({"_id": {"$in": ids_a_borrar}})
        
        print(f"Unificado: Producto {producto_id} en Sucursal {sucursal_id}. Cantidad final: {total_cantidad}. {len(ids_a_borrar)} docs eliminados.")

    # 3. Normalizar todos los documentos que no tengan almacen_id
    sin_almacen = coll.count_documents({"almacen_id": {"$exists": False}})
    if sin_almacen > 0:
        print(f"Normalizando {sin_almacen} documentos antiguos sin almacen_id...")
        coll.update_many(
            {"almacen_id": {"$exists": False}},
            {"$set": {"almacen_id": "default"}}
        )
        print("Documentos antiguos actualizados con almacen_id='default'.")
    else:
        print("No se encontraron documentos sin almacen_id.")

    # 4. (Opcional pero Recomendado) Intentar recrear el índice único nuevo para evitar problemas futuros
    try:
        coll.create_index(
            [("tenant_id", 1), ("sucursal_id", 1), ("almacen_id", 1), ("producto_id", 1)],
            unique=True,
            name="tenant_branch_warehouse_product_unique"
        )
        print("Índice único 'tenant_branch_warehouse_product_unique' verificado/creado con éxito.")
    except DuplicateKeyError:
        print("No se pudo crear el índice único porque aún hay datos duplicados que no coinciden con este patrón.")
    except Exception as e:
        print(f"Nota al crear el índice: {e}")

    print("Limpieza completada.")

if __name__ == "__main__":
    asyncio.run(main())
