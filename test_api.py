import asyncio
from httpx import AsyncClient

async def test():
    # Since I don't have the token, I will just query the DB exactly as the API does.
    from pymongo import MongoClient
    client = MongoClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    # Simulate API query
    search_query = {
        "sucursal_id": "69cd80098f3f6866d4cfbb64",
        "producto_id": "6a85d046431b75defd6dbbc7"
    }
    search_query[""] = [{"almacen_id": "default"}, {"almacen_id": {"": False}}]
    
    doc = db["inventario"].find_one(search_query)
    print(f"API would find: {doc.get('cantidad') if doc else 'None'}")

asyncio.run(test())
