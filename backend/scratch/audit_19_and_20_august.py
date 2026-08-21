import asyncio
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia, utc_to_bolivia
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def audit_date(date_str: str):
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    start_utc, end_utc = get_day_range_bolivia(date_str)
    
    docs = await db.sales.find({
        "created_at": {"$gte": start_utc, "$lte": end_utc}
    }).sort("created_at", 1).to_list(1000)

    print(f"\n=======================================================")
    print(f"AUDITORIA PARA FECHA {date_str}")
    print(f"Total docs en db.sales: {len(docs)}")
    print("=======================================================")

    sucursales_doc = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    suc_map = {str(s["_id"]): s.get("nombre", "") for s in sucursales_doc}

    by_branch = {}
    valid_sum = 0.0
    anulado_sum = 0.0

    for d in docs:
        s_id = str(d.get("sucursal_id", ""))
        s_name = suc_map.get(s_id, d.get("sucursal_nombre", "Otros"))
        
        monto = float(str(d.get("total", 0)))
        anulado = bool(d.get("anulada", False)) or d.get("estado") == "anulado"
        
        if anulado:
            anulado_sum += monto
        else:
            valid_sum += monto

        dt_bol = utc_to_bolivia(d.get("created_at")) if d.get("created_at") else None
        h = dt_bol.hour if dt_bol else 0

        t_id = d.get("numero_ticket") or d.get("codigo_ticket") or str(d["_id"])[-6:].upper()

        if s_name not in by_branch:
            by_branch[s_name] = {"valid": 0.0, "anulado": 0.0, "count": 0, "first_h": dt_bol, "last_h": dt_bol}
        
        if not anulado:
            by_branch[s_name]["valid"] += monto
        else:
            by_branch[s_name]["anulado"] += monto
        by_branch[s_name]["count"] += 1
        by_branch[s_name]["last_h"] = dt_bol

    print(f"RESUMEN DE MONTOS PARA {date_str}:")
    print(f"  Válidos Globales:  Bs. {valid_sum:.2f}")
    print(f"  Anulados Globales: Bs. {anulado_sum:.2f}")
    print("\nDESGLOSE POR SUCURSAL:")
    for b_name, data in by_branch.items():
        print(f"  • {b_name}: {data['count']} docs | Válidos: Bs. {data['valid']:.2f} | Anulados: Bs. {data['anulado']:.2f} | Primera: {data['first_h'].strftime('%H:%M')} | Última: {data['last_h'].strftime('%H:%M')}")

    # Probando get_hourly_multiyear
    d_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    multi_all = await get_hourly_multiyear(tenant_id, d_obj, sucursal="all")
    meta_all = multi_all.get("meta", {})
    print(f"\nRespuesta servicio get_hourly_multiyear(sucursal='all'):")
    print(f"  Total 2026: Bs. {meta_all.get('total_real')}")
    print(f"  Total 2025: Bs. {meta_all.get('total_a1')}")
    print(f"  Total 2024: Bs. {meta_all.get('total_a2')}")

async def main():
    await init_db()
    await audit_date("2026-08-19")
    await audit_date("2026-08-20")

asyncio.run(main())
