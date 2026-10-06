import sys

with open("backend/app/domain/models/tenant.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("brand_color: Optional[str] = \"#4f46e5\"", "brand_color: Optional[str] = \"#4f46e5\"\n    margen_distribuidor: float = 0.15  # Default 15% margen")

with open("backend/app/domain/models/tenant.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Added margen_distribuidor to TenantSettings")
