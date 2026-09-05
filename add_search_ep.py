import re

with open("backend/app/api/v1/endpoints/comunidad.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "async def get_miembros(limit: int = 100, skip: int = 0, current_user: User = Depends(get_current_active_user)):",
    "async def get_miembros(limit: int = 100, skip: int = 0, search: Optional[str] = None, current_user: User = Depends(get_current_active_user)):"
)

content = content.replace(
    "return await ComunidadService.get_miembros_comunidad(tenant_id, limit, skip)",
    "return await ComunidadService.get_miembros_comunidad(tenant_id, limit, skip, search)"
)

# check if Optional is imported
if "from typing import" not in content or "Optional" not in content:
    content = "from typing import Optional\n" + content

with open("backend/app/api/v1/endpoints/comunidad.py", "w", encoding="utf-8") as f:
    f.write(content)
