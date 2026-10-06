import os

path = 'frontend/src/api/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string) => {
    let url = /reports/expenses-report?start_date=&end_date=;
    if (sucursalId && sucursalId !== 'all') url += &sucursal_id=;
    if (categoriaId && categoriaId !== 'all') url += &categoria_id=;
    return client(url);
};'''

replacement = '''export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string, subcategoriaId?: string) => {
    let url = /reports/expenses-report?start_date=&end_date=;
    if (sucursalId && sucursalId !== 'all') url += &sucursal_id=;
    if (categoriaId && categoriaId !== 'all') url += &categoria_id=;
    if (subcategoriaId && subcategoriaId !== 'all') url += &subcategoria_id=;
    return client(url);
};'''

data = data.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("api.ts patched.")
