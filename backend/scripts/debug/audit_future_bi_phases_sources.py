import asyncio
import json
from bson import Decimal128, ObjectId
from app.db import init_db, get_raw_db

def bson_default(obj):
    if isinstance(obj, Decimal128):
        return float(obj.to_decimal())
    if isinstance(obj, ObjectId):
        return str(obj)
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)

async def audit_future_bi_sources():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE COLECCIONES DE MONGODB PARA FUTURAS FASES DEL BI (FASES 6, 7, 8...)")
    print("=" * 90)

    collections = await db.list_collection_names()
    target_cols = [
        "inventario", "products", "categories", "descuentos",
        "pedidos", "compras", "caja", "users", "audit_logs"
    ]

    for col in target_cols:
        if col in collections:
            cnt = await db[col].count_documents({})
            sample = await db[col].find_one({})
            keys = list(sample.keys()) if sample else []
            print(f"\n📁 Colección '{col}': {cnt} documentos")
            print(f"   - Campos clave: {keys}")
            if sample:
                print(f"   - Muestra: {json.dumps(sample, indent=6, default=bson_default)[:250]}...")
        else:
            print(f"\n📁 Colección '{col}': NO EXISTE EN MONGODB")

    print("\n" + "=" * 90)
    print("FIN DE AUDITORÍA DE FUTURAS FUENTES BI")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_future_bi_sources())
