import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Store, ShoppingBag,", "ShoppingBag,")
content = content.replace("DollarSign, Store,", "DollarSign,")

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Removed unused Store icon")
