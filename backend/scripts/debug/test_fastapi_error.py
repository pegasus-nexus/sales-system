from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.testclient import TestClient

app = FastAPI()

class User(BaseModel):
    name: str

@app.get("/users", response_model=User)
def get_users():
    return {"wrong_field": "test"}

client = TestClient(app)

def test_fastapi_response_validation_error():
    response = client.get("/users")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_fastapi_response_validation_error()
