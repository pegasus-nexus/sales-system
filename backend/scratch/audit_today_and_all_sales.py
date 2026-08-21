import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia, utc_to_bolivia

async def audit_day(date_str: str):
    db = await get_raw_db()
    start_utc, end_utc = get_day_range_bolivia(date_str)

    docs = await db.sales.find({
        "created_at": {"$gte": start_utc, "$lte": end_utc}
    }).to_list(1000)

    print(f"\n=======================================================")
    print(f"AUDITORIA COMPLETA DE VENTAS PARA: {date_str}")
    print(f"Total docs encontrados en db.sales: {len(docs)}")
    print("=======================================================")

    tenant_ids = set()
    estados = set()
    anuladas = set()

    for d in docs:
        t_id = d.get("tenant_id")
        tenant_ids.add((t_id, type(t_id).__name__))
        estados.add(d.get("estado"))
        anuladas.add(d.get("anulada"))

    print(f"Tipos de tenant_id presentes: {tenant_ids}")
    print(f"Valores del campo 'estado': {estados}")
    print(f"Valores del campo 'anulada': {anuladas}")

    # Imprimir resumen por sucursal
    by_suc = {}
    for d in docs:
        suc = d.get("sucursal_nombre") or str(d.get("sucursal_id"))
        monto = float(str(d.get("total", 0)))
        anul = bool(d.get("anulada", False)) or d.get("estado") == "anulado"
        
        if suc not in by_suc:
            by_suc[suc] = {"total": 0.0, "anulado": 0.0, "count": 0}
        
        if not anul:
            by_suc[suc]["total"] += monto
        else:
            by_suc[suc]["anulado"] += monto
        by_suc[suc]["count"] += 1

    for s, data in by_suc.items():
        print(f"  • Sucursal [{s}]: {data['count']} docs | Válidos: Bs. {data['total']:.2f} | Anulados: Bs. {data['anulado']:.2f}")

async def main():
    await init_db()
    await audit_day("2026-08-19")
    await audit_day("2026-08-20")
    await audit_day("2026-08-21") # HOY!

asyncio.run(main())
