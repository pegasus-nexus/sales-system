import asyncio
import sys
import os
from datetime import date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def trace_sucursales():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    d0 = date(2026, 8, 11)

    # Probemos sucursal = None (Global/Todas)
    res_none = await get_hourly_multiyear(tenant_id, d0, None, None, sucursal=None)
    # Probemos sucursal = "" (Vacio/Todas)
    res_empty = await get_hourly_multiyear(tenant_id, d0, None, None, sucursal="")
    # Probemos sucursal = "Heroinas"
    res_hero = await get_hourly_multiyear(tenant_id, d0, None, None, sucursal="Heroinas")
    # Probemos sucursal = "Recoleta"
    res_reco = await get_hourly_multiyear(tenant_id, d0, None, None, sucursal="Recoleta")
    # Probemos sucursal = "Calacoto"
    res_cala = await get_hourly_multiyear(tenant_id, d0, None, None, sucursal="Calacoto")

    print("==========================================================================")
    print("AUDITORÍA DE RESULTADOS POR SUCURSAL PARA HOY 11/08/2026:")
    print("==========================================================================")
    
    print("\n1. SUCURSAL = None (Global):")
    print(f"   meta: {res_none.get('meta')}")
    print(f"   Suma horas: Bs. {sum(h['real'] for h in res_none.get('horas', [])):,.2f}")

    print("\n2. SUCURSAL = '' (Vacío):")
    print(f"   meta: {res_empty.get('meta')}")
    print(f"   Suma horas: Bs. {sum(h['real'] for h in res_empty.get('horas', [])):,.2f}")

    print("\n3. SUCURSAL = 'Heroinas':")
    print(f"   meta: {res_hero.get('meta')}")
    print(f"   Suma horas: Bs. {sum(h['real'] for h in res_hero.get('horas', [])):,.2f}")

    print("\n4. SUCURSAL = 'Recoleta':")
    print(f"   meta: {res_reco.get('meta')}")
    print(f"   Suma horas: Bs. {sum(h['real'] for h in res_reco.get('horas', [])):,.2f}")

    print("\n5. SUCURSAL = 'Calacoto':")
    print(f"   meta: {res_cala.get('meta')}")
    print(f"   Suma horas: Bs. {sum(h['real'] for h in res_cala.get('horas', [])):,.2f}")

    # Ahora auditemos qué sucursal_id tienen los 3 documentos de hoy en 'sales'
    sales_today = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": "2026-08-11T04:00:00Z", "$lt": "2026-08-12T04:00:00Z"}
    }).to_list(10)

    print("\n==========================================================================")
    print("CAMPOS DE SUCURSAL EN LOS DOCUMENTOS REALES DE HOY EN 'sales':")
    print("==========================================================================")
    for s in sales_today:
        print(f"ID: {s['_id']} | total: Bs. {s.get('total')} | sucursal_id: {s.get('sucursal_id')} (tipo {type(s.get('sucursal_id'))}) | sucursal: {s.get('sucursal')}")

if __name__ == '__main__':
    asyncio.run(trace_sucursales())
