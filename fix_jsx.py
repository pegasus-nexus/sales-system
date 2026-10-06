import os
path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

import re
data = re.sub(r'className=\{.*g-white p-3 rounded-xl border flex items-center justify-between group hover:shadow-sm transition-all min-h-\[58px\].*\}', r'className={g-white p-3 rounded-xl border flex items-center justify-between group hover:shadow-sm transition-all min-h-[58px] }', data)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Fixed JSX.")
