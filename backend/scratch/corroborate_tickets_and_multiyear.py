import asyncio
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia

async def run_corroboration():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    print("==========================================================================")
    print("1. VERIFICACION DE VENTAS DE AYER (20/08/2026) EN MONGODB")
    print("==========================================================================")

    start_utc, end_utc = get_day_range_bolivia("2026-08-20")

    match_20aug = {
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lte": end_utc}
    }

    sales_20aug = await db.sales.find(match_20aug).sort("created_at", -1).to_list(length=1000)

    sucursales_doc = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    suc_map = {str(s["_id"]): s.get("nombre", "") for s in sucursales_doc}

    print(f"Total documentos en MongoDB para 20/08/2026: {len(sales_20aug)}\n")

    by_branch = {"Heroinas": [], "Recoleta": [], "Calacoto": [], "Otros": []}
    
    total_valido_global = 0.0
    total_anulado_global = 0.0

    for s in sales_20aug:
        s_id = str(s.get("sucursal_id", ""))
        suc_name = suc_map.get(s_id, s.get("sucursal_nombre", "Otros"))
        
        b_key = "Otros"
        if "hero" in suc_name.lower(): b_key = "Heroinas"
        elif "recoleta" in suc_name.lower(): b_key = "Recoleta"
        elif "calacoto" in suc_name.lower(): b_key = "Calacoto"

        monto = float(str(s.get("total", 0.0)))
        anulado = bool(s.get("anulada", False)) or s.get("estado") == "anulado"
        
        if anulado:
            total_anulado_global += monto
        else:
            total_valido_global += monto

        ticket_code = s.get("numero_ticket") or s.get("codigo_ticket") or str(s.get("_id"))[-6:].upper()

        by_branch[b_key].append({
            "id": str(s.get("_id")),
            "numero_ticket": ticket_code,
            "hora": s.get("created_at"),
            "monto": monto,
            "anulado": anulado,
            "cajero": s.get("cajero_nombre") or s.get("usuario_nombre") or "N/A"
        })

    for branch, items in by_branch.items():
        if not items: continue
        validos = [i for i in items if not i["anulado"]]
        anulados = [i for i in items if i["anulado"]]
        sum_validos = sum(i["monto"] for i in validos)
        sum_anulados = sum(i["monto"] for i in anulados)
        print(f"SUCURSAL: {branch}")
        print(f"  Total Docs: {len(items)} | Validos: {len(validos)} (Bs. {sum_validos:.2f}) | Anulados: {len(anulados)} (Bs. {sum_anulados:.2f})")
        for i in items:
            status_str = "ANULADO" if i["anulado"] else "VALIDO"
            print(f"      - Ticket #{i['numero_ticket']} | {i['monto']:>6.2f} Bs | {status_str:<7} | Cajero: {i['cajero']}")
        print()

    print(f"RESUMEN GLOBAL 20/08/2026:")
    print(f"  Ventas Validas:  Bs. {total_valido_global:.2f}")
    print(f"  Ventas Anuladas: Bs. {total_anulado_global:.2f}")

    print("\n==========================================================================")
    print("2. COMPARATIVA HORARIA MULTI-ANO (HEROINAS): Vie 21-Ago-2026 vs Vie 22-Ago-2025 vs Vie 23-Ago-2024")
    print("==========================================================================")

    from app.services.hourly_multiyear_service import get_hourly_multiyear
    res_multi = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=date(2026, 8, 21),
        fecha_anio1=date(2025, 8, 22),
        fecha_anio2=date(2024, 8, 23),
        sucursal="Heroinas"
    )

    meta = res_multi.get("meta", {})
    horas = res_multi.get("horas", [])

    print(f"Meta Multi-Ano Heroinas:")
    print(f"  • Total Actual (21/08/2026): Bs. {meta.get('total_real', 0.0):.2f}")
    print(f"  • Total Ano 1 (22/08/2025):  Bs. {meta.get('total_a1', 0.0):.2f}")
    print(f"  • Total Ano 2 (23/08/2024):  Bs. {meta.get('total_a2', 0.0):.2f}")
    print(f"  • Hora Pico Actual:          {meta.get('hora_pico')} (Bs. {meta.get('venta_pico_maxima', 0.0):.2f})")
    print("\nDesglose por horas:")
    print(f"{'Hora':<8} | {'Vie 21-Ago-2026':<16} | {'Vie 22-Ago-2025':<16} | {'Vie 23-Ago-2024':<16}")
    print("-" * 65)
    for h in horas:
        print(f"{h['hora']:<8} | Bs. {h['real']:>11.2f} | Bs. {h['anio1']:>11.2f} | Bs. {h['anio2']:>11.2f}")

asyncio.run(run_corroboration())
