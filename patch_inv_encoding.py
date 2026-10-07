import os

path = "frontend/src/pages/InventarioPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

data = data.replace("SUPERADMIN", "SUPERADMIN")
data = data.replace("ADMIN_MATRIZ", "ADMIN_MATRIZ")
data = data.replace("ADMIN", "ADMIN")
data = data.replace("ALL", "ALL")
data = data.replace("A", "á")

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("InventarioPage.tsx fixed encoding")
