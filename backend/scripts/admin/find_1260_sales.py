import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from app.services.hourly_multiyear_service import get_hourly_multiyear
from datetime import date

async def find_1260():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    # Get sucursales list
    sucursales = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    print("==========================================================================")
    print("PROBANDO CADA SUCURSAL INDIVIDUAL EN EL BACKEND PARA 10-08-2026:")
    print("==========================================================================")
    d0 = date(2026, 8, 10)
    d1 = date(2025, 8, 11)
    d2 = date(2024, 8, 12)

    for s in sucursales:
        sid = str(s["_id"])
        sname = s.get("nombre")
        res = await get_hourly_multiyear(tenant_id, d0, d1, d2, sucursal=sid)
        meta = res.get("meta", {})
        print(f"Sucursal Name: '{sname}' | ID: '{sid}' -> Total Real: Bs. {meta.get('total_real'):>8,.2f} | Docs: {meta.get('docs_real'):>3} | Hora Pico: {meta.get('hora_pico')} ({meta.get('venta_pico_maxima')})")

    # Also test by name
    for s in sucursales:
        sname = s.get("nombre")
        res = await get_hourly_multiyear(tenant_id, d0, d1, d2, sucursal=sname)
        meta = res.get("meta", {})
        print(f"By Name: '{sname}' -> Total Real: Bs. {meta.get('total_real'):>8,.2f} | Docs: {meta.get('docs_real'):>3} | Hora Pico: {meta.get('hora_pico')} ({meta.get('venta_pico_maxima')})")

if __name__ == '__main__':
    asyncio.run(find_1260())
