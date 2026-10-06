import asyncio
from app.infrastructure.db import init_db
from app.domain.models.product import Product
from app.domain.models.inventario import Inventario, InventoryLog
from collections import defaultdict

async def run_merge():
    await init_db()
    
    all_prods = await Product.find_all().to_list()
    active_prods = [p for p in all_prods if p.is_active]
    
    by_name = defaultdict(list)
    for p in active_prods:
        if p.descripcion:
            n = p.descripcion.lower().strip()
            by_name[n].append(p)
            
    dups = {k: v for k, v in by_name.items() if len(v) > 1}
    
    print(f"Starting merge for {len(dups)} groups of duplicates...")
    
    merged_count = 0
    inactivated_count = 0
    
    for name, prods in dups.items():
        print(f"\nProcesando grupo: {name.upper()}")
        
        # Rule 1: Has image
        with_image = [p for p in prods if getattr(p, "image_url", None) and str(p.image_url).strip() != ""]
        
        primary = None
        if len(with_image) == 1:
            primary = with_image[0]
        elif len(with_image) > 1:
            # Pick first
            primary = with_image[0] 
        else:
            primary = prods[0]
            
        secondaries = [p for p in prods if str(p.id) != str(primary.id)]
        
        print(f"  Primary: {primary.id} (Imagen: {bool(getattr(primary, 'image_url', None))})")
        
        # Merge Inventario
        for sec in secondaries:
            print(f"  Merging Secondary: {sec.id}")
            
            sec_invs = await Inventario.find(Inventario.producto_id == str(sec.id)).to_list()
            
            for si in sec_invs:
                prim_inv = await Inventario.find_one(
                    Inventario.producto_id == str(primary.id),
                    Inventario.sucursal_id == si.sucursal_id,
                    Inventario.almacen_id == si.almacen_id
                )
                
                if prim_inv:
                    prim_inv.cantidad += si.cantidad
                    if getattr(prim_inv, 'valor_total', None) is not None:
                        prim_inv.valor_total = prim_inv.cantidad * float(primary.costo_producto or 0)
                    await prim_inv.save()
                    await si.delete()
                else:
                    si.producto_id = str(primary.id)
                    await si.save()
            
            # Update Movimientos
            movs = await InventoryLog.find(InventoryLog.producto_id == str(sec.id)).to_list()
            for m in movs:
                m.producto_id = str(primary.id)
                await m.save()
                
            # Inactivate the secondary
            sec.is_active = False
            await sec.save()
            inactivated_count += 1
            
        merged_count += 1
        
    print(f"\n--- RESUMEN ---")
    print(f"Grupos procesados: {merged_count}")
    print(f"Productos secundarios inactivados: {inactivated_count}")
    print(f"¡Fusion completada con exito!")

if __name__ == "__main__":
    asyncio.run(run_merge())
