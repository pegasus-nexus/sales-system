import sys

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove unused confirmModal from ControlInventarioPage
content = content.replace("const confirmModal = useConfirm();\n\n    const handleStart", "const handleStart")

# Add confirmModal to ActiveConteoView correctly
import re
content = re.sub(r"(function ActiveConteoView.*?\{)", r"\1\n    const confirmModal = useConfirm();", content, count=1, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS errors")
