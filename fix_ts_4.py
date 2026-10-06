import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("onSuccess: (_, vars) => {", "onSuccess: () => {")

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Removed vars parameter")
