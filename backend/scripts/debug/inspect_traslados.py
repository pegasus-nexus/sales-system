import asyncio
from app.infrastructure.db import init_db
from app.domain.models.traslado import TrasladoInventario
from app.domain.models.inventario import InventoryLog, Inventario
from app.domain.models.product import Product

async def main():
    await init_db()
    tenant_id = '69cd7f0a8f3f6866d4cfbb62' # Chocolates Taboada
    traslados = await TrasladoInventario.find({"tenant_id": tenant_id}).to_list()
    print(f"Total traslados en tenant {tenant_id}: {len(traslados)}")
    
    estados = {}
    for t in traslados:
        st = str(getattr(t, "estado", ""))
        estados[st] = estados.get(st, 0) + 1
    print("Distribución por estados:", estados)
    
    # Check traslados EN_TRANSITO
    en_transito = [t for t in traslados if "EN_TRANSITO" in str(getattr(t, "estado", ""))]
    print(f"\nTraslados EN_TRANSITO ({len(en_transito)}):")
    for t in en_transito:
        items_summary = ", ".join([f"{i.descripcion} (cant={i.cantidad_enviada})" for i in t.items[:3]])
        print(f"  [{t.id}] De: '{t.sucursal_origen_nombre}' -> A: '{t.sucursal_destino_nombre}' | Fecha: {t.created_at} | Items: {items_summary}")

    # Check Inventario documents with null or missing almacen_id
    coll_inv = Inventario.get_motor_collection()
    null_almacen_count = await coll_inv.count_documents({
        "tenant_id": tenant_id,
        "$or": [
            {"almacen_id": None},
            {"almacen_id": {"$exists": False}}
        ]
    })
    print(f"\nDocumentos Inventario con almacen_id None o ausente: {null_almacen_count}")

    # Check for duplicate inventario documents for same (tenant_id, sucursal_id, producto_id, almacen_id)
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {
            "$group": {
                "_id": {
                    "sucursal_id": "$sucursal_id",
                    "producto_id": "$producto_id",
                    "almacen_id": {"$ifNull": ["$almacen_id", "default"]}
                },
                "count": {"$sum": 1},
                "cantidades": {"$push": "$cantidad"},
                "ids": {"$push": "$_id"}
            }
        },
        {"$match": {"count": {"$gt": 1}}}
    ]
    duplicates = await coll_inv.aggregate(pipeline).to_list(length=100)
    print(f"Duplicados de inventario encontrados: {len(duplicates)}")
    for d in duplicates[:5]:
        print(f"  Duplicado: {d}")

    # Check if any TRASLADO logs exist where stock_resultante doesn't match
    logs = await InventoryLog.find({
        "tenant_id": tenant_id,
        "tipo_movimiento": "TRASLADO"
    }).sort("-created_at").limit(10).to_list()
    print(f"\nÚltimos 10 logs de TRASLADO:")
    for l in logs:
        print(f"  [{l.created_at}] Prod: {l.producto_id} ({l.descripcion}) | Suc: {l.sucursal_id} | Cant: {l.cantidad_movida} | StockResultante: {l.stock_resultante} | Ref: {l.referencia_id} | Notas: {l.notas}")

if __name__ == "__main__":
    asyncio.run(main())
