import asyncio
import motor.motor_asyncio
from datetime import datetime, timezone

async def sync_today():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority')
    db = client.sales_system_prod
    
    # Map sucursales
    suc_docs = await db.sucursales.find({}).to_list(100)
    suc_map = {str(s['_id']): s.get('nombre', 'Central') for s in suc_docs}
    suc_map['CENTRAL'] = 'Central'
    
    # Get sales created today (2026-07-21)
    start_today = datetime(2026, 7, 21, 0, 0, 0)
    sales = await db.sales.find({'created_at': {'$gte': start_today}, 'anulada': {'$ne': True}}).to_list(500)
    print(f"Found {len(sales)} sales in POS today ({start_today.date()})")
    
    inserted = 0
    for sale in sales:
        sale_id = sale['_id']
        # Check if already in BI
        existing = await db.ventas_historicas_crudas.find_one({'original_sale_id': sale_id})
        if not existing:
            suc_id = str(sale.get('sucursal_id', 'CENTRAL'))
            suc_name = suc_map.get(suc_id, 'Central')
            
            name_lower = suc_name.lower()
            if 'heroinas' in name_lower or 'heroína' in name_lower or 'hero' in name_lower:
                suc_mapped = 'Heroínas'
            elif 'recoleta' in name_lower:
                suc_mapped = 'Recoleta'
            elif 'calacoto' in name_lower:
                suc_mapped = 'Calacoto'
            else:
                suc_mapped = suc_name
                
            records = []
            for item in sale.get('items', []):
                cant = item.get('cantidad', 1)
                subt = item.get('subtotal', 0)
                records.append({
                    "fecha_transaccion": sale['created_at'],
                    "nombre_producto": str(item.get('descripcion', '')).upper().strip(),
                    "cantidad_vendida": float(str(cant)),
                    "sucursal": suc_mapped,
                    "monto_total_bs": float(str(subt)),
                    "tenant_id": sale.get('tenant_id', 'default'),
                    "original_sale_id": sale_id
                })
            if records:
                await db.ventas_historicas_crudas.insert_many(records)
                inserted += len(records)
                print(f"Synced sale {sale_id}: {len(records)} items ({suc_mapped})")
                
    print(f"DONE! Successfully synced {inserted} items from today's POS sales to BI collection!")

if __name__ == '__main__':
    asyncio.run(sync_today())
