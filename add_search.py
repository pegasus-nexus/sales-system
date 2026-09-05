import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

new_method = """
    @staticmethod
    async def get_miembros_comunidad(tenant_id: str, limit: int = 100, skip: int = 0, search: Optional[str] = None):
        from app.domain.models.cliente import Cliente
        from app.domain.models.sale import Sale
        
        query = {
            "tenant_id": tenant_id,
            "is_miembro_comunidad": True
        }
        
        if search:
            query["$or"] = [
                {"nombre": {"$regex": search, "$options": "i"}},
                {"numero_tarjeta": {"$regex": search, "$options": "i"}},
                {"telefono": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"nit_ci": {"$regex": search, "$options": "i"}}
            ]
        
        miembros = await Cliente.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
        
        # Manual Join for CRM metrics
        if not miembros:
            return {"items": [], "total": 0, "page": (skip // limit) + 1, "limit": limit}
            
        cliente_ids = [str(m.id) for m in miembros]
        
        from beanie.operators import In
        
        # Fetch matching sales
        sales = await Sale.find(
            Sale.tenant_id == tenant_id,
            In(Sale.cliente_id, cliente_ids)
        ).to_list()
"""

# we need to replace until ).to_list()
content = re.sub(
    r"@staticmethod\n    async def get_miembros_comunidad\(tenant_id: str, limit: int = 100, skip: int = 0\):[\s\S]*?In\(Sale\.cliente_id, cliente_ids\)\n        \)\.to_list\(\)",
    new_method.strip(),
    content
)

# also replace the total count query
content = content.replace(
    'total_count = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True}).count()',
    'total_count = await Cliente.find(query).count()'
)

# check if Optional is imported
if "from typing import" not in content or "Optional" not in content:
    content = "from typing import Optional\n" + content

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)
