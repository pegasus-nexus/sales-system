import os

path = "backend/app/api/v1/endpoints/compras.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """@router.get("/orders/{sucursal_id}", response_model=List[PurchaseOrder])
async def list_purchase_orders(
    sucursal_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO])),
    service: CompraService = Depends(get_compra_service)
):"""

replacement = """@router.get("/orders/{sucursal_id}", response_model=List[PurchaseOrder])
async def list_purchase_orders(
    sucursal_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO, UserRole.SUPERVISOR, UserRole.VENDEDOR, UserRole.FACTURADOR])),
    service: CompraService = Depends(get_compra_service)
):
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]:
        if "INGRESO_HISTORICO_INVENTARIO" not in (current_user.permisos_especiales or []):
            raise HTTPException(status_code=403, detail="No tienes permisos para listar ordenes")
"""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Auth roles for list_orders patched")
