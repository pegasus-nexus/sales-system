import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "min-h-[58px]" in line and "div" in line and "key=" in line:
        print(f"Found on line {i}")
        lines[i] = '                                            <div key={cat._id} className={g-white p-3 rounded-xl border flex items-center justify-between group hover:shadow-sm transition-all min-h-[58px] }>\n'

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
