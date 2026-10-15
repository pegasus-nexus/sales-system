import asyncio
from app.infrastructure.db import init_db
from app.domain.models.user import User
from app.domain.models.sale import Sale
from app.domain.models.sucursal import Sucursal
from app.api.v1.endpoints.reports import get_day_range_bolivia

async def run():
    await init_db()
    
    user = await User.find_one({"username": "admin.general.taboada@taboada.bo"})
    tenant_id = user.tenant_id
    
    sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
    suc_map = {str(s.id): s.nombre for s in sucursales}
    
    start_dt, _ = get_day_range_bolivia("2026-10-09")
    _, end_dt = get_day_range_bolivia("2026-10-15")
    
    sales = await Sale.find({
        "tenant_id": tenant_id,
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }).to_list()
    
    by_suc = {}
    for s in sales:
        suc_name = suc_map.get(s.sucursal_id, "Desconocida")
        if suc_name not in by_suc:
            by_suc[suc_name] = {"pub": 0.0, "fab": 0.0, "count": 0}
            
        by_suc[suc_name]["count"] += 1
        for it in s.items:
            qty = float(it.cantidad)
            precio = float(it.precio_unitario or 0)
            costo = float(it.costo_unitario or 0)
            pub = float(it.subtotal) if it.subtotal is not None else (precio * qty)
            cost = costo * qty
            by_suc[suc_name]["pub"] += pub
            by_suc[suc_name]["fab"] += cost

    print("\n--- Desglose por Sucursal (10/09/2026 - 10/15/2026) ---")
    for suc_name, d in sorted(by_suc.items(), key=lambda x: x[1]['pub'], reverse=True):
        pub = d["pub"]
        fab = d["fab"]
        c15 = fab * 0.15
        retail = pub - (fab + c15)
        old_retail = pub - fab
        pct_retail = (retail / pub * 100) if pub > 0 else 0
        print(f"{suc_name:25s} | Ventas: Bs. {pub:10.2f} | Fabrica: Bs. {fab:10.2f} | 15%: Bs. {c15:8.2f} | Margen Retail: Bs. {retail:10.2f} ({pct_retail:6.1f}%) | Margen s/15%: Bs. {old_retail:9.2f}")

if __name__ == "__main__":
    asyncio.run(run())
