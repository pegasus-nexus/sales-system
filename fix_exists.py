import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '{"": True}',
    '{"$exists": True}'
)

# Export premios_canjeados_fechas
content = content.replace(
    'm_dict["premios_canjeados"] = datos_crm.get("premios_canjeados", [])',
    'm_dict["premios_canjeados"] = datos_crm.get("premios_canjeados", [])\n            m_dict["premios_canjeados_fechas"] = datos_crm.get("premios_canjeados_fechas", {})'
)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)
