import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if "key={cat._id} className={" in line and "min-h-[58px]" in line:
        new_lines.append('                                            <div key={cat._id} className={g-white p-3 rounded-xl border flex items-center justify-between group hover:shadow-sm transition-all min-h-[58px] }>\n')
    else:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("Replaced by lines.")
