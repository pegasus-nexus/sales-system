with open('backend/app/api/v1/endpoints/reports.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace attribute access with dict access
old_loop = '''    for s in sales:
        if s.anulada:
            continue

        if s.estado_pago in ["PENDIENTE", "PARCIAL"]:
            pagado = sum((p.monto for p in s.pagos), _ZERO)
            credito_otorgado = s.total - pagado
            total_creditos += credito_otorgado
            
        for p in s.pagos:
            metodo = p.metodo.upper()
            ventas_por_metodo[metodo] = ventas_por_metodo.get(metodo, _ZERO) + p.monto'''

new_loop = '''    for s in sales:
        if s.get("anulada", False) or str(s.get("estado", "")).lower() == "anulado":
            continue

        estado_pago = s.get("estado_pago", "PAGADO")
        total_venta = Decimal(str(s.get("total", 0)))
        pagos = s.get("pagos", [])

        if estado_pago in ["PENDIENTE", "PARCIAL"]:
            pagado = sum((Decimal(str(p.get("monto", 0))) for p in pagos if isinstance(p, dict)), _ZERO)
            credito_otorgado = total_venta - pagado
            total_creditos += credito_otorgado
            
        for p in pagos:
            if isinstance(p, dict):
                metodo = p.get("metodo", "EFECTIVO").upper()
                monto = Decimal(str(p.get("monto", 0)))
                ventas_por_metodo[metodo] = ventas_por_metodo.get(metodo, _ZERO) + monto'''

if old_loop in content:
    content = content.replace(old_loop, new_loop)
    print("Replaced!")
else:
    print("Not found")

with open('backend/app/api/v1/endpoints/reports.py', 'w', encoding='utf-8') as f:
    f.write(content)
