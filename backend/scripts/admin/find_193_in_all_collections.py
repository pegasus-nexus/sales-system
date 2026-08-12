import asyncio
import sys
import os
from datetime import datetime, date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db

async def find_193_all():
    await init_db()
    db = await get_raw_db()
    
    print("==========================================================================")
    print("BUSQUEDA GLOBAL DE Bs. 193.00 EN TODAS LAS COLECCIONES:")
    print("==========================================================================")
    
    # 1. Buscar en ventas_historicas_crudas para 2026, 2025, 2024
    cursor_hist = db.ventas_historicas_crudas.find({"fecha_transaccion": {"$regex": "^2026-08-12|^2025-08-13|^2024-08-14"}})
    docs_hist = await cursor_hist.to_list(length=1000)
    print(f"Documentos en ventas_historicas_crudas para 12-Ago: {len(docs_hist)}")
    
    # 2. Buscar ventas por hora en sales agrupadas por sucursal para 2026-08-11 o 2026-08-12
    # ¿Tiene Heroinas, Recoleta o Calacoto Bs. 193.00?
    sucursales = await db.sucursales.find({}).to_list(100)
    for suc in sucursales:
        sid = str(suc["_id"])
        sname = suc.get("nombre")
        count_11 = await db.sales.count_documents({"sucursal_id": sid, "anulada": {"$ne": True}})
        print(f"Sucursal {sname} ({sid}): {count_11} ventas registradas")

    # 3. Probar endpoint /analytics/overview para 2026-08-12
    from app.services.analytics_service import get_dashboard_metrics
    try:
        ov = await get_dashboard_metrics("69cd7f0a8f3f6866d4cfbb62", date(2026, 8, 12), date(2026, 8, 12))
        print("\nRespuesta de get_dashboard_metrics (KPIs globales para HOY 12/08/2026):")
        print(f"  • Overview Venta Neta: Bs. {ov.get('overview', {}).get('venta_neta')}")
        print(f"  • Overview Transacciones: {ov.get('overview', {}).get('transacciones_count')}")
    except Exception as e:
        print(f"Error en overview: {e}")

if __name__ == '__main__':
    asyncio.run(find_193_all())
