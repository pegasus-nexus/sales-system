
import os

prod_path = "backend/app/domain/models/product.py"
with open(prod_path, "r", encoding="utf-8") as f:
    prod_data = f.read()

if "sucursales_permitidas" not in prod_data:
    prod_data = prod_data.replace(
        "precios_sucursales: Optional[dict[str, DecimalMoney]] = None",
        "precios_sucursales: Optional[dict[str, DecimalMoney]] = None\n    sucursales_permitidas: list[str] = []  # Si esta vacio, es global. Si tiene IDs, solo esas sucursales lo ven."
    )
    with open(prod_path, "w", encoding="utf-8") as f:
        f.write(prod_data)

service_path = "backend/app/application/services/product_service.py"
with open(service_path, "r", encoding="utf-8") as f:
    service_data = f.read()

# In get_products we need to modify the match query
match_old = "match_query = {\"tenant_id\": tenant_id}"
match_new = """match_query = {"tenant_id": tenant_id}
    
    # Filtrar por sucursal_permitida
    if sucursal_id and sucursal_id != "CENTRAL":
        match_query["$or"] = [
            {"sucursales_permitidas": {"$size": 0}},
            {"sucursales_permitidas": {"$exists": False}},
            {"sucursales_permitidas": sucursal_id}
        ]"""
        
if "sucursales_permitidas" not in service_data:
    service_data = service_data.replace(match_old, match_new)
    
    # Fix create product: allow branch admins to create products BUT automatically restrict them to their branch
    role_check_old = """    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Solo administradores de matriz pueden crear nuevos productos")"""
    role_check_new = """    if current_user.role in [UserRole.ADMIN_SUCURSAL] and current_user.sucursal_id:
        product_data.sucursales_permitidas = [current_user.sucursal_id]
    elif current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Rol no autorizado para crear productos")"""
    
    service_data = service_data.replace(role_check_old, role_check_new)
    
    with open(service_path, "w", encoding="utf-8") as f:
        f.write(service_data)

print("Backend Option C patched.")

