import sys

with open("backend/app/api/v1/endpoints/sales.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the update_sale_date endpoint
old_endpoint = """@router.patch('/ventas/{sale_id}/fecha')
async def update_sale_date(request: Request, sale_id: str, payload: SaleDateUpdate, current_user: User = Depends(get_current_active_user)):
    tenant_id = request.state.tenant_id
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail='No tienes permisos para modificar la fecha de una venta')
    updated_sale = await SalesService.update_sale_date(tenant_id, sale_id, payload.nueva_fecha, current_user)
    return {'status': 'success', 'message': 'Fecha actualizada masivamente', 'sale': updated_sale}
"""

new_endpoint = """@router.patch('/sales/{sale_id}/fecha')
async def update_sale_date(request: Request, sale_id: str, payload: SaleDateUpdate, current_user: User = Depends(get_current_active_user)):
    tenant_id = current_user.tenant_id or "default"
    allowed_roles = [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail='No tienes permisos para modificar la fecha de una venta')
        
    # If CAJERO, verify their sucursal is a supermarket
    if current_user.role == UserRole.CAJERO:
        from app.domain.models.sucursal import Sucursal
        if not current_user.sucursal_id:
            raise HTTPException(status_code=403, detail='No tienes permisos (sin sucursal asignada)')
        suc = await Sucursal.get(current_user.sucursal_id)
        if not suc or "supermercado" not in str(suc.nombre).lower():
            raise HTTPException(status_code=403, detail='Solo los cajeros de supermercado pueden cambiar la fecha')
            
    updated_sale = await SalesService.update_sale_date(tenant_id, sale_id, payload.nueva_fecha, current_user)
    return {'status': 'success', 'message': 'Fecha actualizada masivamente', 'sale': updated_sale}
"""

if old_endpoint in content:
    content = content.replace(old_endpoint, new_endpoint)
    with open("backend/app/api/v1/endpoints/sales.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated sales.py")
else:
    print("Could not find the endpoint text in sales.py!")
