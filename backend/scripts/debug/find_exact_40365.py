import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.application.services.sales_read_service import safe_float, SalesReadService

async def search_40365():
    await init_db()
    db = await get_raw_db()
    
    # Buscar si existe alguna agregación o sucursal o combinación de ventas que sume 40365.64
    all_sales = await db.sales.find({"anulada": {"$ne": True}}).to_list(length=None)
    print(f"Total ventas registradas en BD: {len(all_sales)}")
    
    # Mapear por sucursal_id
    by_suc = {}
    for s in all_sales:
        suc = str(s.get("sucursal_id"))
        tot = safe_float(s.get("total", 0.0))
        by_suc[suc] = by_suc.get(suc, 0.0) + tot

    print("\nVentas acumuladas históricas por sucursal_id:")
    for suc_id, tot in by_suc.items():
        print(f"  - sucursal_id '{suc_id}': Bs. {tot:,.2f}")

    # Verificar si 40,365.64 aparece al filtrar por algún usuario o método de pago
    by_cajero = {}
    for s in all_sales:
        caj = str(s.get("usuario_id") or s.get("cajero_id") or "desconocido")
        tot = safe_float(s.get("total", 0.0))
        by_cajero[caj] = by_cajero.get(caj, 0.0) + tot

    print("\nVentas por usuario/cajero:")
    for caj, tot in by_cajero.items():
        print(f"  - cajero '{caj}': Bs. {tot:,.2f}")

if __name__ == "__main__":
    asyncio.run(search_40365())
