import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix prizeName fallback
content = content.replace(
    "const prizeName = rewardConfig?.title || (p === 'trufa' ? 'CHOCOLATE AMARGO' : p === 'choco' ? 'TRUFAS DE CHOCOLATE' : p === 'cupon2' ? 'GESTO 2%' : p === 'choco3' ? 'GESTO 3%' : p === 'cupon4' ? 'GESTO 4%' : p.toUpperCase());",
    "const prizeName = miembro.premios_canjeados_nombres?.[p] || rewardConfig?.title || (p === 'trufa' ? 'CHOCOLATE AMARGO' : p === 'choco' ? 'TRUFAS DE CHOCOLATE' : p === 'cupon2' ? 'GESTO 2%' : p === 'choco3' ? 'GESTO 3%' : p === 'cupon4' ? 'GESTO 4%' : p.startsWith('PREMIO_') ? 'CUPÓN DESCATALOGADO' : p.toUpperCase());"
)

# Fix isEntregado
content = content.replace(
    "const isEntregado = miembro.datos_crm?.premios_entregados?.includes(p);",
    "const isEntregado = (miembro.datos_crm?.premios_entregados || miembro.premios_entregados || []).includes(p);"
)

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend ComunidadPage updated.")
