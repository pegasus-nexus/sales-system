import sys

file_path = "frontend/src/pages/InventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

state_anchor = "const [kardexProductoNombre, setKardexProductoNombre] = useState<string | null>(null);"
if "const [isExportingExcel, setIsExportingExcel]" not in content:
    content = content.replace(state_anchor, state_anchor + "\n    const [isExportingExcel, setIsExportingExcel] = useState(false);")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added state successfully")
