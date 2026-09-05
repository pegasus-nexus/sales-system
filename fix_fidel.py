import re

with open("backend/app/api/v1/endpoints/fidelizacion.py", "r", encoding="utf-8") as f:
    content = f.read()

new_logic = """
        if "premios_canjeados" not in existing_cliente.datos_crm:
            existing_cliente.datos_crm["premios_canjeados"] = []
        if "premios_canjeados_fechas" not in existing_cliente.datos_crm:
            existing_cliente.datos_crm["premios_canjeados_fechas"] = {}
            
        # Avoid duplicates
        if data.premio_id not in existing_cliente.datos_crm["premios_canjeados"]:
            existing_cliente.datos_crm["premios_canjeados"].append(data.premio_id)
            
            from datetime import datetime, timezone
            existing_cliente.datos_crm["premios_canjeados_fechas"][data.premio_id] = datetime.now(timezone.utc).isoformat()
            
            await existing_cliente.save()
"""

content = re.sub(
    r"if \"premios_canjeados\" not in existing_cliente\.datos_crm:[\s\S]*?await existing_cliente\.save\(\)",
    new_logic.strip(),
    content
)

with open("backend/app/api/v1/endpoints/fidelizacion.py", "w", encoding="utf-8") as f:
    f.write(content)
