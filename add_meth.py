import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

new_method = """
    @staticmethod
    async def get_premios_uso(tenant_id: str):
        from app.domain.models.cliente import Cliente
        
        # Aggregate to count the usage of each reward
        pipeline = [
            {"$match": {"tenant_id": tenant_id, "is_miembro_comunidad": True, "datos_crm.premios_canjeados": {"$exists": True, "$type": "array", "$not": {"$size": 0}}}},
            {"$unwind": "$datos_crm.premios_canjeados"},
            {"$group": {"_id": "$datos_crm.premios_canjeados", "count": {"$sum": 1}}}
        ]
        
        counts = await Cliente.get_motor_collection().aggregate(pipeline).to_list(length=None)
        
        result = {}
        for c in counts:
            result[c["_id"]] = c["count"]
            
        return result

    @staticmethod
    async def get_stats(tenant_id: str):
"""

content = content.replace("    @staticmethod\n    async def get_stats(tenant_id: str):", new_method)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)
