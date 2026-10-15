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
    
    start_dt, _ = get_day_range_bolivia("2026-10-12")
    _, end_dt = get_day_range_bolivia("2026-10-13")
    
    sales = await Sale.find({
        "tenant_id": tenant_id,
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }).sort("+created_at").to_list()
    
    print(f"Total sales in Oct 12-13: {len(sales)}")
    
    suc_summary = {}
    for s in sales:
        suc_name = suc_map.get(s.sucursal_id, s.sucursal_id)
        if suc_name not in suc_summary:
            suc_summary[suc_name] = {"count": 0, "total": 0.0, "sales": []}
        suc_summary[suc_name]["count"] += 1
        suc_summary[suc_name]["total"] += float(s.total)
        suc_summary[suc_name]["sales"].append(s)
        
    for suc_name, data in suc_summary.items():
        print(f"\n==========================================")
        print(f"Sucursal: {suc_name} | Sales Count: {data['count']} | Total: Bs. {data['total']:.2f}")
        print(f"==========================================")
        for s in data["sales"][:4]:
            user_info = s.usuario_nombre if hasattr(s, 'usuario_nombre') else 'N/A'
            client_info = s.cliente.razon_social if s.cliente else 'Sin cliente'
            print(f"\n  Sale ID: {s.id} | Date: {s.created_at} | Total: {s.total} | User: {user_info} | Cliente: {client_info} | Pagos: {[p.metodo for p in s.pagos]}")
            for it in s.items[:4]:
                print(f"    Item: {it.descripcion} | Cant: {it.cantidad} | Precio: {it.precio_unitario} | Costo: {it.costo_unitario}")

if __name__ == "__main__":
    asyncio.run(run())
