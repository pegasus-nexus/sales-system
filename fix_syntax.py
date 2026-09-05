import re

with open("frontend/src/pages/PedidosPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the invalid arrow function bodies
content = content.replace(
    "onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }); qc.invalidateQueries({ queryKey: ['inventario'] }); qc.invalidateQueries({ queryKey: ['movimientos'] });,",
    "onSuccess: () => { qc.invalidateQueries({ queryKey: ['pedidos'] }); qc.invalidateQueries({ queryKey: ['inventario'] }); qc.invalidateQueries({ queryKey: ['movimientos'] }); },"
)

content = content.replace(
    ";;",
    ";"
)

with open("frontend/src/pages/PedidosPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
