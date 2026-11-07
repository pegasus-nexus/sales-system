import asyncio
from app.infrastructure.db import init_db
from app.domain.models.sucursal import Sucursal

async def main():
    await init_db()
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    sucs = await Sucursal.find({"tenant_id": tenant_id}).to_list()
    print(f"Sucursales en tenant {tenant_id}: {len(sucs)}")
    for s in sucs:
        print(f"  ID: {s.id} | Nombre: '{s.nombre}' | is_active: {s.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
