# -*- coding: utf-8 -*-
"""
Script de Auditoria: Comparativa Horaria Multi-Anio
Verifica que SUM(horas_grafico) == Total_POS para multiples fechas y sucursales.

Uso: python scripts/debug/verify_hourly_data.py
"""
import asyncio
import sys
from datetime import date, datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Fix encoding para consola Windows
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"
TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

FECHAS_AUDITORIA = [
    date(2024, 8, 1),
    date(2025, 8, 1),
    date(2024, 1, 15),
    date(2024, 6, 30),
    date(2025, 3, 19),
    date(2025, 11, 2),
    date(2025, 12, 25),
]


def build_match(tenant_id: str, f_date: date, sucursal: str = None) -> dict:
    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)
    match: dict = {
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
    }
    if sucursal:
        if "hero" in sucursal.lower():
            match["sucursal"] = {"$regex": "Hero.*nas", "$options": "i"}
        else:
            match["sucursal"] = {"$regex": f"^{sucursal}$", "$options": "i"}
    else:
        match["sucursal"] = {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}
    return match


async def inspect_structure(db, tenant_id: str):
    """Inspecciona la estructura real de ventas_historicas_crudas."""
    print("\n" + "=" * 70)
    print("INSPECCION: ventas_historicas_crudas")
    print("=" * 70)

    sample = await db.ventas_historicas_crudas.find(
        {"tenant_id": tenant_id}
    ).limit(5).to_list(5)

    if not sample:
        print("  [!] SIN DOCUMENTOS para este tenant")
        return

    doc = sample[0]
    print("  Campos del primer documento:")
    for k, v in doc.items():
        if k != "_id":
            print(f"    {k}: {repr(v)[:90]}")

    has_original = any("original_sale_id" in d for d in sample)
    print(f"\n  tiene original_sale_id: {'SI' if has_original else 'NO'}")

    # Determinar si monto_total_bs es por linea o por ticket
    # Si la suma de todos los montos de una fecha supera mucho el total esperado, es por linea
    total_docs_muestra = await db.ventas_historicas_crudas.count_documents(
        {"tenant_id": tenant_id,
         "fecha_transaccion": {"$gte": datetime(2025, 8, 1), "$lte": datetime(2025, 8, 1, 23, 59, 59)},
         "sucursal": {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"},
         "estado": {"$ne": "anulado"}}
    )
    print(f"\n  Documentos del 2025-08-01 (global): {total_docs_muestra}")
    print("  (Si >> num_tickets esperados, la estructura es POR LINEA DE PRODUCTO)")
    print()

    # Mostrar 5 filas de esa fecha para entender estructura
    sample_aug = await db.ventas_historicas_crudas.find(
        {"tenant_id": tenant_id,
         "fecha_transaccion": {"$gte": datetime(2025, 8, 1), "$lte": datetime(2025, 8, 1, 23, 59, 59)},
         "sucursal": {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"},
         "estado": {"$ne": "anulado"}}
    ).limit(5).to_list(5)

    print("  Muestra de 5 documentos del 2025-08-01:")
    for i, d in enumerate(sample_aug):
        print(f"    [{i}] sucursal={d.get('sucursal')} | monto_total_bs={d.get('monto_total_bs')} "
              f"| original_sale_id={d.get('original_sale_id', 'N/A')} "
              f"| nombre_producto={d.get('nombre_producto', 'N/A')}")


async def daily_total_suma_directa(db, tenant_id: str, f_date: date, sucursal: str = None) -> float:
    """Suma DIRECTA de monto_total_bs (sin deduplicar) = suma de todas las lineas."""
    match = build_match(tenant_id, f_date, sucursal)
    pipeline = [
        {"$match": match},
        {"$group": {"_id": None, "total": {"$sum": {"$toDouble": "$monto_total_bs"}}}}
    ]
    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(1)
    return round(float(res[0]["total"]), 2) if res else 0.0


async def daily_total_deduplicado(db, tenant_id: str, f_date: date, sucursal: str = None) -> float:
    """Deduplicar por original_sale_id -> $first de monto_total_bs -> suma."""
    match = build_match(tenant_id, f_date, sucursal)
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": {"$ifNull": ["$original_sale_id", "$_id"]},
            "monto": {"$first": {"$toDouble": "$monto_total_bs"}}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$monto"}}}
    ]
    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(1)
    return round(float(res[0]["total"]), 2) if res else 0.0


async def hourly_breakdown_deduplicado(db, tenant_id: str, f_date: date, sucursal: str = None) -> dict:
    """Desglose horario con deduplicacion por ticket."""
    match = build_match(tenant_id, f_date, sucursal)
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": {"$ifNull": ["$original_sale_id", "$_id"]},
            "fecha_raw": {"$first": "$fecha_transaccion"},
            "monto": {"$first": {"$toDouble": "$monto_total_bs"}}
        }},
        {"$project": {
            "monto": 1,
            "fecha_conv": {"$convert": {"input": "$fecha_raw", "to": "date", "onError": None, "onNull": None}}
        }},
        {"$match": {"fecha_conv": {"$ne": None}}},
        {"$project": {
            "monto": 1,
            "hora": {"$hour": {"date": "$fecha_conv", "timezone": "America/La_Paz"}}
        }},
        {"$group": {"_id": "$hora", "total": {"$sum": "$monto"}}},
        {"$sort": {"_id": 1}}
    ]
    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    return {f"{r['_id']:02d}:00": round(float(r["total"]), 2) for r in res if r["_id"] is not None}


