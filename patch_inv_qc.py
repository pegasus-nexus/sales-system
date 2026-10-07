import os

path = "frontend/src/pages/InventarioPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

data = data.replace("refetch();", "queryClient.invalidateQueries({ queryKey: ['inventario'] });")

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("InventarioPage.tsx queryClient patched")
