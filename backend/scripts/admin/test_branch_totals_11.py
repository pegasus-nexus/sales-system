import asyncio
import sys
import os
from datetime import date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_branches():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    d11 = date(2026, 8, 11)
    
    print("==========================================================================")
    print("TOTALES POR SUCURSAL PARA EL DÍA 11/08/2026:")
    print("==========================================================================")
    
    for suc in [None, "Heroinas", "Recoleta", "Calacoto"]:
        res = await get_hourly_multiyear(tenant_id, d11, sucursal=suc)
        meta = res.get("meta", {})
        horas = res.get("horas", [])
        tot = meta.get("total_real", 0)
        docs = meta.get("docs_real", 0)
        pico = meta.get("hora_pico", "—")
        pico_val = meta.get("venta_pico_maxima", 0)
        print(f"  • Sucursal '{suc or 'Todas'}': Total Real = Bs. {tot:>8.2f} | Docs = {docs:>2} | Pico = {pico} (Bs. {pico_val:.2f})")
        if abs(tot - 193.00) < 5.0:
            print(f"    *** ENCONTRADO MATCH PARA ~Bs. 193.00 EN SUCURSAL '{suc}' ***")

if __name__ == '__main__':
    asyncio.run(test_branches())
