import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace method signature
content = content.replace(
    'async def get_miembros_comunidad(tenant_id: str, limit: int = 100, skip: int = 0, search: Optional[str] = None):',
    'async def get_miembros_comunidad(tenant_id: str, limit: int = 100, skip: int = 0, search: Optional[str] = None, tipo_filtro: str = "comunidad"):'
)

# Replace query logic
old_query = """        query = {
            "tenant_id": tenant_id,
            "is_miembro_comunidad": True
        }"""
new_query = """        query = {
            "tenant_id": tenant_id
        }
        if tipo_filtro == "comunidad":
            query["is_miembro_comunidad"] = True
        elif tipo_filtro == "regulares":
            query["is_miembro_comunidad"] = {"$ne": True}"""

content = content.replace(old_query, new_query)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)

with open("backend/app/api/v1/endpoints/comunidad.py", "r", encoding="utf-8") as f:
    api_content = f.read()

# Replace router signature
api_content = api_content.replace(
    'async def get_miembros(limit: int = 100, skip: int = 0, search: Optional[str] = None, current_user: User = Depends(get_current_active_user)):',
    'async def get_miembros(limit: int = 100, skip: int = 0, search: Optional[str] = None, tipo: str = "comunidad", current_user: User = Depends(get_current_active_user)):'
)
api_content = api_content.replace(
    'return await ComunidadService.get_miembros_comunidad(tenant_id, limit, skip, search)',
    'return await ComunidadService.get_miembros_comunidad(tenant_id, limit, skip, search, tipo)'
)

with open("backend/app/api/v1/endpoints/comunidad.py", "w", encoding="utf-8") as f:
    f.write(api_content)

print("Backend modificado para soportar filtro tipo.")
