import os

path = 'backend/app/api/v1/endpoints/caja.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target_create_cat = '''    cat = CajaGastoCategoria(
        tenant_id   = tenant_id,
        nombre      = body.nombre,
        descripcion = body.descripcion,
        icono       = body.icono or "receipt",
    )'''

replacement_create_cat = '''    cat = CajaGastoCategoria(
        tenant_id   = tenant_id,
        nombre      = body.nombre,
        descripcion = body.descripcion,
        icono       = body.icono or "receipt",
        partida     = body.partida,
        padre_id    = body.padre_id,
    )'''

data = data.replace(target_create_cat, replacement_create_cat)

target_update_cat = '''    cat.nombre = body.nombre
    cat.descripcion = body.descripcion
    cat.icono = body.icono or "receipt"'''

replacement_update_cat = '''    cat.nombre = body.nombre
    cat.descripcion = body.descripcion
    cat.icono = body.icono or "receipt"
    cat.partida = body.partida
    cat.padre_id = body.padre_id'''

data = data.replace(target_update_cat, replacement_update_cat)

target_create_gasto = '''    mov = CajaMovimiento(
        tenant_id=tenant_id,
        sucursal_id=sesion.sucursal_id,
        sesion_id=str(sesion.id),
        cajero_id=str(current_user.id),
        cajero_name=current_user.full_name or current_user.email,
        subtipo=SubtipoMovimiento.GASTO,
        tipo="EGRESO",
        monto=DecimalMoney(str(body.monto)),
        descripcion=body.descripcion,
        categoria_id=body.categoria_id
    )'''

replacement_create_gasto = '''    mov = CajaMovimiento(
        tenant_id=tenant_id,
        sucursal_id=sesion.sucursal_id,
        sesion_id=str(sesion.id),
        cajero_id=str(current_user.id),
        cajero_name=current_user.full_name or current_user.email,
        subtipo=SubtipoMovimiento.GASTO,
        tipo="EGRESO",
        monto=DecimalMoney(str(body.monto)),
        descripcion=body.descripcion or "Sin descripción",
        categoria_id=body.categoria_id,
        subcategoria_id=body.subcategoria_id
    )'''

data = data.replace(target_create_gasto, replacement_create_gasto)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Endpoints de caja.py actualizados.")
