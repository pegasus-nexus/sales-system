import os

path1 = 'backend/app/api/v1/endpoints/reports.py'
with open(path1, 'r', encoding='utf-8') as f:
    data1 = f.read()

import re
data1 = re.sub(r'from app\.domain\.models\.sale_item import SaleItem as SaleItemAnalytics\n', '', data1)
data1 = re.sub(r'from app\.domain\.models\.sale_item import SaleItem\n', '', data1)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(data1)

path2 = 'backend/app/api/v1/endpoints/sales.py'
with open(path2, 'r', encoding='utf-8') as f:
    data2 = f.read()

data2 = re.sub(r'from app\.domain\.models\.sale_item import SaleItem as SaleItemAnalytics\n', '', data2)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(data2)

print("Removed from reports and sales")
