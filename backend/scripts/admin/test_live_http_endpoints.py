import asyncio
import sys
import os
import httpx

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear
from app.infrastructure.auth import create_access_token
from datetime import date

async def run_live_http_test():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    d_test = date(2026, 8, 12)
    
    print("==========================================================================")
    print("AUDITORÍA DE RESPUESTA DE SERVICE VS HTTP API PARA HOY 12/08/2026:")
    print("==========================================================================")
    
    # 1. Petición directa al Python Service
    res_svc = await get_hourly_multiyear(tenant_id, d_test, sucursal=None)
    meta_svc = res_svc.get("meta", {})
    horas_svc = res_svc.get("horas", [])
    
    print("\n1. RESPUESTA DIRECTA DEL SERVICE PYTHON (backend):")
    print(f"   • meta.total_real: Bs. {meta_svc.get('total_real')}")
    print(f"   • meta.docs_real:  {meta_svc.get('docs_real')}")
    print(f"   • meta.primer_ticket: {meta_svc.get('primer_ticket_info')}")
    print("   • Desglose de horas:")
    for h in horas_svc:
        print(f"       Hora {h['hora']} -> real: Bs. {h['real']:>7.2f} | anio1: Bs. {h['anio1']:>7.2f}")
        
    # 2. Petición simulada de cliente FastAPI local en memoria
    from app.main import app
    from httpx import ASGITransport, AsyncClient
    
    token = create_access_token(data={"sub": "sara.lazarte.ramirez"})
    headers = {"Authorization": f"Bearer {token}"}
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get(f"/api/v1/analytics/hourly-multiyear?fecha_referencia=2026-08-12", headers=headers)
        print(f"\n2. RESPUESTA HTTP DESDE API FASTAPI (/api/v1/analytics/hourly-multiyear):")
        print(f"   • Status Code: {resp.status_code}")
        if resp.status_code == 200:
            json_data = resp.json()
            meta_api = json_data.get("meta", {})
            horas_api = json_data.get("horas", [])
            print(f"   • JSON meta.total_real: Bs. {meta_api.get('total_real')}")
            print(f"   • JSON meta.docs_real:  {meta_api.get('docs_real')}")
            print("   • JSON Desglose de horas devuelto en HTTP Body:")
            for h in horas_api:
                print(f"       Hora {h['hora']} -> real: Bs. {h['real']:>7.2f} | anio1: Bs. {h['anio1']:>7.2f}")

if __name__ == '__main__':
    asyncio.run(run_live_http_test())
