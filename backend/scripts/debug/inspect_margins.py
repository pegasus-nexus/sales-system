import asyncio
from datetime import datetime, timezone
from app.infrastructure.db import init_db
from app.domain.models.user import User
from app.domain.models.sale import Sale
from app.domain.models.product import Product
from app.api.v1.endpoints.reports import get_day_range_bolivia

async def run():
    await init_db()
    
    # 1. Find user taboada
    user = await User.find_one({"username": "admin.general.taboada@taboada.bo"})
    if not user:
        user = await User.find_one({"email": "admin.general.taboada@taboada.bo"})
    if not user:
        user = await User.find_one({"username": {"$regex": "taboada", "$options": "i"}})
    
    if not user:
        print("User not found!")
        return
        
    print(f"Found user: {user.username}, tenant_id: {user.tenant_id}")
    tenant_id = user.tenant_id
    
    # 2. Date range: 2026-10-09 to 2026-10-15
    start_dt, _ = get_day_range_bolivia("2026-10-09")
    _, end_dt = get_day_range_bolivia("2026-10-15")
    
    print(f"Range: {start_dt} to {end_dt}")
    
    # 3. Fetch sales
    sales = await Sale.find({
        "tenant_id": tenant_id,
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }).sort("+created_at").to_list()
    
    print(f"Total sales found: {len(sales)}")
    
    # Group by date
    by_date = {}
    for s in sales:
        d = s.created_at.strftime("%Y-%m-%d")
        if d not in by_date:
            by_date[d] = {"count": 0, "total_publico": 0.0, "total_fabrica": 0.0, "items": []}
        
        for it in s.items:
            qty = float(it.cantidad)
            precio = float(it.precio_unitario or 0)
            costo = float(it.costo_unitario or 0)
            pub = float(it.subtotal) if it.subtotal is not None else (precio * qty)
            cost = costo * qty
            
            by_date[d]["count"] += 1
            by_date[d]["total_publico"] += pub
            by_date[d]["total_fabrica"] += cost
            by_date[d]["items"].append({
                "prod_id": it.producto_id,
                "desc": it.descripcion,
                "qty": qty,
                "precio": precio,
                "costo": costo,
                "subtotal": pub,
                "total_costo": cost,
                "sale_id": str(s.id),
                "created_at": s.created_at.isoformat()
            })
            
    print("\n--- Daily Summary ---")
    tot_pub = 0.0
    tot_fab = 0.0
    for d, data in sorted(by_date.items()):
        pub = data["total_publico"]
        fab = data["total_fabrica"]
        tot_pub += pub
        tot_fab += fab
        comision_15 = fab * 0.15
        retail_margin = pub - (fab + comision_15)
        old_retail_margin = pub - fab
        print(f"Date: {d} | Items: {len(data['items']):3d} | Publico: Bs. {pub:9.2f} | Fabrica: Bs. {fab:9.2f} | 15%: Bs. {comision_15:8.2f} | Retail: Bs. {retail_margin:9.2f} (Old: {old_retail_margin:9.2f})")
        
        # Check anomalies
        anomalies = [it for it in data["items"] if (it["costo"] * 1.15) > it["precio"] or it["costo"] > it["precio"]]
        if anomalies:
            print(f"  >>> {len(anomalies)} items with negative retail margin on {d}:")
            # Sort by biggest absolute loss
            anomalies.sort(key=lambda x: (x["subtotal"] - (x["total_costo"] * 1.15)))
            for it in anomalies[:5]:
                loss = it["subtotal"] - (it["total_costo"] * 1.15)
                print(f"      Item: {it['desc']} | Qty: {it['qty']} | Precio: {it['precio']} | Costo: {it['costo']} | Subtot: {it['subtotal']:.2f} | Loss: {loss:.2f}")

    tot_15 = tot_fab * 0.15
    tot_retail = tot_pub - (tot_fab + tot_15)
    print(f"\nTOTAL: Publico: Bs. {tot_pub:.2f} | Fabrica: Bs. {tot_fab:.2f} | 15%: Bs. {tot_15:.2f} | Retail: Bs. {tot_retail:.2f}")

if __name__ == "__main__":
    asyncio.run(run())
