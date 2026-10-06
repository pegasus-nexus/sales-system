import os

path = 'backend/app/api/v1/endpoints/reports.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target1 = '''async def get_expenses_report(
    start_date: str, # YYYY-MM-DD
    end_date: str,   # YYYY-MM-DD
    sucursal_id: Optional[str] = None,
    categoria_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):'''

replacement1 = '''async def get_expenses_report(
    start_date: str, # YYYY-MM-DD
    end_date: str,   # YYYY-MM-DD
    sucursal_id: Optional[str] = None,
    categoria_id: Optional[str] = None,
    subcategoria_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):'''
data = data.replace(target1, replacement1)

target2 = '''    if categoria_id and categoria_id != "all":
        query["categoria_id"] = categoria_id'''

replacement2 = '''    if categoria_id and categoria_id != "all":
        query["categoria_id"] = categoria_id
    if subcategoria_id and subcategoria_id != "all":
        query["subcategoria_id"] = subcategoria_id'''
data = data.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("backend reports patched.")
