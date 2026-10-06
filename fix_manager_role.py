import sys

with open("backend/app/api/v1/endpoints/sales.py", "r", encoding="utf-8") as f:
    content = f.read()

old_line = "allowed_roles = [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]"
new_line = "allowed_roles = [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]"

if old_line in content:
    content = content.replace(old_line, new_line)
    with open("backend/app/api/v1/endpoints/sales.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully fixed sales.py")
else:
    print("Could not find the line in sales.py")
