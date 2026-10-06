import os
import re

# 1. Update config.py
config_path = 'backend/app/infrastructure/core/config.py'
with open(config_path, 'r', encoding='utf-8') as f:
    config_data = f.read()
if 'DEFAULT_PUBLIC_TENANT_ID' not in config_data:
    config_data = config_data.replace(
        'class Settings(BaseSettings):',
        'class Settings(BaseSettings):\n    DEFAULT_PUBLIC_TENANT_ID: str = "69cd7f0a8f3f6866d4cfbb62"'
    )
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(config_data)

# 2. Update fidelizacion.py
fid_path = 'backend/app/api/v1/endpoints/fidelizacion.py'
with open(fid_path, 'r', encoding='utf-8') as f:
    fid_data = f.read()

fid_data = fid_data.replace('tenant_id: str = "69cd7f0a8f3f6866d4cfbb62"', 'tenant_id: str = settings.DEFAULT_PUBLIC_TENANT_ID')
fid_data = fid_data.replace('tenant_id: str = "default"', 'tenant_id: str = settings.DEFAULT_PUBLIC_TENANT_ID')
if 'from app.infrastructure.core.config import settings' not in fid_data:
    fid_data = 'from app.infrastructure.core.config import settings\n' + fid_data

with open(fid_path, 'w', encoding='utf-8') as f:
    f.write(fid_data)


# 3. Update web_config.py
web_path = 'backend/app/api/v1/endpoints/web_config.py'
with open(web_path, 'r', encoding='utf-8') as f:
    web_data = f.read()

web_data = re.sub(r'DEFAULT_TENANT_ID\s*=\s*"69cd7f0a8f3f6866d4cfbb62"', '', web_data)

# Fix the GET endpoint logic
get_logic_old = '''    config = await WebConfig.find_one(WebConfig.tenant_id == tenant_id)
    if not config:
        # Fallback al default si no tiene config propia
        config = await WebConfig.find_one(WebConfig.tenant_id == DEFAULT_TENANT_ID)
        if not config:
            # Si ni siquiera el default existe, retornar uno por defecto en memoria
            return WebConfig(tenant_id=tenant_id)
    return config'''
get_logic_new = '''    config = await WebConfig.find_one(WebConfig.tenant_id == tenant_id)
    if not config:
        return WebConfig(tenant_id=tenant_id)
    return config'''
web_data = web_data.replace(get_logic_old, get_logic_new)

# Fix the PUT endpoint logic (Remove the overwrite)
put_logic_old = '''    if tenant_id != DEFAULT_TENANT_ID:
        primary_config = await WebConfig.find_one(WebConfig.tenant_id == DEFAULT_TENANT_ID)
        if primary_config:
            # Sobreescribir con los nuevos datos
            for key, value in update_data.items():
                setattr(primary_config, key, value)
            primary_config.updated_at = datetime.now(timezone.utc)
            await primary_config.save()'''
web_data = web_data.replace(put_logic_old, '')

with open(web_path, 'w', encoding='utf-8') as f:
    f.write(web_data)


# 4. Update upload.py (Upsert data leaks)
upload_path = 'backend/app/api/v1/endpoints/upload.py'
with open(upload_path, 'r', encoding='utf-8') as f:
    upload_data = f.read()

# Fix 1: The find for existing sales
upload_data = upload_data.replace(
    '{"numero_ticket": {"": numeros}, "sucursal_id": sucursal_id}',
    '{"tenant_id": current_user.tenant_id, "numero_ticket": {"": numeros}, "sucursal_id": sucursal_id}'
)

# Fix 2: The UpdateOne for sales
upload_data = upload_data.replace(
    '{"numero_ticket": reg["numero_ticket"], "sucursal_id": sucursal_id}',
    '{"tenant_id": current_user.tenant_id, "numero_ticket": reg["numero_ticket"], "sucursal_id": sucursal_id}'
)

# Fix 3: The UpdateOne for caja_movimientos
upload_data = upload_data.replace(
    'UpdateOne({"sale_id": sale_id_str}',
    'UpdateOne({"tenant_id": current_user.tenant_id, "sale_id": sale_id_str}'
)

with open(upload_path, 'w', encoding='utf-8') as f:
    f.write(upload_data)


# 5. Update reports.py
reports_path = 'backend/app/api/v1/endpoints/reports.py'
with open(reports_path, 'r', encoding='utf-8') as f:
    reports_data = f.read()

reports_data = reports_data.replace(
    '''    tenant_id = current_user.tenant_id or "default"
    if tenant_id == "default":
        tenant_id = "69cd7f0a8f3f6866d4cfbb62"''',
    '''    tenant_id = current_user.tenant_id
    if not tenant_id or tenant_id == "default":
        raise HTTPException(status_code=400, detail="El usuario no tiene un tenant_id asigando.")'''
)

with open(reports_path, 'w', encoding='utf-8') as f:
    f.write(reports_data)

print("Patching A complete.")
