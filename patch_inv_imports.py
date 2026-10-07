import os

path = "frontend/src/pages/InventarioPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """FileSpreadsheet, Printer } from 'lucide-react';"""
replacement = """FileSpreadsheet, Printer, RefreshCcw } from 'lucide-react';"""
data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("InventarioPage.tsx imports patched")
