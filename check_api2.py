import asyncio
from httpx import AsyncClient

async def get_db_info():
    async with AsyncClient() as client:
        res = await client.post('https://pegasus-nexus.com/api/v1/auth/login', data={'username': 'sara.lazarte.ramirez', 'password': '123'})
        try:
            token = res.json().get('access_token')
        except:
            print("Login response text:", res.text)
            return
            
        res2 = await client.get('https://pegasus-nexus.com/api/v1/inventario?sucursal_id=69cd80098f3f6866d4cfbb64&almacen_id=default&limit=1000', headers={'Authorization': f'Bearer {token}'})
        data = res2.json()
        
        for item in data.get('items', []):
            if "MARACUY" in item.get('producto_nombre', '').upper():
                print(f"API Returned -> {item['producto_nombre']} | Cant: {item['cantidad']}")

asyncio.run(get_db_info())
