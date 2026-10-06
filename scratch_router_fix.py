import sys

with open("backend/app/api/v1/router.py", "r", encoding="utf-8") as f:
    content = f.read()

if "import dashboard_matriz" not in content:
    content = "from app.api.v1.endpoints import dashboard_matriz\n" + content
    with open("backend/app/api/v1/router.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed router imports")
