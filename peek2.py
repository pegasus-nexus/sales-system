import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines[180:230]):
    print(f"{i+180}: {line.strip()}")
