# -*- coding: utf-8 -*-
"""
Test timezone: verificar si fecha_transaccion en ventas_historicas_crudas
esta en UTC o en hora local de Bolivia.

Uso: python -X utf8 scripts/debug/test_timezone_exact.py
"""
import asyncio
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["sales_system_prod"]

    start = datetime(2025, 8, 1, 0, 0, 0)
    end   = datetime(2025, 8, 1, 23, 59, 59)

    # === 1. Ver los documentos raw ===
    docs = await db.ventas_historicas_crudas.find({
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "sucursal": {"$regex": "Hero.*nas", "$options": "i"},
        "estado": {"$ne": "anulado"},
        "monto_total_bs": {"$gt": 0}
    }).sort("fecha_transaccion", 1).limit(10).to_list(10)

    print("=" * 60)
    print("PRIMEROS 10 DOCS Heroinas 01/08/2025 con monto>0")
    print("=" * 60)
    for d in docs:
        ft = d.get("fecha_transaccion")
        print(f"  fecha_raw: {ft!r}")
        print(f"  tzinfo:    {getattr(ft, 'tzinfo', 'N/A')}")
        print(f"  monto:     {d.get('monto_total_bs')}")
        print()

    # === 2. Comparar hora sin TZ vs con TZ via pipeline ===
    pipeline = [
        {"$match": {
            "tenant_id": TENANT_ID,
            "fecha_transaccion": {"$gte": start, "$lte": end},
            "sucursal": {"$regex": "Hero.*nas", "$options": "i"},
            "estado": {"$ne": "anulado"},
            "monto_total_bs": {"$gt": 0}
        }},
        {"$limit": 10},
        {"$project": {
            "fecha": "$fecha_transaccion",
            "monto": "$monto_total_bs",
            "hora_sin_tz": {"$hour": "$fecha_transaccion"},
            "hora_con_tz": {
                "$hour": {
                    "date": "$fecha_transaccion",
                    "timezone": "America/La_Paz"
                }
            },
        }},
        {"$sort": {"fecha": 1}}
    ]
    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(10)

    print("=" * 70)
    print("HORA SIN TZ vs CON TZ (America/La_Paz)")
    print("(Si hora_SIN_TZ = hora Bolivia -> datos son local naive)")
    print("(Si hora_CON_TZ = hora Bolivia -> datos son UTC)")
    print("=" * 70)
    print(f"  {'Fecha BD':<25}  {'hora_SIN_TZ':>12}  {'hora_CON_TZ':>12}  {'monto':>8}")
    print(f"  {'-'*65}")
    for r in res:
        fecha_str = str(r["fecha"])[:19]
        print(f"  {fecha_str:<25}  {r['hora_sin_tz']:>12}  {r['hora_con_tz']:>12}  {r['monto']:>8}")

    print()
    print("INTERPRETACION:")
    print("  Si hora_sin_tz coincide con la hora real de operacion (ej. 8am-8pm)")
    print("  entonces los datos son LOCAL NAIVE -> usar $hour sin timezone")
    print()
    print("  Si hora_con_tz coincide con la hora real de operacion")
    print("  entonces los datos son UTC -> usar $hour con timezone='America/La_Paz'")

    # === 3. Total con ambos metodos para confirmar que el total es el mismo ===
    pipeline_sin = [
        {"$match": {
            "tenant_id": TENANT_ID,
            "fecha_transaccion": {"$gte": start, "$lte": end},
            "sucursal": {"$regex": "Hero.*nas", "$options": "i"},
            "estado": {"$ne": "anulado"},
        }},
        {"$project": {"monto": {"$toDouble": "$monto_total_bs"}}},
        {"$match": {"monto": {"$gt": 0}}},
        {"$project": {"monto": 1, "hora": {"$hour": "$fecha_transaccion"}}},
        {"$group": {"_id": "$hora", "total": {"$sum": "$monto"}}},
        {"$sort": {"_id": 1}},
    ]
    pipeline_con = [
        {"$match": {
            "tenant_id": TENANT_ID,
            "fecha_transaccion": {"$gte": start, "$lte": end},
            "sucursal": {"$regex": "Hero.*nas", "$options": "i"},
            "estado": {"$ne": "anulado"},
        }},
        {"$project": {"monto": {"$toDouble": "$monto_total_bs"}}},
        {"$match": {"monto": {"$gt": 0}}},
        {"$project": {"monto": 1, "hora": {"$hour": {"date": "$fecha_transaccion", "timezone": "America/La_Paz"}}}},
        {"$group": {"_id": "$hora", "total": {"$sum": "$monto"}}},
        {"$sort": {"_id": 1}},
    ]

    res_sin = await db.ventas_historicas_crudas.aggregate(pipeline_sin).to_list(100)
    res_con = await db.ventas_historicas_crudas.aggregate(pipeline_con).to_list(100)

    map_sin = {r["_id"]: round(float(r["total"]), 2) for r in res_sin}
    map_con = {r["_id"]: round(float(r["total"]), 2) for r in res_con}

    print("=" * 60)
    print("DESGLOSE HORARIO: SIN timezone vs CON timezone")
    print("=" * 60)
    print(f"  {'Hora (sin TZ)':>14}  {'Total':>10}  |  {'Hora (con TZ)':>14}  {'Total':>10}")
    print(f"  {'-'*55}")
    all_hours = sorted(set(map_sin) | set(map_con))
    for h in all_hours:
        v_sin = map_sin.get(h, 0.0)
        v_con = map_con.get(h, 0.0)
        print(f"  {h:02d}:00          {v_sin:>10.2f}  |  {h:02d}:00          {v_con:>10.2f}")

    total_sin = sum(map_sin.values())
    total_con = sum(map_con.values())
    print(f"\n  TOTAL SIN TZ: {total_sin:.2f}  |  TOTAL CON TZ: {total_con:.2f}")

    client.close()

if __name__ == "__main__":
    asyncio.run(run())
