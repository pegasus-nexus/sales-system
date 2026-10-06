import asyncio
from app.infrastructure.db import init_db
from app.domain.models.product import Product
from app.domain.models.inventario import Inventario
from app.domain.models.category import Category
from collections import defaultdict
import json

async def test():
    await init_db()
    
    all_prods = await Product.find_all().to_list()
    active_prods = [p for p in all_prods if p.is_active]
    
    # Map categories
    cats = await Category.find_all().to_list()
    cat_map = {str(c.id): c.name for c in cats}
    
    # 1. Group by Name
    by_name = defaultdict(list)
    for p in active_prods:
        if p.descripcion:
            n = p.descripcion.lower().strip()
            by_name[n].append(p)
            
    # 2. Group by Code
    by_code = defaultdict(list)
    for p in active_prods:
        if p.codigo_corto:
            c = p.codigo_corto.lower().strip()
            by_code[c].append(p)
            
    # Merge groups
    groups = [] # list of lists of products
    seen_ids = set()
    
    for n, prods in by_name.items():
        if len(prods) > 1:
            group = []
            for p in prods:
                if str(p.id) not in seen_ids:
                    group.append(p)
                    seen_ids.add(str(p.id))
            if len(group) > 1:
                groups.append({"type": "NAME", "key": n, "prods": group})
                
    for c, prods in by_code.items():
        if len(prods) > 1:
            group = []
            for p in prods:
                if str(p.id) not in seen_ids:
                    group.append(p)
                    seen_ids.add(str(p.id))
            if len(group) > 1:
                groups.append({"type": "CODE", "key": c, "prods": group})
                
    print(f"Total groups of duplicates: {len(groups)}")
    
    # For each group, get inventory
    report = []
    
    for g in groups:
        group_data = {
            "type": g["type"],
            "key": g["key"],
            "items": []
        }
        
        for p in g["prods"]:
            # Get inventory
            invs = await Inventario.find(Inventario.producto_id == str(p.id)).to_list()
            total_stock = sum(i.cantidad for i in invs)
            
            cat_name = cat_map.get(str(p.categoria_id), "Sin categoria") if p.categoria_id else "Sin categoria"
            
            group_data["items"].append({
                "id": str(p.id),
                "codigo": p.codigo_corto or "",
                "descripcion": p.descripcion,
                "categoria": cat_name,
                "proveedor": p.proveedores[0] if p.proveedores else "",
                "stock_total": total_stock,
                "inv_records": len(invs)
            })
            
        report.append(group_data)
        
    with open("duplicate_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        
    print("Report saved to duplicate_report.json")

asyncio.run(test())
