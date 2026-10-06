import os

path = 'backend/app/api/v1/endpoints/reports.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''    # Get categories to map IDs to names
    categories = await CajaGastoCategoria.find(CajaGastoCategoria.tenant_id == tenant_id).to_list()
    cat_map = {str(c.id): c.nombre for c in categories}
    
    # Format response
    total_monto = _ZERO
    detalle = []
    
    for m in movimientos:
        total_monto += m.monto
        detalle.append({
            "id": str(m.id),
            "fecha": m.fecha.isoformat(),
            "hora": m.fecha.strftime("%H:%M"),
            "monto": float(m.monto),
            "descripcion": m.descripcion,
            "categoria": cat_map.get(m.categoria_id, "Sin Categoría"),
            "cajero": m.cajero_name,
            "sucursal_id": m.sucursal_id
        })'''

replacement = '''    # Get categories to map IDs to names
    categories = await CajaGastoCategoria.find(CajaGastoCategoria.tenant_id == tenant_id).to_list()
    cat_map = {str(c.id): c for c in categories}
    
    def format_cat_name(cat_id, subcat_id=None):
        if not cat_id or cat_id not in cat_map:
            return "Sin Categoría"
        c = cat_map[cat_id]
        name = f"[{c.partida}] " if getattr(c, 'partida', None) else ""
        name += c.nombre
        if subcat_id and subcat_id in cat_map:
            sc = cat_map[subcat_id]
            sname = f"[{sc.partida}] " if getattr(sc, 'partida', None) else ""
            name += f" - {sname}{sc.nombre}"
        return name

    # Format response
    total_monto = _ZERO
    detalle = []
    
    for m in movimientos:
        total_monto += m.monto
        detalle.append({
            "id": str(m.id),
            "fecha": m.fecha.isoformat(),
            "hora": m.fecha.strftime("%H:%M"),
            "monto": float(m.monto),
            "descripcion": m.descripcion,
            "categoria": format_cat_name(m.categoria_id, getattr(m, 'subcategoria_id', None)),
            "cajero": m.cajero_name,
            "sucursal_id": m.sucursal_id
        })'''

data = data.replace(target.replace('í', 'A-'), replacement.replace('í', 'A-'))

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Reports formatting patched.")
