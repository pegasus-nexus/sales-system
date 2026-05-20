import asyncio
from datetime import datetime, timedelta
import random
import os
from motor.motor_asyncio import AsyncIOMotorClient

import sys
from pathlib import Path

# Ensure the 'backend' directory is in PYTHONPATH for relative imports
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

async def seed():
    # Try settings first, fallback to no-auth local if fails
    try:
        MONGODB_URL = settings.MONGODB_URL
        print(f"Probando conexión con credenciales de Settings...")
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
    except:
        print(f"Fallo Auth. Probando conexión sin credenciales (localhost:27017)...")
        MONGODB_URL = "mongodb://localhost:27017"
        client = AsyncIOMotorClient(MONGODB_URL)
        
    db = client["salessystem"]
    
    # 1. Obtener o crear el primer usuario y tenant
    user = await db["users"].find_one()
    if not user:
        print("Base de Datos vacía. Creando Tenant y Usuario Admin de prueba...")
        tenant_id = "test-taboada"
        await db["tenants"].insert_one({
            "tenant_id": tenant_id,
            "name": "Chocolates Taboada (Demo)",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        # Creamos un usuario admin básico (sin contraseña real por ahora, solo para ID)
        res = await db["users"].insert_one({
            "tenant_id": tenant_id,
            "username": "admin",
            "full_name": "Administrador Taboada",
            "email": "admin@taboada.com",
            "role": "SUPERADMIN",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        user_id = str(res.inserted_id)
        user_name = "admin"
    else:
        tenant_id = user["tenant_id"]
        user_id = str(user["_id"])
        user_name = user["username"]
    
    cashier_id = user_id
    cashier_name = user_name
    
    print(f"Poblando datos para Tenant: {tenant_id}")
    
    products = [
        {"id": "prod_estrella", "desc": "Caja Bombones x24", "price": 50.0, "cost": 20.0},
        {"id": "prod_vaca", "desc": "Tableta Bitter 70%", "price": 15.0, "cost": 5.0},
        {"id": "prod_interrogante", "desc": "Trufas de Licor Exótico", "price": 40.0, "cost": 18.0},
        {"id": "prod_perro", "desc": "Chupete de Cacao Antiguo", "price": 5.0, "cost": 3.0},
    ]
    
    # Inyectar 200 ventas
    sales = []
    ahora = datetime.utcnow()
    
    for _ in range(200):
        days_ago = random.randint(0, 45)
        hora = random.randint(8, 21)
        fecha = ahora - timedelta(days=days_ago)
        fecha = fecha.replace(hour=hora, minute=random.randint(0,59))
        
        num_items = random.randint(1, 2)
        items_list = []
        total_v = 0.0
        
        for p in random.sample(products, num_items):
            # Lógica para que las estrellas crezcan (más unidades en los últimos 7 días)
            if p["id"] == "prod_estrella" and days_ago < 7:
                q = random.randint(10, 20)
            else:
                q = random.randint(1, 5)
            
            sub = q * p["price"]
            total_v += sub
            items_list.append({
                "producto_id": p["id"],
                "descripcion": p["desc"],
                "cantidad": q,
                "precio_unitario": p["price"],
                "costo_unitario": p["cost"],
                "subtotal": sub
            })
            
        sales.append({
            "tenant_id": tenant_id,
            "sucursal_id": "CENTRAL",
            "items": items_list,
            "total": total_v,
            "pagos": [{"metodo": "EFECTIVO", "monto": total_v, "fecha": fecha}],
            "cashier_id": cashier_id,
            "cashier_name": cashier_name,
            "anulada": False,
            "estado_pago": "PAGADO",
            "created_at": fecha
        })

    if sales:
        await db["sales"].insert_many(sales)
        print(f"✅ ¡Éxito! {len(sales)} ventas inyectadas directamente en MongoDB.")

if __name__ == "__main__":
    asyncio.run(seed())
