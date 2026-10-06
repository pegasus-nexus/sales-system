import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "import { useAuthStore } from '../store/authStore';" in line:
        continue
    if "const [credentials, setCredentials] = useState" in line:
        continue
    if "setCredentials({ username: vars.username, password: vars.password!, full_name: vars.full_name });" in line:
        continue
    new_lines.append(line)

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Removed useAuthStore and credentials")
