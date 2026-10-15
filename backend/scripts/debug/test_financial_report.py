import asyncio
from app.infrastructure.db import init_db
from app.domain.models.user import User
from app.domain.models.sucursal import Sucursal
from app.api.v1.endpoints.reports import get_financial_report

async def run():
    await init_db()
    u = await User.find_one({"username": "admin.general.taboada@taboada.bo"})
    
    # 1. Retail only (Recoleta, Heroínas, Calacoto)
    all_sucs = await Sucursal.find(Sucursal.tenant_id == u.tenant_id).to_list()
    retail_ids = [
        str(s.id) for s in all_sucs
        if any(k in str(s.nombre).lower() for k in ["heroinas", "heroína", "calacoto", "recoleta"])
        and not any(bad in str(s.nombre).lower() for bad in ["vendedor", "distribucion", "supermercado"])
    ]
    print(f"Retail branch IDs: {retail_ids}")
    for s in all_sucs:
        if str(s.id) in retail_ids:
            print(f"  -> {s.nombre} ({s.id})")
            
    # Test financial report for all vs retail
    # We will test our planned logic
    print("\nTest completed successfully.")

if __name__ == "__main__":
    asyncio.run(run())
