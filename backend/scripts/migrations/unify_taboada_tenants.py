import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    mongo_url = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
    db = client.sales_system_prod
    
    legacy_tenant = "69a7cb3ba61102aca89bd271"
    current_tenant = "69cd7f0a8f3f6866d4cfbb62"
    
    print(f"=== MIGRACIÓN: UNIFICACIÓN DE TENANTS PARA TABOADA ===")
    print(f"Tenant Origen (Legacy): {legacy_tenant}")
    print(f"Tenant Destino (Current): {current_tenant}")
    print("=====================================================")
    
    # 1. Colecciones que necesitan actualizar tenant_id de legacy_tenant a current_tenant
    collections_to_update = [
        "ventas_historicas_crudas",
        "sales",
        "users",
        "caja_movimientos",
        "caja_sesiones",
        "categories",
        "clientes",
        "sale_items",
        "inventory_logs",
        "pedido_items",
        "cuentas_credito"
    ]
    
    for coll_name in collections_to_update:
        coll = db[coll_name]
        
        # Contar cuántos documentos coinciden con el tenant origen
        legacy_count = await coll.count_documents({"tenant_id": legacy_tenant})
        if legacy_count > 0:
            print(f"Colección [{coll_name}]: Encontrados {legacy_count} documentos del tenant legacy. Actualizando...")
            res = await coll.update_many(
                {"tenant_id": legacy_tenant},
                {"$set": {"tenant_id": current_tenant}}
            )
            print(f"  -> Modificados: {res.modified_count} documentos.")
        else:
            print(f"Colección [{coll_name}]: No hay documentos del tenant legacy.")

    # 2. Casos especiales: ventas sin tenant_id en la colección sales
    sales_coll = db["sales"]
    null_tenant_count = await sales_coll.count_documents({"tenant_id": None})
    if null_tenant_count > 0:
        print(f"\nColección [sales]: Encontradas {null_tenant_count} ventas con tenant_id=None. Normalizando al tenant current...")
        res = await sales_coll.update_many(
            {"tenant_id": None},
            {"$set": {"tenant_id": current_tenant}}
        )
        print(f"  -> Modificadas: {res.modified_count} ventas con tenant_id=None.")
    else:
        print("\nColección [sales]: No hay ventas con tenant_id=None.")

    print("\n=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===")

if __name__ == "__main__":
    asyncio.run(run())
