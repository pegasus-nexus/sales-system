import sys

file_path = "backend/app/api/v1/router.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

import_anchor = "from .endpoints import ("
if "conteos_fisicos" not in content:
    content = content.replace(import_anchor, import_anchor + "\n    conteos_fisicos,")

router_anchor = 'api_router.include_router(compras.router, prefix="/compras", tags=["compras"])'
if 'api_router.include_router(conteos_fisicos.router' not in content:
    content = content.replace(router_anchor, router_anchor + '\napi_router.include_router(conteos_fisicos.router, prefix="/conteos-fisicos", tags=["conteos_fisicos"])')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added conteos_fisicos to router.py")
