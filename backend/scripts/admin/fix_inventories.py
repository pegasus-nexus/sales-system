import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import Inventario, InventoryLog
from app.domain.models.product import Product
from collections import defaultdict

async def main():
    await init_db()
    motor_inv = Inventario.get_motor_collection()
    motor_log = InventoryLog.get_motor_collection()
    
    prods = await Product.find_all().to_list()
    prod_map = {str(p.id): p for p in prods}
    
    tenant_name_map = {}
    for p in prods:
        if p.descripcion:
            key = (p.tenant_id, p.descripcion.lower().strip())
            if key not in tenant_name_map or p.is_active:
                tenant_name_map[key] = p
                
    invs = await Inventario.find_all().to_list()
    fixed_invs = 0
    for inv in invs:
        p = prod_map.get(inv.producto_id)
        if p and p.tenant_id != inv.tenant_id:
            key = (inv.tenant_id, p.descripcion.lower().strip())
            correct_p = tenant_name_map.get(key)
            if correct_p:
                await motor_inv.update_one({'_id': inv.id}, {'$set': {'producto_id': str(correct_p.id)}})
                if not correct_p.is_active:
                    correct_p.is_active = True
                    await correct_p.save()
                fixed_invs += 1

    logs = await InventoryLog.find_all().to_list()
    fixed_logs = 0
    for log in logs:
        p = prod_map.get(log.producto_id)
        if p and p.tenant_id != log.tenant_id:
            key = (log.tenant_id, p.descripcion.lower().strip())
            correct_p = tenant_name_map.get(key)
            if correct_p:
                await motor_log.update_one({'_id': log.id}, {'$set': {'producto_id': str(correct_p.id)}})
                fixed_logs += 1
                
    print(f'PHASE 1 COMPLETE: Re-mapped {fixed_invs} Inventarios and {fixed_logs} InventoryLogs to their correct Tenants.')

    # Phase 2: Deduplicate Intra-tenant Inventarios
    invs_after = await Inventario.find_all().to_list()
    grouped = defaultdict(list)
    for inv in invs_after:
        key = (inv.tenant_id, inv.sucursal_id, inv.almacen_id, inv.producto_id)
        grouped[key].append(inv)
        
    merged_count = 0
    for key, group in grouped.items():
        if len(group) > 1:
            group.sort(key=lambda x: x.created_at)
            primary = group[0]
            total_qty = sum(i.cantidad for i in group)
            
            await motor_inv.update_one({'_id': primary.id}, {'$set': {'cantidad': total_qty}})
            
            for dup in group[1:]:
                await motor_inv.delete_one({'_id': dup.id})
                
            merged_count += (len(group) - 1)
            
    print(f'PHASE 2 COMPLETE: Merged and deleted {merged_count} duplicate Inventario documents.')

if __name__ == '__main__':
    asyncio.run(main())
