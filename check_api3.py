import requests

def get_db_info():
    res = requests.post('https://pegasus-nexus.com/api/v1/auth/login', data={'username': 'sara.lazarte.ramirez', 'password': '123'})
    token = res.json().get('access_token')
    if not token:
        print("Failed to login", res.json())
        return
        
    res2 = requests.get('https://pegasus-nexus.com/api/v1/inventario?sucursal_id=69cd80098f3f6866d4cfbb64&almacen_id=default&limit=1000', headers={'Authorization': f'Bearer {token}'})
    data = res2.json()
    
    for item in data.get('items', []):
        if "MARACUY" in item.get('producto_nombre', '').upper():
            print(f"API Returned -> {item['producto_nombre']} | ID: {item['producto_id']} | Cant: {item['cantidad']}")

get_db_info()
