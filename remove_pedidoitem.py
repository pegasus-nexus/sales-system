import os
import re

path1 = 'backend/app/application/services/pedidos_service.py'
with open(path1, 'r', encoding='utf-8') as f:
    data = f.read()

data = re.sub(r'from app\.domain\.models\.pedido_item import PedidoItemDocument\n', '', data)
data = re.sub(r'                    items_docs = \[\s*PedidoItemDocument\([\s\S]*?\]\s*# Beanie insert_many with session\s*if items_docs:\s*await PedidoItemDocument\.insert_many\(items_docs, session=session\)', '', data)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(data)

path2 = 'backend/app/infrastructure/db.py'
with open(path2, 'r', encoding='utf-8') as f:
    data = f.read()

data = re.sub(r'from app\.domain\.models\.pedido_item import PedidoItemDocument\n', '', data)
data = re.sub(r'from app\.domain\.models\.sale_item import SaleItem\n', '', data)

data = data.replace('        PedidoItemDocument,\n', '')
data = data.replace('        SaleItem,\n', '')

with open(path2, 'w', encoding='utf-8') as f:
    f.write(data)

print("PedidoItemDocument removed")
