import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd

async def gather_info():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    # Rango de fechas
    print("=== RANGO DE FECHAS ACTUAL ===")
    sales = db['sales']
    if await sales.count_documents({}) > 0:
        first_sale = await sales.find_one({}, sort=[("created_at", 1)])
        last_sale = await sales.find_one({}, sort=[("created_at", -1)])
        print(f"VENTAS OPERATIVAS (POS):")
        print(f"  Desde: {first_sale.get('created_at')}")
        print(f"  Hasta: {last_sale.get('created_at')}")
    
    historicas = db['ventas_historicas_crudas']
    if await historicas.count_documents({}) > 0:
        first_hist = await historicas.find_one({}, sort=[("fecha_transaccion", 1)])
        last_hist = await historicas.find_one({}, sort=[("fecha_transaccion", -1)])
        print(f"VENTAS HISTÓRICAS (Crudas):")
        print(f"  Desde: {first_hist.get('fecha_transaccion')}")
        print(f"  Hasta: {last_hist.get('fecha_transaccion')}")

    # Usuarios
    print("\n=== LISTADO DE USUARIOS ===")
    sucursales_cursor = db['sucursales'].find({})
    sucursales_list = await sucursales_cursor.to_list(length=None)
    sucursales_map = {str(s['_id']): s.get('nombre', 'Desconocida') for s in sucursales_list}
    
    users_cursor = db['users'].find({})
    users_list = await users_cursor.to_list(length=None)
    
    for u in users_list:
        role = u.get('role', 'N/A')
        username = u.get('username', 'N/A')
        suc_id = u.get('sucursal_id')
        suc_name = sucursales_map.get(str(suc_id), 'Todas / Principal') if suc_id else 'Todas / Principal'
        
        # Ocultar usuarios de clientes si los hay (role user o client)
        if role.lower() not in ['user', 'cliente']:
            print(f"- {username} | ROL: {role.upper()} | SUCURSAL: {suc_name}")

if __name__ == '__main__':
    asyncio.run(gather_info())
