import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const res = await client(`/comunidad/entregar-premio/${clienteId}/${premioId}`, { method: 'POST' });",
    "const res = await client<any>(`/comunidad/entregar-premio/${clienteId}/${premioId}`, { method: 'POST' });"
)

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
