import requests

def test_api():
    # Login to get token
    res = requests.post("http://127.0.0.1:8001/api/v1/auth/login", data={
        "username": "rodrigo.rayo.martinez@gmail.com",
        "password": "password123" # assuming standard Pegasus password, or let's use the DB to forge a token
    })
    
    print("Login:", res.status_code)
    
if __name__ == "__main__":
    test_api()
