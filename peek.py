import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines[:100]):
    print(f"{i}: {line.strip()}")
