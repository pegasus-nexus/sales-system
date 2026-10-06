import os

path = 'frontend/src/api/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = """export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string, subcategoriaId?: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (sucursalId && sucursalId !== 'all') params.set('sucursal_id', sucursalId);
    if (categoriaId && categoriaId !== 'all') params.set('categoria_id', categoriaId);
    return client<unknown>(`/reports/expenses-report?${params.toString()}`);
};"""

replacement = """export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string, subcategoriaId?: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (sucursalId && sucursalId !== 'all') params.set('sucursal_id', sucursalId);
    if (categoriaId && categoriaId !== 'all') params.set('categoria_id', categoriaId);
    if (subcategoriaId && subcategoriaId !== 'all') params.set('subcategoria_id', subcategoriaId);
    return client<unknown>(`/reports/expenses-report?${params.toString()}`);
};"""

data = data.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
