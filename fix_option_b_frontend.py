import os

types_path = 'frontend/src/api/types.ts'
with open(types_path, 'r', encoding='utf-8') as f:
    types_data = f.read()

if 'currency_code' not in types_data:
    types_data = types_data.replace(
        'export interface TenantSettings {',
        'export interface TenantSettings {\n  currency_code?: string;\n  currency_symbol?: string;'
    )
    with open(types_path, 'w', encoding='utf-8') as f:
        f.write(types_data)

print("Frontend Option B patched.")
