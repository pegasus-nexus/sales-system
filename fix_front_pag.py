import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const res = await client<any>(/comunidad/miembros?limit=10&skip=);",
    "const res = await client<any>(`/comunidad/miembros?limit=10&skip=${skip}`);"
)

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

