
import os

types_path = "frontend/src/api/types.ts"
with open(types_path, "r", encoding="utf-8") as f:
    data = f.read()

# I will carefully remove `\n    permisos_especiales?: Record<string, boolean>;` from everywhere, and then ONLY add it to User and EmployeeCreate.
data = data.replace("\n    permisos_especiales?: Record<string, boolean>;", "")

with open(types_path, "w", encoding="utf-8") as f:
    f.write(data)

print("types.ts cleaned.")

