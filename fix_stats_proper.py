with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_get_stats = False
in_get_miembros = False

for line in lines:
    if "async def get_stats(tenant_id: str):" in line:
        in_get_stats = True
        new_lines.append(line)
        new_lines.append('        from app.domain.models.cliente import Cliente\n')
        new_lines.append('        total_registrados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True}).count()\n')
        new_lines.append('        total_reclamados = await Cliente.find({"tenant_id": tenant_id, "is_miembro_comunidad": True, "datos_crm.premios_canjeados.0": {"": True}}).count()\n')
        new_lines.append('        total_visitas_globales = await VisitaRegistro.find({"tenant_id": tenant_id}).count()\n')
        new_lines.append('        return {\n')
        new_lines.append('            "total_registrados": total_registrados,\n')
        new_lines.append('            "total_reclamados": total_reclamados,\n')
        new_lines.append('            "total_visitas_globales": total_visitas_globales,\n')
        new_lines.append('            "tasa_conversion": round((total_reclamados / total_registrados * 100), 2) if total_registrados > 0 else 0\n')
        new_lines.append('        }\n')
        continue
        
    if in_get_stats:
        if "@staticmethod" in line or "async def get_users" in line:
            in_get_stats = False
        else:
            continue
            
    new_lines.append(line)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
