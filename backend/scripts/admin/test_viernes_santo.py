import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_exact_http():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # Probar con las fechas exactas de Viernes Santo en SpecialDatesChart:
    # actual: 2026-04-03, past1: 2025-04-18, past2: 2024-03-29
    res = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=date(2026, 4, 3),
        fecha_anio1=date(2025, 4, 18),
        fecha_anio2=date(2024, 3, 29),
        sucursal=None
    )
    
    meta = res.get("meta", {})
    print("=== RESPUESTA BACKEND PARA VIERNES SANTO ===")
    print(f"2026-04-03 (Actual): Bs. {meta.get('total_real'):,.2f}")
    print(f"2025-04-18 (Hace 1 año): Bs. {meta.get('total_a1'):,.2f}")
    print(f"2024-03-29 (Hace 2 años): Bs. {meta.get('total_a2'):,.2f}")
    print(f"Total Horas con Venta 2026: {sum(1 for h in res.get('horas', []) if h['real'] > 0)}")

if __name__ == '__main__':
    asyncio.run(test_exact_http())
