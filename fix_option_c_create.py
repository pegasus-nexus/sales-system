
import os

service_path = "backend/app/application/services/product_service.py"
with open(service_path, "r", encoding="utf-8") as f:
    service_data = f.read()

old_logic = """    async def create_product(data: ProductCreate, current_user: User) -> Product:
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Solo administradores de matriz pueden crear nuevos productos")"""

new_logic = """    async def create_product(data: ProductCreate, current_user: User) -> Product:
        if current_user.role in [UserRole.ADMIN_SUCURSAL] and current_user.sucursal_id:
            data.sucursales_permitidas = [current_user.sucursal_id]
        elif current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Rol no autorizado para crear productos")"""

if old_logic in service_data:
    service_data = service_data.replace(old_logic, new_logic)
    with open(service_path, "w", encoding="utf-8") as f:
        f.write(service_data)
    print("Replaced successfully")
else:
    print("Old logic not found")

