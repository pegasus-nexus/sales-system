import sys

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_str = "if(confirm('Finalizar conteo? Ya no podrs editarlo y se generar el reporte definitivo.')) {"
good_str = """if(await confirmModal({
                                        title: 'Finalizar Conteo',
                                        message: '¿Finalizar conteo? Ya no podrás editarlo y se generará el reporte definitivo.',
                                        type: 'warning'
                                    })) {"""

content = content.replace(bad_str, good_str)
content = content.replace("<Loader2, X", "<Loader2")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed Finalizar")
