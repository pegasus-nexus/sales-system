import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

import_str = "from app.domain.models.tenant import Tenant\n"
new_import = "from app.domain.models.tenant import Tenant\nfrom app.application.services.exchange_service import ExchangeService\n"
if "ExchangeService" not in content:
    content = content.replace(import_str, new_import)

endpoint_code = """
@router.get("/exchange-rates")
async def get_exchange_rates(current_user: User = Depends(get_current_active_user)):
    rates = await ExchangeService.get_rates()
    return rates
"""
if "/exchange-rates" not in content:
    content = content + endpoint_code

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Added endpoint to dashboard_matriz.py")
