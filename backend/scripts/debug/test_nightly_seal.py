import asyncio
import os
import sys

# Añadir el root dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.infrastructure.db import init_db
from app.jobs.nightly_seal import run_nightly_seal
from app.application.services.tenant_context import TenantContextCache
from app.application.services.daily_query_service import DailyQueryService
from app.domain.models.sucursal import Sucursal

async def main():
    print("Inicializando DB...")
    await init_db()
    
    # 1. Probar TenantContextCache
    print("\n--- Test TenantContextCache ---")
    tenant_id = "69cd7f0a8f3f6866d4cfbb62" # Un tenant de prueba usual
    sucs = await TenantContextCache.get_sucursal_map(tenant_id)
    print(f"Sucursales en cache: {sucs}")
    
    # 2. Probar DailyQueryService
    print("\n--- Test DailyQueryService ---")
    metrics = await DailyQueryService.get_aggregated_range(tenant_id, "2026-06-01", "2026-06-30")
    print(f"Ventas brutas junio: {metrics.ventas_brutas}")
    print(f"Top categorias: {len(metrics.top_categorias)}")
    
    # 3. Probar Nightly Seal (solo que imprima sin fallar)
    print("\n--- Test Nightly Seal ---")
    try:
        await run_nightly_seal()
        print("Nightly Seal se ejecutó sin crashes.")
    except Exception as e:
        print(f"Error en Nightly Seal: {e}")

if __name__ == "__main__":
    asyncio.run(main())
