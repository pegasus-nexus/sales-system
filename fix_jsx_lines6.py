import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "min-h-[58px]" in line and "div" in line and "key=" in line:
        print(f"Found on line {i}")
        lines[i] = '                                            <div key={cat._id} className={`bg-white p-3 rounded-xl border flex items-center justify-between group hover:shadow-sm transition-all min-h-[58px] ${cat.padre_id ? "border-gray-200 ml-6 bg-gray-50/50" : "border-amber-100"}`}>\n'
    
    if "AEliminar" in line:
        lines[i] = line.replace("AEliminar", "¿Eliminar")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
