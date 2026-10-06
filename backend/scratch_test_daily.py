import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the 'backend' directory to the path so 'app' can be found
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from app.infrastructure.db import init_beanie
from app.domain.models.user import User
from app.api.v1.endpoints.reports import get_daily_report

async def test():
    # Force set env var if empty
    if not os.environ.get('MONGODB_URL'):
        os.environ['MONGODB_URL'] = "mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
    
    await init_beanie()
    admin = await User.find_one()
    if not admin:
        print("No user found")
        return
    print(f"User: {admin.username}")
    try:
        report = await get_daily_report(date="2026-10-03", sucursal_id="all", current_user=admin)
        print("Success! Keys:")
        print(report.keys() if isinstance(report, dict) else report)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test())
