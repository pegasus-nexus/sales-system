import asyncio
from app.api.v1.endpoints.web_collections import WebCollectionCreate

def run():
    try:
        w = WebCollectionCreate(name="Test", image_url="")
        print("Success:", w)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
