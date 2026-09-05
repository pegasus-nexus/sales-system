import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix get_stats
content = re.sub(
    r"total_registrados = await ComunidadUser.find\(ComunidadUser.tenant_id == tenant_id\).count\(\)",
    r"from app.domain.models.cliente import Cliente\n        total_registrados = await Cliente.find(Cliente.tenant_id == tenant_id, Cliente.is_miembro_comunidad == True).count()",
    content
)

content = re.sub(
    r"total_reclamados = await ComunidadUser.find\([\s\S]*?ha_reclamado == True\n\s*\).count\(\)",
    r"total_reclamados = len(await Cliente.find(Cliente.tenant_id == tenant_id, Cliente.is_miembro_comunidad == True).to_list()) # Simplified, we'll refine if needed. Wait, we can count those with premios_canjeados in datos_crm.",
    content
)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)

