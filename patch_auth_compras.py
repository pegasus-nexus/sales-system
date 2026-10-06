import os

path = "backend/app/api/v1/endpoints/compras.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """@router.post("/receptions", response_model=PurchaseReception, status_code=status.HTTP_201_CREATED)
async def create_purchase_reception(
    reception_in: PurchaseReceptionCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO])),
    service: CompraService = Depends(get_compra_service)
):
    \"\"\"
    Confirma el Ingreso F"""

replacement = """@router.post("/receptions", response_model=PurchaseReception, status_code=status.HTTP_201_CREATED)
async def create_purchase_reception(
    reception_in: PurchaseReceptionCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO, UserRole.SUPERVISOR, UserRole.VENDEDOR, UserRole.FACTURADOR])),
    service: CompraService = Depends(get_compra_service)
):
    \"\"\"
    Confirma el Ingreso F"""

data = data.replace(target, replacement)

# Add validation logic inside
target_inside = """    tenant_id = current_user.tenant_id or "default"
    
    detalles = ["""

replacement_inside = """    tenant_id = current_user.tenant_id or "default"
    
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]:
        if "INGRESO_HISTORICO_INVENTARIO" not in (current_user.permisos_especiales or []):
            raise HTTPException(status_code=403, detail="No tienes permisos especiales para ingresar historial")

    detalles = ["""

data = data.replace(target_inside, replacement_inside)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Auth roles patched in compras.py")
