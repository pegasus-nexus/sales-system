import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from motor.motor_asyncio import AsyncIOMotorClient

BOLIVIA_TZ = ZoneInfo("America/La_Paz")

async def audit_exact_dates():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await c.list_database_names()

    target_dates = ["2025-09-26", "2024-09-27"]

    print("\n=======================================================")
    print("      AUDITORÍA PROFUNDA EN MONGODB DE FECHAS CLAVE   ")
    print("=======================================================\n")

    for db_name in dbs:
        if db_name in ["admin", "config", "local"]:
            continue
        db = c[db_name]
        collections = await db.list_collection_names()
        print(f"📦 Base de datos: '{db_name}' (colecciones: {collections})")

        for col_name in collections:
            collection = db[col_name]
            all_docs = await collection.find({}).to_list(length=None)

            matching_2025 = []
            matching_2024 = []

            for doc in all_docs:
                doc_str = str(doc)
                if "2025-09-26" in doc_str:
                    matching_2025.append(doc)
                if "2024-09-27" in doc_str:
                    matching_2024.append(doc)

            if matching_2025 or matching_2024:
                print(f"   👉 Colección '{col_name}':")
                print(f"      - 2025-09-26 (Viernes 26 Sept 2025): {len(matching_2025)} coincidencias")
                for s in matching_2025[:5]:
                    print(f"        * ID: {s.get('_id')} | Total: {s.get('total') or s.get('total_neto')} | Fecha: {s.get('created_at') or s.get('fecha_bolivia')}")
                
                print(f"      - 2024-09-27 (Viernes 27 Sept 2024): {len(matching_2024)} coincidencias")
                for s in matching_2024[:5]:
                    print(f"        * ID: {s.get('_id')} | Total: {s.get('total') or s.get('total_neto')} | Fecha: {s.get('created_at') or s.get('fecha_bolivia')}")

    print("\n-------------------------------------------------------")
    print("🔍 AUDITORÍA ESPECÍFICA EN COLECCIÓN 'sales' (salessystem):")
    print("-------------------------------------------------------\n")

    col_sales = c["salessystem"]["sales"]
    sales_2025 = await col_sales.find({
        "$or": [
            {"fecha_bolivia": "2025-09-26"},
            {"created_at": {"$regex": "^2025-09-26"}}
        ]
    }).to_list(length=None)

    sales_2024 = await col_sales.find({
        "$or": [
            {"fecha_bolivia": "2024-09-27"},
            {"created_at": {"$regex": "^2024-09-27"}}
        ]
    }).to_list(length=None)

    print(f"📅 Viernes 26 de Septiembre 2025 (2025-09-26):")
    print(f"   • Cantidad de ventas: {len(sales_2025)}")
    print(f"   • Suma total de ingresos: Bs. {sum(float(s.get('total', 0) or s.get('total_neto', 0)) for s in sales_2025):,.2f}")

    print(f"\n📅 Viernes 27 de Septiembre 2024 (2024-09-27):")
    print(f"   • Cantidad de ventas: {len(sales_2024)}")
    print(f"   • Suma total de ingresos: Bs. {sum(float(s.get('total', 0) or s.get('total_neto', 0)) for s in sales_2024):,.2f}")

if __name__ == "__main__":
    asyncio.run(audit_exact_dates())
