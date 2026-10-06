import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi.testclient import TestClient
from app.main import app

def test():
    client = TestClient(app)
    
    # We need a valid token. Let's create one for admin
    from app.infrastructure.auth import create_access_token
    token = create_access_token({"sub": "rodrigo", "role": "SUPERADMIN"})
    
    response = client.get(
        "/api/v1/reports/daily-report?date=2026-10-03&sucursal_id=all",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(response.status_code)
    try:
        print(response.json())
    except:
        print(response.text)

test()
