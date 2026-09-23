import re

with open("frontend/src/api/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("`/sales/${saleId}/fecha`", "`/ventas/${saleId}/fecha`")

with open("frontend/src/api/api.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed frontend api.ts route.")
