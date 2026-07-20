import asyncio
import sys
from pathlib import Path

# Setup Path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime, timedelta

def test_api():
    client = TestClient(app)

    # 1. Login to get token using the real route
    # Looking at auth.py it's usually /api/v1/login/access-token
    login_res = client.post(
        "/api/v1/login/access-token",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if login_res.status_code != 200:
        print("Login failed:", login_res.text)
        login_res = client.post(
            "/api/v1/login/access-token",
            data={"username": "rodrigorayomartinez@gmail.com", "password": "securepassword123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if login_res.status_code != 200:
            print("Both logins failed.")
            return

    token = login_res.json()["access_token"]
    print("Got token")

    headers = {"Authorization": f"Bearer {token}"}
    start = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%dT00:00:00")
    end = datetime.utcnow().strftime("%Y-%m-%dT23:59:59")

    # URL Dashboard
    url_dash = f"/api/v1/analytics/dashboard?start_date={start}&end_date={end}"
    print(f"Testing Dashboard")
    res = client.get(url_dash, headers=headers)
    print("Dashboard HTTP status:", res.status_code)
    if res.status_code != 200: print(res.text)

    # URL BCG
    url_bcg = f"/api/v1/analytics/bcg?start_date={start}&end_date={end}"
    print(f"Testing BCG")
    res2 = client.get(url_bcg, headers=headers)
    print("BCG HTTP status:", res2.status_code)
    if res2.status_code != 200: print(res2.text)

    # URL ML
    url_ml = "/api/v1/analytics/ml/predict-demand?predict_days=7"
    print(f"Testing ML")
    res3 = client.get(url_ml, headers=headers)
    print("ML HTTP status:", res3.status_code)
    if res3.status_code != 200: print(res3.text)

if __name__ == "__main__":
    test_api()
