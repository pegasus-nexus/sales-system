import requests

BASE_URL = "https://sales-system-aptb.onrender.com/api/v1"

email = "sucursal.heroinas.taboada@gmail.com"
password = "Sucursal.heroinas$2026"

def test_login():
    print(f"Attempting to login to {BASE_URL}/token")
    data = {"username": email, "password": password}
    response = requests.post(f"{BASE_URL}/token", data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        token = response.json().get("access_token")
        print("\n--- Testing /users/me ---")
        headers = {"Authorization": f"Bearer {token}"}
        me_resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
        print(f"Status Code: {me_resp.status_code}")
        print(f"Response: {me_resp.text}")

if __name__ == "__main__":
    test_login()
