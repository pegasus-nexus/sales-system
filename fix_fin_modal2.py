import sys

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add to ActiveConteoView
anchor = "const saveMutation = useMutation({"
if "const confirmModal = useConfirm();" not in content.split(anchor)[0].split("function ActiveConteoView")[-1]:
    content = content.replace(anchor, "const confirmModal = useConfirm();\n    " + anchor)

# Also fix the bad encoding in the confirm that I failed to match
import re
content = re.sub(r"if\(confirm\('[^']+'\)\) {", "if(await confirmModal({title: 'Finalizar Conteo', message: '¿Finalizar conteo? Ya no podrás editarlo y se generará el reporte definitivo.', type: 'warning'})) {", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added confirmModal to ActiveConteoView")
