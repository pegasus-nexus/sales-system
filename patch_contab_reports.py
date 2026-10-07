import os

path = "backend/app/application/services/contabilidad_reportes_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """        # Costo de Ventas
        query_items = {
            "tenant_id": tenant_id,
            "sale_date": {"$gte": fecha_inicio, "$lte": fecha_fin},
            "is_active": True
        }
        if sucursal_id:
            query_items["sucursal_id"] = sucursal_id
            
        sale_items = await SaleItem.find(query_items).to_list()
        costo_ventas = sum((Decimal(str(item.costo_unitario)) * Decimal(str(item.cantidad)) for item in sale_items), Decimal("0"))"""

replacement = """        # Costo de Ventas calculando iterativamente
        costo_ventas = Decimal("0")
        for v in ventas:
            if not v.anulada:
                for item in v.items:
                    costo_ventas += Decimal(str(item.costo_unitario)) * Decimal(str(item.cantidad))"""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("contabilidad_reportes_service.py patched")
