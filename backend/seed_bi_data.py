import asyncio
from datetime import datetime, timedelta
import random
import os

# Forzar emulación de compatibilidad con módulos app
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import init_db
from app.models.sale import Sale, SaleItem, PagoItem, EstadoPago
from app.models.user import User

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

async def seed():
    print("Conectando a MongoDB Local de forma aislada...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client.salessystem, document_models=[User, Sale])
    
    # 1. Obtener un Tenant válido
    user = await User.find_one()
    if not user:
        print("CRÍTICO: No hay usuarios creados. Debes registrarte en la página primero.")
        return
        
    tenant_id = user.tenant_id
    print(f"Inyectando datos artificiales para el Tenant: {tenant_id}")
    
    # 2. Catálogo Falso de Chocolates
    products = [
        {"id": "prod_estrella", "desc": "Caja Bombones x24", "price": 50.0, "cost": 20.0},
        {"id": "prod_vaca", "desc": "Tableta Bitter 70%", "price": 15.0, "cost": 5.0},
        {"id": "prod_interrogante", "desc": "Trufas de Licor Exótico", "price": 40.0, "cost": 18.0},
        {"id": "prod_perro", "desc": "Chupete de Cacao Antiguo", "price": 5.0, "cost": 3.0},
        {"id": "prod_neutro", "desc": "Alfajor Bañado", "price": 8.0, "cost": 4.0},
    ]
    
    sucursales = ["CENTRAL", "ZONA_SUR", "MEGA_CENTER"]
    # Simulamos picos de tráfico al mediodía y tarde-noche
    horas_pico = [8, 10, 11, 12, 12, 13, 14, 16, 17, 18, 18, 18, 20]
    
    print("Generando 300 transacciones para los últimos 60 días...")
    sales_to_insert = []
    
    ahora = datetime.utcnow()
    
    for _ in range(300):
        # Días en el pasado (0 a 60 días atrás) para asegurar Crecimiento en la BCG
        days_ago = random.randint(0, 60)
        hora_random = random.choice(horas_pico)
        min_random = random.randint(0, 59)
        
        sale_date = ahora - timedelta(days=days_ago)
        sale_date = sale_date.replace(hour=hora_random, minute=min_random)
        
        # Simulador de items por canasta
        num_items = random.randint(1, 3)
        elegidos = random.sample(products, num_items)
        
        items_recibo = []
        total_boleta = 0.0
        
        for p in elegidos:
            # Lógica de venta: Las "Estrellas" y "Vacas" venden más
            if p["id"] == "prod_estrella":
                # Si es reciente (últimos 15 días), vende brutalmente más (Crecimiento BCG)
                qty = random.randint(3, 8) if days_ago < 15 else random.randint(1, 3)
            elif p["id"] == "prod_vaca":
                qty = random.randint(4, 10) # Vende mucho siempre, lento crecimiento
            elif p["id"] == "prod_interrogante":
                qty = random.randint(1, 5) if days_ago < 10 else 0
                if qty == 0: continue # No vendió antes, alta aceleración
            elif p["id"] == "prod_perro":
                qty = random.randint(1, 2) # Casi no vende
            else:
                qty = random.randint(1, 3)
                
            subtotal_item = qty * p["price"]
            total_boleta += subtotal_item
            
            items_recibo.append(SaleItem(
                producto_id=p["id"],
                descripcion=p["desc"],
                cantidad=qty,
                precio_unitario=p["price"],
                costo_unitario=p["cost"],
                subtotal=subtotal_item
            ))
            
        if not items_recibo:
            continue
            
        sucursal_random = random.choice(sucursales)
        
        # Cliente ID ficticio
        c_id = f"cliente_{random.randint(1, 50)}"
        
        # Construir Venta
        s = Sale(
            tenant_id=tenant_id,
            sucursal_id=sucursal_random,
            items=items_recibo,
            total=total_boleta,
            pagos=[PagoItem(metodo="EFECTIVO", monto=total_boleta, fecha=sale_date)],
            cliente_id=c_id,
            cashier_id=str(user.id),
            cashier_name=user.username,
            created_at=sale_date,
            estado_pago=EstadoPago.PAGADO
        )
        sales_to_insert.append(s)
        
    # Borrado Mágico Opcional para reiniciar (Comentado por seguridad)
    # await Sale.find({"tenant_id": tenant_id}).delete()
    
    await Sale.insert_many(sales_to_insert)
    print(f"¡ÉXITO! Se inyectaron {len(sales_to_insert)} Boletas de Venta exitosamente en MongoDB.")

if __name__ == "__main__":
    asyncio.run(seed())
