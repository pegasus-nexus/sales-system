import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_ventas_historicas():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await c.list_database_names()
    
    for db_name in dbs:
        if db_name in ["admin", "config", "local"]:
            continue
        cols = await c[db_name].list_collection_names()
        if "ventas_historicas_crudas" in cols:
            col = c[db_name]["ventas_historicas_crudas"]
            count = await col.count_documents({})
            print(f"🎯 Base de datos '{db_name}' tiene 'ventas_historicas_crudas' con {count} documentos!")
            
            # Buscar ventas en 2025-09-26 y 2024-09-27
            q2025 = {"fecha_transaccion": {"$gte": "2025-09-26", "$lte": "2025-09-26T23:59:59"}}
            docs_2025 = await col.find(q2025).to_list(length=10)
            print(f"   Documentos 2025-09-26 (string): {len(docs_2025)}")
            
            # Probar con datetime
            from datetime import datetime
            dt1 = datetime(2025, 9, 26, 0, 0, 0)
            dt2 = datetime(2025, 9, 26, 23, 59, 59)
            docs_2025_dt = await col.find({"fecha_transaccion": {"$gte": dt1, "$lte": dt2}}).to_list(length=None)
            print(f"   Documentos 2025-09-26 (datetime): {len(docs_2025_dt)}")
            if docs_2025_dt:
                tot = sum(float(d.get("monto_total_bs", 0)) for d in docs_2025_dt)
                print(f"   👉 TOTAL VENTAS 2025-09-26: Bs. {tot}")
                for d in docs_2025_dt[:5]:
                    print(f"      - {d.get('fecha_transaccion')} | {d.get('sucursal')} | {d.get('monto_total_bs')}")
                    
            # 2024-09-27
            dt24_1 = datetime(2024, 9, 27, 0, 0, 0)
            dt24_2 = datetime(2024, 9, 27, 23, 59, 59)
            docs_2024_dt = await col.find({"fecha_transaccion": {"$gte": dt24_1, "$lte": dt24_2}}).to_list(length=None)
            print(f"   Documentos 2024-09-27 (datetime): {len(docs_2024_dt)}")
            if docs_2024_dt:
                tot24 = sum(float(d.get("monto_total_bs", 0)) for d in docs_2024_dt)
                print(f"   👉 TOTAL VENTAS 2024-09-27: Bs. {tot24}")

            # Buscar dónde está 625.00 en esta colección
            cursor_625 = col.find({"monto_total_bs": {"$in": [625, 625.0, "625", "625.00"]}})
            list_625 = await cursor_625.to_list(length=5)
            print(f"\nDocumentos con monto 625 en 'ventas_historicas_crudas': {len(list_625)}")
            for l in list_625:
                print(f"   - Fecha: {l.get('fecha_transaccion')} | Sucursal: {l.get('sucursal')} | Monto: {l.get('monto_total_bs')}")

if __name__ == "__main__":
    asyncio.run(check_ventas_historicas())
