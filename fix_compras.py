import os

path = "backend/app/api/v1/endpoints/compras.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """@router.post("/orders", response_model=PurchaseOrder, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    order_in: PurchaseOrderCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL])),
    service: CompraService = Depends(get_compra_service)
):
    \"\"\"
    Crea un nuevo Pedido de Compra al proveedor.
    \"\"\"
    tenant_id = current_user.tenant_id or "default"
    
    if reception_in.es_historico:
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.SUPERADMIN]:
            if "INGRESO_HISTORICO_INVENTARIO" not in (current_user.permisos_especiales or []):
                raise HTTPException(status_code=403, detail="No tienes permisos para realizar ingresos historicos")
    else:
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]:
            if "INGRESO_INVENTARIO" not in (current_user.permisos_especiales or []):
                raise HTTPException(status_code=403, detail="No tienes permisos para ingresar recepciones")

    detalles = ["""

replacement = """@router.post("/orders", response_model=PurchaseOrder, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    order_in: PurchaseOrderCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL])),
    service: CompraService = Depends(get_compra_service)
):
    \"\"\"
    Crea un nuevo Pedido de Compra al proveedor.
    \"\"\"
    tenant_id = current_user.tenant_id or "default"

    detalles = ["""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("compras.py patched")
