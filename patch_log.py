import os

path = "backend/app/application/services/compra_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """                    log = InventoryLog(
                        tenant_id=reception.tenant_id,
                        sucursal_id=reception.sucursal_id,
                        almacen_id=inventario.almacen_id if inventario else almacen_id,
                        producto_id=producto_id_log,"""

replacement = """                    log = InventoryLog(
                        tenant_id=reception.tenant_id,
                        sucursal_id=reception.sucursal_id,
                        almacen_id=almacen_final,
                        producto_id=producto_id_log,"""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Log logic patched")
