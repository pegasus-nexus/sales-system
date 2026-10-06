import os
import re

path = 'backend/app/application/services/compra_service.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''                    inv_query = {
                        "tenant_id": reception.tenant_id,
                        "sucursal_id": reception.sucursal_id,
                        "producto_id": item.producto_id,
                    }
                    if almacen_id == "default":
                        inv_query[""] = [{"almacen_id": "default"}, {"almacen_id": {"": False}}, {"almacen_id": None}]
                    else:
                        inv_query[""] = [{"almacen_id": almacen_id}, {"almacen_id": "default"}, {"almacen_id": {"": False}}, {"almacen_id": None}]

                    inventario = await Inventario.find_one(inv_query, session=session)
                    
                    stock_previo = inventario.cantidad if inventario else 0.0
                    nuevo_stock = stock_previo + item.cantidad_recibida
                    
                    if inventario:
                        inventario.cantidad = nuevo_stock
                        if almacen_id != "default" and inventario.almacen_id in (None, "default"):
                            inventario.almacen_id = almacen_id
                        inventario.updated_at = datetime.now(timezone.utc)
                        await inventario.save(session=session)
                    else:
                        inventario = Inventario(
                            tenant_id=reception.tenant_id,
                            sucursal_id=reception.sucursal_id,
                            almacen_id=almacen_id,
                            producto_id=item.producto_id,
                            cantidad=nuevo_stock
                        )
                        await inventario.insert(session=session)'''

replacement = '''                    inv_query = {
                        "tenant_id": reception.tenant_id,
                        "sucursal_id": reception.sucursal_id,
                        "producto_id": item.producto_id,
                    }
                    if almacen_id == "default":
                        inv_query[""] = [{"almacen_id": "default"}, {"almacen_id": {"": False}}, {"almacen_id": None}]
                    else:
                        inv_query["almacen_id"] = almacen_id

                    # Usar find_one_and_update para operaciA3n atA3mica y evitar condiciones de carrera
                    from pymongo import ReturnDocument
                    
                    # Fetch first to get stock_previo (for the log, it's slightly inaccurate if concurrent, but acceptable for reception)
                    inventario_pre = await Inventario.find_one(inv_query, session=session)
                    stock_previo = inventario_pre.cantidad if inventario_pre else 0.0
                    nuevo_stock = stock_previo + item.cantidad_recibida # just for local reference
                    
                    update_op = {
                        "": {"cantidad": item.cantidad_recibida},
                        "": {"updated_at": datetime.now(timezone.utc)},
                        "": {
                            "tenant_id": reception.tenant_id,
                            "sucursal_id": reception.sucursal_id,
                            "almacen_id": almacen_id,
                            "producto_id": item.producto_id,
                            "created_at": datetime.now(timezone.utc)
                        }
                    }
                    
                    inventario = await Inventario.get_pymongo_collection().find_one_and_update(
                        inv_query,
                        update_op,
                        upsert=True,
                        return_document=ReturnDocument.AFTER,
                        session=session.client_session if hasattr(session, "client_session") else session
                    )
                    
                    nuevo_stock = inventario["cantidad"]'''

data = data.replace(target, replacement.replace('A3', 'ó'))

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("compra_service.py patched")
