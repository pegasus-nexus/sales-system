import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

# We need to add total_entregados to get_stats
old_stats = """        total_registrados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True}).count()
        total_reclamados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True, "datos_crm.premios_canjeados.0": {"$exists": True}}).count()
        total_visitas_globales = await VisitaRegistro.find({"tenant_id": tenant_id}).count()
        return {
            "total_registrados": total_registrados,
            "total_reclamados": total_reclamados,
            "total_visitas_globales": total_visitas_globales,
            "tasa_conversion": round((total_reclamados / total_registrados * 100), 2) if total_registrados > 0 else 0
        }"""

new_stats = """        total_registrados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True}).count()
        total_reclamados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True, "datos_crm.premios_canjeados.0": {"$exists": True}}).count()
        total_entregados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True, "datos_crm.premios_entregados.0": {"$exists": True}}).count()
        total_visitas_globales = await VisitaRegistro.find({"tenant_id": tenant_id}).count()
        return {
            "total_registrados": total_registrados,
            "total_reclamados": total_reclamados,
            "total_entregados": total_entregados,
            "total_visitas_globales": total_visitas_globales,
            "tasa_conversion": round((total_reclamados / total_registrados * 100), 2) if total_registrados > 0 else 0
        }"""

content = content.replace(old_stats, new_stats)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Backend get_stats updated.")
