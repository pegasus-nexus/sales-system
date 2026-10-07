import os
import re

path = "backend/app/application/services/sales_anulacion_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

# Remove SaleItemAnalytics block
data = re.sub(r'\s*await SaleItemAnalytics\([\s\S]*?\.create\(session=session\)', '', data)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("SaleItemAnalytics removed from anulacion_service")
