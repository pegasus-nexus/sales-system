import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.domain.models.caja import CajaSesion, CajaMovimiento, SubtipoMovimiento
from app.infrastructure.core.config import settings

async def check_caja():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[CajaSesion, CajaMovimiento])
    
    # May 19, 2026
    start = datetime(2026, 5, 19)
    end = datetime(2026, 5, 20)
    
    sesiones = await CajaSesion.find(
        CajaSesion.abierta_at >= start,
        CajaSesion.abierta_at < end
    ).to_list()
    
    for s in sesiones:
        if "heroinas" in s.sucursal_id.lower() or "hero" in s.sucursal_id.lower() or "suc" in s.sucursal_id.lower() or s.sucursal_id == "673cf9704285b7fc62eec4c2": # I will just print all to be safe
            print(f"Sucursal: {s.sucursal_id}, Cajero: {s.cajero_name}, ID: {s.id}")
            movs = await CajaMovimiento.find(CajaMovimiento.sesion_id == str(s.id)).to_list()
            ef = sum(float(m.monto) for m in movs if m.subtipo == SubtipoMovimiento.VENTA_EFECTIVO)
            ef_ing = sum(float(m.monto) for m in movs if m.subtipo == SubtipoMovimiento.INGRESO_EFECTIVO)
            cc = sum(float(m.monto) for m in movs if m.subtipo == SubtipoMovimiento.CAMBIO)
            
            print(f"  Ventas EF (ef): {ef}")
            print(f"  Ingresos EF (ef_ing): {ef_ing}")
            print(f"  Cambio (cc): {cc}")
            print(f"  PDF Efectivo Neto (ef + ef_ing - cc): {ef + ef_ing - cc}")
            print(f"  Reporte Efectivo Neto (ef - cc): {ef - cc}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(check_caja())
