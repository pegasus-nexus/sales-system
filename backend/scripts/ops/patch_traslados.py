with open('backend/app/application/services/traslado_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if 'updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(' in line and i > 200 and i < 250:
        # We are at lines 223-236 (recibir_traslado)
        # Find start of block: line 223
        # Look backwards to find inv_query_dest definition
        # Replace the find_one_and_update call
        new_lines.append("""                            existing_dest = await Inventario.get_pymongo_collection().find_one(
                                inv_query_dest,
                                session=session.client_session if hasattr(session, "client_session") else session
                            )

                            if existing_dest:
                                updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                                    {"_id": existing_dest["_id"]},
                                    {
                                        "$inc": {"cantidad": qty_recibida},
                                        "$set": {
                                            "almacen_id": almacen_destino,
                                            "updated_at": datetime.now(timezone.utc)
                                        }
                                    },
                                    return_document=ReturnDocument.AFTER,
                                    session=session.client_session if hasattr(session, "client_session") else session
                                )
                            else:
                                updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                                    {
                                        "tenant_id": tenant_id,
                                        "sucursal_id": traslado.sucursal_destino_id,
                                        "producto_id": t_item.producto_id,
                                        "almacen_id": almacen_destino
                                    },
                                    {
                                        "$inc": {"cantidad": qty_recibida},
                                        "$setOnInsert": {
                                            "created_at": datetime.now(timezone.utc),
                                            "updated_at": datetime.now(timezone.utc)
                                        }
                                    },
                                    upsert=True,
                                    return_document=ReturnDocument.AFTER,
                                    session=session.client_session if hasattr(session, "client_session") else session
                                )
""")
        # Skip the original find_one_and_update block (14 lines)
        while i < len(lines) and 'session=session.client_session if hasattr(session, "client_session") else session' not in lines[i]:
            i += 1
        i += 2 # skip closing )
        continue

    elif 'updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(' in line and i > 280:
        # We are at cancelar_traslado
        new_lines.append("""                        existing_orig = await Inventario.get_pymongo_collection().find_one(
                            inv_query_cancel,
                            session=session.client_session if hasattr(session, "client_session") else session
                        )
                        if existing_orig:
                            updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                                {"_id": existing_orig["_id"]},
                                {
                                    "$inc": {"cantidad": t_item.cantidad_enviada},
                                    "$set": {
                                        "almacen_id": almacen_origen_item,
                                        "updated_at": datetime.now(timezone.utc)
                                    }
                                },
                                return_document=ReturnDocument.AFTER,
                                session=session.client_session if hasattr(session, "client_session") else session
                            )
                        else:
                            updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                                {
                                    "tenant_id": tenant_id,
                                    "sucursal_id": traslado.sucursal_origen_id,
                                    "producto_id": t_item.producto_id,
                                    "almacen_id": almacen_origen_item
                                },
                                {
                                    "$inc": {"cantidad": t_item.cantidad_enviada},
                                    "$setOnInsert": {
                                        "created_at": datetime.now(timezone.utc),
                                        "updated_at": datetime.now(timezone.utc)
                                    }
                                },
                                upsert=True,
                                return_document=ReturnDocument.AFTER,
                                session=session.client_session if hasattr(session, "client_session") else session
                            )
""")
        while i < len(lines) and 'session=session.client_session if hasattr(session, "client_session") else session' not in lines[i]:
            i += 1
        i += 2
        continue

    new_lines.append(line)
    i += 1

with open('backend/app/application/services/traslado_service.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Patch applied to traslado_service.py successfully!")