async def hourly_breakdown_suma_directa(db, tenant_id: str, f_date: date, sucursal: str = None) -> dict:
    """Desglose horario con SUMA DIRECTA (sin deduplicar)."""
    match = build_match(tenant_id, f_date, sucursal)
    pipeline = [
        {"$match": match},
        {"$project": {
            "monto": {"$toDouble": "$monto_total_bs"},
            "fecha_conv": {"$convert": {"input": "$fecha_transaccion", "to": "date", "onError": None, "onNull": None}}
        }},
        {"$match": {"fecha_conv": {"$ne": None}}},
        {"$project": {
            "monto": 1,
            "hora": {"$hour": {"date": "$fecha_conv", "timezone": "America/La_Paz"}}
        }},
        {"$group": {"_id": "$hora", "total": {"$sum": "$monto"}}},
        {"$sort": {"_id": 1}}
    ]
    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    return {f"{r['_id']:02d}:00": round(float(r["total"]), 2) for r in res if r["_id"] is not None}


async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    await inspect_structure(db, TENANT_ID)

    # Comparar ambos metodos para detectar duplicados
    print("\n" + "=" * 70)
    print("COMPARATIVA: Suma directa vs Deduplicado por ticket")
    print("(Si son iguales -> estructura por ticket. Si directa >> deduplicado -> por linea)")
    print("=" * 70)
    for f_date in FECHAS_AUDITORIA:
        ta = await daily_total_suma_directa(db, TENANT_ID, f_date)
        tb = await daily_total_deduplicado(db, TENANT_ID, f_date)
        if ta == 0 and tb == 0:
            status = "(sin datos)"
        elif abs(ta - tb) < 0.02:
            status = "IGUALES"
        else:
            ratio = ta / tb if tb > 0 else 0
            status = f"DIFIEREN  ratio={ratio:.2f}x  delta={abs(ta-tb):.2f} Bs"
        print(f"  [{f_date}]  Directa={ta:>10.2f}  Dedup={tb:>10.2f}  -> {status}")

    # Auditoria por sucursal para 01/08/2024 y 01/08/2025
    print("\n" + "=" * 70)
    print("AUDITORIA POR SUCURSAL (suma directa)")
    print("=" * 70)
    for f_date in [date(2024, 8, 1), date(2025, 8, 1)]:
        print(f"\n  {f_date}:")
        suma = 0.0
        for suc in ["Heroinas", "Recoleta", "Calacoto"]:
            t = await daily_total_suma_directa(db, TENANT_ID, f_date, suc)
            suma += t
            print(f"    {suc:<12} -> {t:>10.2f} Bs")
        total_g = await daily_total_suma_directa(db, TENANT_ID, f_date)
        diff = abs(suma - total_g)
        ok = "OK" if diff < 0.02 else f"DIFF {diff:.2f}"
        print(f"    SUMA SUCURS -> {suma:>10.2f} Bs")
        print(f"    GLOBAL     -> {total_g:>10.2f} Bs  [{ok}]")

    # Auditoria horaria detallada
    for f_date in [date(2024, 8, 1), date(2025, 8, 1)]:
        print("\n" + "=" * 70)
        print(f"AUDITORIA HORARIA: {f_date} — GLOBAL")
        print("=" * 70)

        bkdn_directa = await hourly_breakdown_suma_directa(db, TENANT_ID, f_date)
        bkdn_dedup = await hourly_breakdown_deduplicado(db, TENANT_ID, f_date)
        total_directa = await daily_total_suma_directa(db, TENANT_ID, f_date)
        suma_horas_directa = round(sum(bkdn_directa.values()), 2)
        suma_horas_dedup = round(sum(bkdn_dedup.values()), 2)

        print(f"  Total POS (suma directa):          {total_directa:>10.2f} Bs")
        print(f"  Suma horas (directa):              {suma_horas_directa:>10.2f} Bs  -> {'PASS' if abs(suma_horas_directa - total_directa) < 0.02 else 'FAIL'}")
        print(f"  Suma horas (deduplicado ticket):   {suma_horas_dedup:>10.2f} Bs")

        all_hours = sorted(set(list(bkdn_directa.keys()) + list(bkdn_dedup.keys())))
        if all_hours:
            max_val = max([bkdn_directa.get(h, 0) for h in all_hours] + [0.01])
            print(f"\n  {'Hora':<6} {'Directa':>10}  {'Dedup':>10}")
            print(f"  {'-'*30}")
            for h in all_hours:
                vd = bkdn_directa.get(h, 0.0)
                vb = bkdn_dedup.get(h, 0.0)
                bar = "=" * int(vd / max_val * 25)
                print(f"  {h:<6} {vd:>10.2f}  {vb:>10.2f}  {bar}")
        else:
            print("  (sin datos para esta fecha)")

    client.close()
    print("\nAuditoria completada.")


if __name__ == "__main__":
    asyncio.run(run())
