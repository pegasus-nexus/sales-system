import re

with open("backend/app/api/v1/endpoints/sales.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("@router.patch('/{sale_id}/fecha')", "@router.patch('/ventas/{sale_id}/fecha')")

with open("backend/app/api/v1/endpoints/sales.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed backend sales.py route.")
