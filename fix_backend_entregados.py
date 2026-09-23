import re

with open("backend/app/application/services/comunidad_service.py", "r", encoding="utf-8") as f:
    content = f.read()

old_extraer = """            # Extraer premios_canjeados de datos_crm
            datos_crm = getattr(m, 'datos_crm', {}) or {}
            m_dict["premios_canjeados"] = datos_crm.get("premios_canjeados", [])
            m_dict["premios_canjeados_fechas"] = datos_crm.get("premios_canjeados_fechas", {})"""

new_extraer = """            # Extraer premios_canjeados de datos_crm
            datos_crm = getattr(m, 'datos_crm', {}) or {}
            m_dict["premios_canjeados"] = datos_crm.get("premios_canjeados", [])
            m_dict["premios_canjeados_fechas"] = datos_crm.get("premios_canjeados_fechas", {})
            m_dict["premios_entregados"] = datos_crm.get("premios_entregados", [])"""

content = content.replace(old_extraer, new_extraer)

with open("backend/app/application/services/comunidad_service.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Backend get_miembros_comunidad updated to return premios_entregados.")
