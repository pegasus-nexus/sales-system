import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'return result',
    'total_count = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True}).count()\n        return {"items": result, "total": total_count, "page": (skip // limit) + 1, "limit": limit}'
)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)
