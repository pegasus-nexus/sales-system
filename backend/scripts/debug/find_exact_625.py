import asyncio
from datetime import date, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

async def find_exact_625():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    db = c["salessystem"]
    
    # 1. Buscar en db.sales todas las combinaciones con anulada: {$ne: True}
    sales = await db.sales.find({"anulada": {"$ne": True}}).to_list(length=None)
    
    print(f"Total ventas no anuladas en db.sales: {len(sales)}")
    
    # Agrupar por fecha
    by_date = {}
    for s in sales:
        ca = s.get("created_at")
        dt_str = str(ca)[:10]
        tot = float(s.get("total", 0.0) or s.get("total_neto", 0.0))
        by_date[dt_str] = by_date.get(dt_str, 0.0) + tot
        
    print("\nFechas con sus totales (no anuladas):")
    for d, t in sorted(by_date.items()):
        if 620 <= t <= 630 or t == 625:
            print(f"  👉 FECHA: {d} -> Total: {t}")
        else:
            # Imprimir si tiene 625
            if "625" in str(t):
                print(f"  👉 FECHA: {d} -> Total: {t}")

    # 2. Revisar si en alguna sucursal específica da 625
    by_date_suc = {}
    for s in sales:
        ca = s.get("created_at")
        dt_str = str(ca)[:10]
        suc = str(s.get("sucursal_id", "CENTRAL"))
        tot = float(s.get("total", 0.0) or s.get("total_neto", 0.0))
        key = (dt_str, suc)
        by_date_suc[key] = by_date_suc.get(key, 0.0) + tot

    print("\nAgrupación por fecha y sucursal:")
    for (d, suc), t in sorted(by_date_suc.items()):
        if 620 <= t <= 630 or t == 625:
            print(f"  👉 FECHA: {d} | Sucursal: {suc} -> Total: {t}")

    # 3. ¿Hay alguna otra base de datos en Mongo?
    all_dbs = await c.list_database_names()
    print(f"\nTodas las bases de datos en Mongo: {all_dbs}")
    for db_name in all_dbs:
        cols = await c[db_name].list_collection_names()
        for col_name in cols:
            cursor = c[db_name][col_name].find({"$or": [{"total": 625}, {"total": 625.0}, {"total_neto": 625}, {"monto_total_bs": 625}, {"monto_total_bs": "625"}]})
            matches = await cursor.to_list(length=5)
            if matches:
                print(f"  🎯 ENCONTRADO 625 en DB '{db_name}', colección '{col_name}': {len(matches)} docs")
                for m in matches:
                    print(f"     Doc: {m}")

if __name__ == "__main__":
    asyncio.run(find_exact_625())
