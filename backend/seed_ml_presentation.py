import asyncio
from datetime import datetime, timedelta, timezone
import random
import sys
from pathlib import Path

# Ensure the 'backend' directory is in PYTHONPATH for relative imports
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
import holidays

async def seed_ml_presentation():
    # Try connection
    try:
        MONGODB_URL = settings.MONGODB_URL
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        print(f"Conectado a la base de datos.")
    except:
        MONGODB_URL = "mongodb://localhost:27017"
        client = AsyncIOMotorClient(MONGODB_URL)
        print(f"Conectado a mongo localhost.")
        
    db = client["salessystem"]
    
    # 1. Obtener tenant o usuario
    user = await db["users"].find_one()
    if not user:
        tenant_id = "test-presentation"
    else:
        tenant_id = user["tenant_id"]
        
    cashier_id = str(user["_id"]) if user else "cajero"
    cashier_name = user["username"] if user else "admin"

    print("Borrando historial antiguo para la presentación...")
    await db["sales"].delete_many({"tenant_id": tenant_id})
    print("Ventas antiguas limpiadas.")

    products = [
        {"id": "prod_a", "desc": "Caja Surtida X", "price": 100.0, "cost": 50.0},
        {"id": "prod_b", "desc": "Trufas Gourmet", "price": 45.0, "cost": 20.0},
    ]

    sales = []
    base_date = datetime.now()
    
    bo_hol = holidays.Bolivia()
    horas_pico = [8, 9, 13, 14, 18, 19, 20]
    
    sucursales_cursor = db["sucursales"].find({"tenant_id": tenant_id})
    sucursales_docs = await sucursales_cursor.to_list(length=None)
    
    if not sucursales_docs:
        print("No se encontraron sucursales. Usando 'HEROINAS' por defecto.")
        sucursales_ids = ["HEROINAS"]
    else:
        sucursales_ids = [str(s["_id"]) for s in sucursales_docs]
        print(f"Sucursales encontradas: {len(sucursales_ids)}")

    print("Generando simulación de Inteligencia Artificial Avanzada para cada sucursal...")
    
    for sucursal_id in sucursales_ids:
        for day_offset in range(405): # Desde hace 405 días hasta hoy
            target_date = base_date - timedelta(days=day_offset)
            
            # Saltarse domingos para realismo (mitad de domingos)
            if target_date.weekday() == 6 and random.random() > 0.5:
                continue
                
            volumen_diario = random.randint(3, 8)
            
            if target_date.date() in bo_hol or (target_date + timedelta(days=1)).date() in bo_hol:
                volumen_diario += random.randint(10, 20)
                
            for _ in range(volumen_diario):
                hora = random.choice(horas_pico) if random.random() > 0.3 else random.randint(8, 22)
                fecha_venta = target_date.replace(hour=hora, minute=random.randint(0,59))
                
                p = random.choice(products)
                q = random.randint(1, 4)
                
                if target_date.date() in bo_hol:
                    q *= random.randint(2, 5)

                sub = q * p["price"]
                items_list = [{
                    "producto_id": p["id"],
                    "descripcion": p["desc"],
                    "cantidad": q,
                    "precio_unitario": p["price"],
                    "costo_unitario": p["cost"],
                    "subtotal": sub
                }]
                
                sales.append({
                    "tenant_id": tenant_id,
                    "sucursal_id": sucursal_id,
                    "items": items_list,
                    "total": sub,
                    "pagos": [{"metodo": "EFECTIVO", "monto": sub, "fecha": fecha_venta}],
                    "cashier_id": cashier_id,
                    "cashier_name": cashier_name,
                    "anulada": False,
                    "created_at": fecha_venta
                })

        # Asegurarnos que existan ventas sólidas HOY mismo e igual hace 364 días a la misma hora
        hoy = datetime.now()
        hace_364 = hoy - timedelta(days=364)
        
        for h in [8, 9, 10, 11, 12, 13, 16, 17, 18]:
            for ref_date in [hoy, hace_364]:
                if ref_date == hoy and h > hoy.hour:
                    continue
                    
                q = random.randint(5, 12)
                if ref_date == hoy:
                    q = random.randint(8, 15)
                    
                sub = q * 100.0
                
                sales.append({
                    "tenant_id": tenant_id,
                    "sucursal_id": sucursal_id,
                    "items": [{
                        "producto_id": products[0]["id"], "descripcion": products[0]["desc"],
                        "cantidad": q, "precio_unitario": 100.0, "costo_unitario": 50.0, "subtotal": sub
                    }],
                    "total": sub,
                    "pagos": [{"metodo": "EFECTIVO", "monto": sub}],
                    "cashier_id": cashier_id, "cashier_name": cashier_name,
                    "anulada": False,
                    "created_at": ref_date.replace(hour=h, minute=0, second=0)
                })

    # Insert Batch
    if sales:
        batch_size = 1000
        for i in range(0, len(sales), batch_size):
            await db["sales"].insert_many(sales[i:i + batch_size])
            
        print(f"✅ ¡Inyección Exitosa! {len(sales)} ventas creadas.")
        print("La IA Quantile ahora tiene 14 meses de data para todas las sucursales.")

if __name__ == "__main__":
    asyncio.run(seed_ml_presentation())
