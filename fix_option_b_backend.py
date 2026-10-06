import os

tenant_path = 'backend/app/domain/models/tenant.py'
with open(tenant_path, 'r', encoding='utf-8') as f:
    tenant_data = f.read()

if 'currency_code' not in tenant_data:
    tenant_data = tenant_data.replace(
        'class TenantSettings(BaseModel):',
        'class TenantSettings(BaseModel):\n    currency_code: str = "BOB"\n    currency_symbol: str = "Bs."'
    )
    # Also update the hardcoded "Bs." in default_message
    tenant_data = tenant_data.replace(
        'comprobante de tu compra por Bs. {total}',
        'comprobante de tu compra por {currency_symbol} {total}'
    )
    with open(tenant_path, 'w', encoding='utf-8') as f:
        f.write(tenant_data)
        
print("Backend Option B patched.")
