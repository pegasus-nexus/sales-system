import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import api from '../api/client';", "import { client } from '../api/client';")
content = content.replace("await api.get('/dashboard-matriz/exchange-rates');", "await client('/dashboard-matriz/exchange-rates');")

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TypeScript TS1192 error in TenantDashboard.tsx")
