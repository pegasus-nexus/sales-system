import sys
file_path = "backend/app/api/v1/endpoints/inventario.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix Global import
if "from app.domain.models.category import Category" not in content[:500]:
    content = content.replace("from app.domain.models.user import User, UserRole", "from app.domain.models.user import User, UserRole\nfrom app.domain.models.category import Category")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added Category import globally")
