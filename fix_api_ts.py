import os
import re

path = 'frontend/src/api/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

data = re.sub(
    r"export const getExpensesReport = \(startDate: string, endDate: string, sucursalId\?: string, categoriaId\?: string\) => \{",
    "export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string, subcategoriaId?: string) => {",
    data
)

data = re.sub(
    r"if \(categoriaId && categoriaId !== 'all'\) params\.append\('categoria_id', categoriaId\);",
    "if (categoriaId && categoriaId !== 'all') params.append('categoria_id', categoriaId);\n    if (subcategoriaId && subcategoriaId !== 'all') params.append('subcategoria_id', subcategoriaId);",
    data
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
