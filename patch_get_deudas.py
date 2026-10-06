import os

path = 'backend/app/api/v1/endpoints/creditos.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''    deudas = await Deuda.find(*filters).sort(-Deuda.fecha_emision).to_list()
    
    return [
        {
            "id": str(d.id),
            "cuenta_id": str(d.cuenta_id),
            "cliente_id": str(d.cliente_id),
            "sale_id": str(d.sale_id),
            "sale_id_corto": str(d.sale_id)[-6:].upper(),
            "monto_original": float(str(d.monto_original)),
            "saldo_pendiente": float(str(d.saldo_pendiente)),
            "fecha_emision": d.fecha_emision.isoformat(),
            "estado": d.estado.value,
        } for d in deudas
    ]'''

replacement = '''    deudas = await Deuda.find(*filters).sort(-Deuda.fecha_emision).to_list()
    
    # Load associated sales for context
    from app.domain.models.sale import Sale
    sale_ids = [d.sale_id for d in deudas]
    sales = await Sale.find({"_id": {"": [__import__("bson").ObjectId(sid) for sid in sale_ids]}}).to_list()
    sales_map = {str(s.id): s for s in sales}
    
    result = []
    for d in deudas:
        sale = sales_map.get(str(d.sale_id))
        numero_ticket = sale.numero_ticket if sale else str(d.sale_id)[-6:].upper()
        
        # Resumen de productos
        resumen_items = "Desconocido"
        if sale and sale.items:
            names = [item.descripcion for item in sale.items]
            if len(names) > 2:
                resumen_items = f"{names[0]}, {names[1]} y {len(names)-2} mAs"
            else:
                resumen_items = ", ".join(names)
                
        result.append({
            "id": str(d.id),
            "cuenta_id": str(d.cuenta_id),
            "cliente_id": str(d.cliente_id),
            "sale_id": str(d.sale_id),
            "sale_id_corto": str(d.sale_id)[-6:].upper(),
            "numero_ticket": numero_ticket,
            "resumen_items": resumen_items,
            "monto_original": float(str(d.monto_original)),
            "saldo_pendiente": float(str(d.saldo_pendiente)),
            "fecha_emision": d.fecha_emision.isoformat(),
            "estado": d.estado.value,
        })
    return result'''

data = data.replace(target, replacement.replace('A', 'á'))

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("get_deudas patched")
