import os

path = "backend/app/application/services/compra_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """                    inventario = await Inventario.find_one(inv_query, session=session)
                    
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
                        await inventario.insert(session=session)"""

replacement = """                    from pymongo import ReturnDocument
                    
                    # Usar find_one_and_update para operacion atomica
                    inventario_pre = await Inventario.find_one(inv_query, session=session)
                    stock_previo = inventario_pre.cantidad if inventario_pre else 0.0
                    
                    if not reception.es_historico:
                        # Incremento atomico
                        update_op = {
                            "$inc": {"cantidad": item.cantidad_recibida},
                            "$set": {"updated_at": datetime.now(timezone.utc)},
                            "$setOnInsert": {
                                "tenant_id": reception.tenant_id,
                                "sucursal_id": reception.sucursal_id,
                                "almacen_id": almacen_id,
                                "producto_id": item.producto_id,
                                "created_at": datetime.now(timezone.utc)
                            }
                        }
                        raw_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                            inv_query,
                            update_op,
                            upsert=True,
                            return_document=ReturnDocument.AFTER,
                            session=session.client_session if hasattr(session, "client_session") else session
                        )
                        nuevo_stock = raw_inv["cantidad"]
                        almacen_final = raw_inv.get("almacen_id", almacen_id)
                    else:
                        # Es historico: no incrementamos stock real
                        nuevo_stock = stock_previo
                        almacen_final = inventario_pre.almacen_id if inventario_pre else almacen_id"""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Stock logic patched")
