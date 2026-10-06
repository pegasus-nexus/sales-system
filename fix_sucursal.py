import sys

with open("backend/app/api/v1/endpoints/inventario.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('suc_id = current_user.sucursal_id or "CENTRAL"\n        sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id, Sucursal.sucursal_id == suc_id).to_list()', 
                          'suc_id = current_user.sucursal_id or "CENTRAL"\n        if suc_id == "CENTRAL":\n            sucursales = [Sucursal(tenant_id=tenant_id, nombre="Central", ciudad="", direccion="")]\n        else:\n            from beanie import PydanticObjectId\n            sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id, Sucursal.id == PydanticObjectId(suc_id)).to_list()')

content = content.replace('sucursales = [Sucursal(tenant_id=tenant_id, sucursal_id="CENTRAL", name="Central")]',
                          'sucursales = [Sucursal(tenant_id=tenant_id, nombre="Central", ciudad="", direccion="")]')

content = content.replace('"sucursal_id": suc.sucursal_id', '"sucursal_id": str(suc.id) if suc.id else "CENTRAL"')
content = content.replace('sheet_name = str(suc.name)[:31]', 'sheet_name = str(suc.nombre)[:31]')

with open("backend/app/api/v1/endpoints/inventario.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed Sucursal attribute errors in inventario.py")
