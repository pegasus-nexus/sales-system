import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from app.domain.models.compra import Compra", "from app.domain.models.compra import PurchaseOrder")
content = content.replace("await Compra.find(compras_hoy_match).count()", "await PurchaseOrder.find(compras_hoy_match).count()")

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed Compra to PurchaseOrder")
