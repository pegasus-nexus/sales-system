
import os
import re

types_path = "frontend/src/api/types.ts"
with open(types_path, "r", encoding="utf-8") as f:
    data = f.read()

# Fix duplicate sucursales_permitidas
data = re.sub(r"sucursales_permitidas\?: string\[\];\s*sucursales_permitidas\?: string\[\];", "sucursales_permitidas?: string[];", data)
data = re.sub(r"sucursales_permitidas\?: string\[\];\n\s*sucursales_permitidas\?: string\[\];", "sucursales_permitidas?: string[];", data)

# Add permisos_especiales to User
if "permisos_especiales" not in data:
    data = data.replace(
        "is_active?: boolean;",
        "is_active?: boolean;\n    permisos_especiales?: Record<string, boolean>;"
    )
    
    # Also to EmployeeCreate (which is probably in this file or UsersPage)
    if "interface EmployeeCreate" in data:
        data = data.replace(
            "role: UserRole;",
            "role: UserRole;\n    permisos_especiales?: Record<string, boolean>;"
        )

with open(types_path, "w", encoding="utf-8") as f:
    f.write(data)

print("types.ts patched.")

