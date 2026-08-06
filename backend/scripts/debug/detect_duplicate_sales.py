import asyncio
import os
import sys
from datetime import timedelta
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.core.config import settings
from app.domain.models.sale import Sale
from beanie import init_beanie

async def detect_duplicate_sales():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[Sale])
    
    # Buscamos ventas de los últimos 7 días
    from datetime import datetime, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Obtenemos todas las ventas recientes ordenadas por fecha
    sales = await Sale.find({"created_at": {"$gte": cutoff}, "is_anulada": False}).sort("created_at").to_list()
    
    duplicates = []
    
    # Buscamos ventanas de 10 segundos para la misma sucursal, mismo cajero, mismo total
    for i in range(len(sales)):
        for j in range(i + 1, len(sales)):
            s1 = sales[i]
            s2 = sales[j]
            
            # Si hay más de 30 segundos de diferencia, rompemos el bucle interno
            diff = (s2.created_at - s1.created_at).total_seconds()
            if diff > 30:
                break
                
            if (
                s1.sucursal_id == s2.sucursal_id and
                s1.vendedor_id == s2.vendedor_id and
                s1.total == s2.total and
                s1.estado_pago == s2.estado_pago and
                len(s1.items) == len(s2.items)
            ):
                # Verificar items idénticos
                items1 = sorted([item.producto_id for item in s1.items])
                items2 = sorted([item.producto_id for item in s2.items])
                if items1 == items2:
                    duplicates.append((s1, s2, diff))
                    
    if duplicates:
        print(f"Encontradas {len(duplicates)} posibles ventas duplicadas en los ultimos 30 dias:")
        for s1, s2, diff in duplicates:
            print(f"Sucursal: {s1.sucursal_id} | Total: {s1.total} | Cajero: {s1.vendedor_id}")
            print(f"  Venta 1: {s1.id} ({s1.created_at})")
            print(f"  Venta 2: {s2.id} ({s2.created_at})")
            print(f"  Diferencia: {diff:.2f} segundos\n")
    else:
        print("No se detectaron ventas duplicadas en los ultimos 30 dias.")

if __name__ == "__main__":
    asyncio.run(detect_duplicate_sales())
