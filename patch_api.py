import os

path = "frontend/src/api/api.ts"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """export const getInventario = (sucursalId: string, almacenId: string = 'default', page: number = 1, limit: number = 50, search: string = '', categoriaId: string = '', stockBajo: boolean = false) => {"""

replacement = """export const corregirKardexProducto = (productoId: string, sucursalId: string) => client<any>(`/inventario/corregir-kardex/${productoId}?sucursal_id=${sucursalId}`, { method: 'POST' });

export const getInventario = (sucursalId: string, almacenId: string = 'default', page: number = 1, limit: number = 50, search: string = '', categoriaId: string = '', stockBajo: boolean = false) => {"""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("api.ts patched")
