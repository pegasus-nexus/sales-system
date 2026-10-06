import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("getSucursales, createProduct", "getSucursales, getCategories, createProduct")
content = content.replace("const { data: metrics", "const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });\n    const { data: metrics")

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Added getCategories back")
