import re

with open("backend/app/api/v1/endpoints/fidelizacion.py", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """        if data.premio_id not in existing_cliente.datos_crm["premios_canjeados"]:
            existing_cliente.datos_crm["premios_canjeados"].append(data.premio_id)
            
            from datetime import datetime, timezone
            existing_cliente.datos_crm["premios_canjeados_fechas"][data.premio_id] = datetime.now(timezone.utc).isoformat()
            
            await existing_cliente.save()"""

new_logic = """        if data.premio_id not in existing_cliente.datos_crm["premios_canjeados"]:
            existing_cliente.datos_crm["premios_canjeados"].append(data.premio_id)
            
            from datetime import datetime, timezone
            existing_cliente.datos_crm["premios_canjeados_fechas"][data.premio_id] = datetime.now(timezone.utc).isoformat()
            
            # Fetch and store name so it survives deletions
            from app.domain.models.web_config import WebConfig
            config = await WebConfig.find_one(WebConfig.tenant_id == tenant_id)
            if config and config.rewards:
                for r in config.rewards:
                    if r.get("id") == data.premio_id:
                        if "premios_canjeados_nombres" not in existing_cliente.datos_crm:
                            existing_cliente.datos_crm["premios_canjeados_nombres"] = {}
                        existing_cliente.datos_crm["premios_canjeados_nombres"][data.premio_id] = r.get("title", data.premio_id)
                        break
            
            await existing_cliente.save()"""

content = content.replace(old_logic, new_logic)

with open("backend/app/api/v1/endpoints/fidelizacion.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Backend fidelizacion updated.")
