import os
import re

path = 'frontend/src/api/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Revert the wrong replacement
data = data.replace(
    "    if (categoriaId && categoriaId !== 'all') params.append('categoria_id', categoriaId);\n    if (subcategoriaId && subcategoriaId !== 'all') params.append('subcategoria_id', subcategoriaId);",
    "    if (categoriaId && categoriaId !== 'all') params.append('categoria_id', categoriaId);"
)

# Apply specifically to getExpensesReport
target = """export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string, subcategoriaId?: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);
    if (categoriaId && categoriaId !== 'all') params.append('categoria_id', categoriaId);
    return client(`/reports/expenses?${params}`);
};"""

replacement = """export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string, subcategoriaId?: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);
    if (categoriaId && categoriaId !== 'all') params.append('categoria_id', categoriaId);
    if (subcategoriaId && subcategoriaId !== 'all') params.append('subcategoria_id', subcategoriaId);
    return client(`/reports/expenses?${params}`);
};"""

data = data.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("api.ts strictly fixed.")
