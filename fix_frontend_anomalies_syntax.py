import os

path = 'frontend/src/components/InventoryReconciliationView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Let's fix the classNames
data = data.replace('className={\px-2', 'className={px-2')
data = data.replace('text-emerald-700\'}\>', 'text-emerald-700\'}}>')
data = data.replace('className={\px-4 py-3', 'className={px-4 py-3')
data = data.replace('text-emerald-600\'}\>', 'text-emerald-600\'}}>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
