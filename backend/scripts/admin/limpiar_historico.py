import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def cleanup_historical_sales():
    print("Conectando a MongoDB para limpiar ventas_historicas_crudas...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    tenant_id = "69a7cb3ba61102aca89bd271"

    count_total = await db.ventas_historicas_crudas.count_documents({"tenant_id": tenant_id})
    print(f"\n[!] Registros actuales en ventas_historicas_crudas: {count_total}")

    if count_total == 0:
        print("La colección 'ventas_historicas_crudas' ya está vacía.")
        return

    print("\nOpciones de Limpieza:")
    print(" 1. Vaciar TODO el historial (Eliminar los", count_total, "registros)")
    print(" 2. Vaciar solo un Año específico (ej. solo 2025)")
    print(" 3. Cancelar")

    opcion = input("\nSelecciona una opción (1, 2 o 3): ").strip()

    if opcion == "1":
        confirm = input("⚠️ ¿Confirmas eliminar TODOS los registros históricos? Escribe 'SI': ").strip().upper()
        if confirm in ["SI", "Y", "YES"]:
            res = await db.ventas_historicas_crudas.delete_many({"tenant_id": tenant_id})
            print(f"✅ Se han eliminado {res.deleted_count} registros históricos correctamente.")
        else:
            print("Operación cancelada.")
    elif opcion == "2":
        year_str = input("Ingresa el año a eliminar (ej. 2025): ").strip()
        if year_str.isdigit():
            year = int(year_str)
            start_date = datetime(year, 1, 1)
            end_date = datetime(year + 1, 1, 1)
            confirm = input(f"⚠️ ¿Confirmas eliminar registros del año {year}? Escribe 'SI': ").strip().upper()
            if confirm in ["SI", "Y", "YES"]:
                res = await db.ventas_historicas_crudas.delete_many({
                    "tenant_id": tenant_id,
                    "fecha_transaccion": {"$gte": start_date, "$lt": end_date}
                })
                print(f"✅ Se han eliminado {res.deleted_count} registros del año {year}.")
            else:
                print("Operación cancelada.")
    else:
        print("Operación cancelada.")

if __name__ == "__main__":
    asyncio.run(cleanup_historical_sales())
