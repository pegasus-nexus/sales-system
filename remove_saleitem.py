import os
import re

path1 = 'backend/app/application/services/sales_service.py'
with open(path1, 'r', encoding='utf-8') as f:
    data = f.read()

data = re.sub(r'from app\.domain\.models\.sale_item import SaleItem as SaleItemAnalytics\n', '', data)
data = re.sub(r'await SaleItemAnalytics\.find\(SaleItemAnalytics\.sale_id == sale_id, session=session\)\.update\(\{"\": \{"sale_date": nueva_fecha\}\}, session=session\)\n', '', data)
data = re.sub(r'await SaleItemAnalytics\([\s\S]*?precio_unitario=DecimalMoney\(\"0.0\"\),\n\s*costo_unitario=DecimalMoney\(\"0.0\"\),\n\s*subtotal=DecimalMoney\(\"0.0\"\)\n\s*\)\.create\(session=session\)', '', data)
# There is another one
data = re.sub(r'await SaleItemAnalytics\([\s\S]*?\.create\(session=session\)', '', data)
data = re.sub(r'await SaleItemAnalytics\.find\([\s\S]*?\.update\(\{"\": \{"sale_id": str\(sale\.id\)\}\}, session=session\)', '', data)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(data)

path2 = 'backend/app/application/services/sales_anulacion_service.py'
with open(path2, 'r', encoding='utf-8') as f:
    data2 = f.read()

data2 = re.sub(r'from app\.domain\.models\.sale_item import SaleItem as SaleItemAnalytics\n', '', data2)
data2 = re.sub(r'await SaleItemAnalytics\.find\([\s\S]*?\.delete\(session=session\)', '', data2)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(data2)

path3 = 'backend/app/application/services/contabilidad_reportes_service.py'
with open(path3, 'r', encoding='utf-8') as f:
    data3 = f.read()

# Instead of querying SaleItem, iterate over sales
data3 = re.sub(r'from app\.domain\.models\.sale_item import SaleItem\n', '', data3)

target3 = """        # Costo de Ventas
        query_items = {
            "tenant_id": tenant_id,
            "sale_date": {"": fecha_inicio, "": fecha_fin},
            "is_active": True
        }
        if sucursal_id and sucursal_id != "all":
            query_items["sucursal_id"] = sucursal_id
            
        sale_items = await SaleItem.find(query_items).to_list()
        costo_ventas = sum((Decimal(str(item.costo_unitario)) * Decimal(str(item.cantidad)) for item in sale_items), Decimal("0"))"""

replacement3 = """        # Costo de Ventas
        costo_ventas = Decimal("0.0")
        for sale in sales:
            if not getattr(sale, 'anulada', False):
                for item in getattr(sale, 'items', []):
                    costo_ventas += Decimal(str(item.costo_unitario)) * Decimal(str(item.cantidad))"""

data3 = data3.replace(target3, replacement3)

with open(path3, 'w', encoding='utf-8') as f:
    f.write(data3)

print("SaleItem removed from codebase")
