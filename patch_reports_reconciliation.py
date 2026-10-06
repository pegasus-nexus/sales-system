import os

path = 'backend/app/api/v1/endpoints/reports.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target1 = '''    ingresos_costo = Decimal("0.0")
    salidas_mermas_costo = Decimal("0.0")
    costo_ventas_kardex = Decimal("0.0")
    
    for r in raw_logs:
        tipo = r["_id"]
        valor = Decimal(str(r["valor_costo"]))
        if valor > 0: 
            ingresos_costo += valor
        else: 
            if tipo == "VENTA":
                costo_ventas_kardex += abs(valor)
            else:
                salidas_mermas_costo += abs(valor)'''

replacement1 = '''    ingresos_costo = Decimal("0.0")
    salidas_mermas_costo = Decimal("0.0")
    costo_ventas_kardex = Decimal("0.0")
    
    desglose_ingresos = {}
    desglose_salidas = {}
    
    for r in raw_logs:
        tipo = r["_id"]
        valor = Decimal(str(r["valor_costo"]))
        if valor > 0: 
            ingresos_costo += valor
            desglose_ingresos[tipo] = float(valor)
        else: 
            if tipo == "VENTA":
                costo_ventas_kardex += abs(valor)
            else:
                salidas_mermas_costo += abs(valor)
                desglose_salidas[tipo] = float(abs(valor))'''

data = data.replace(target1, replacement1)

target2 = '''    sales_pipeline = [
        {"": sale_query},
        {
            "": {
                "_id": None,
                "total_ventas": {"": {"": ""}}
            }
        }
    ]'''

replacement2 = '''    sales_pipeline = [
        {"": sale_query},
        {
            "": ""
        },
        {
            "": {
                "_id": None,
                "total_ventas": {"": {"": ".subtotal"}},
                "ventas_promocion": {
                    "": {
                        "": [
                            {"": [{"": ".descuento_unitario"}, 0]},
                            {"": ".subtotal"},
                            0
                        ]
                    }
                },
                "ventas_regulares": {
                    "": {
                        "": [
                            {"": [{"": ".descuento_unitario"}, 0]},
                            {"": ".subtotal"},
                            0
                        ]
                    }
                }
            }
        }
    ]'''

data = data.replace(target2, replacement2)

target3 = '''    ventas_netas = Decimal(str(raw_sales[0]["total_ventas"])) if raw_sales else Decimal("0.0")
    ganancia_bruta = ventas_netas - costo_ventas_kardex'''

replacement3 = '''    ventas_netas = Decimal(str(raw_sales[0]["total_ventas"])) if raw_sales else Decimal("0.0")
    ventas_promocion = Decimal(str(raw_sales[0]["ventas_promocion"])) if raw_sales else Decimal("0.0")
    ventas_regulares = Decimal(str(raw_sales[0]["ventas_regulares"])) if raw_sales else Decimal("0.0")
    ganancia_bruta = ventas_netas - costo_ventas_kardex'''

data = data.replace(target3, replacement3)

target4 = '''    return {
        "inventario_inicial_costo": float(true_inventario_inicial_costo),
        "revalorizacion_costos": float(revalorizacion_costos),
        "ingresos_inventario_costo": float(ingresos_costo),
        "salidas_mermas_costo": float(salidas_mermas_costo),
        "costo_ventas": float(costo_ventas_kardex),
        "ventas_netas": float(ventas_netas),
        "ganancia_bruta": float(ganancia_bruta),
        "inventario_final_costo": float(inventario_final_costo)
    }'''

replacement4 = '''    return {
        "inventario_inicial_costo": float(true_inventario_inicial_costo),
        "revalorizacion_costos": float(revalorizacion_costos),
        "ingresos_inventario_costo": float(ingresos_costo),
        "salidas_mermas_costo": float(salidas_mermas_costo),
        "costo_ventas": float(costo_ventas_kardex),
        "ventas_netas": float(ventas_netas),
        "ventas_promocion": float(ventas_promocion),
        "ventas_regulares": float(ventas_regulares),
        "ganancia_bruta": float(ganancia_bruta),
        "inventario_final_costo": float(inventario_final_costo),
        "desglose_ingresos": desglose_ingresos,
        "desglose_salidas": desglose_salidas
    }'''

data = data.replace(target4, replacement4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Backend reports.py patched.")
