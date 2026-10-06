import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_lines = []
for line in content.split("\n"):
    if line.startswith("import"):
        import_lines.append(line)

print("\n".join(import_lines))
