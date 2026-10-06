import os

path = 'backend/app/api/v1/endpoints/pedidos.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

data = data.replace('from app.domain.models.pedido_item import PedidoItemDocument\n', '')

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("pedidos.py patched")
