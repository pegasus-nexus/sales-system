import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const res = await client('/dashboard-matriz/exchange-rates'); return res.data;", "return await client<any>('/dashboard-matriz/exchange-rates');")

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS18046 unknown type issue in TenantDashboard.tsx")
