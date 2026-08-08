import asyncio
import os
import sys
from dotenv import load_dotenv

# Load env variables from backend/.env
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
load_dotenv(os.path.join(backend_dir, '.env'))
sys.path.insert(0, backend_dir)

from app.infrastructure.core.config import settings
from app.domain.models.sale import Sale
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

async def check_tickets():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[Sale])
    
    # Buscamos por el sufijo del ID: 992ba4 y 992b9e
    sales = await Sale.find({}).to_list()
    target_sales = []
    for s in sales:
        sid = str(s.id)
        if sid.lower().endswith("992ba4") or sid.lower().endswith("992b9e"):
            target_sales.append(s)
            
    print(f"Encontradas {len(target_sales)} ventas:")
    for s in target_sales:
        print("--------------------------------------------------")
        print(f"ID: {s.id}")
        print(f"Created At (UTC): {s.created_at} (ISO: {s.created_at.isoformat()})")
        print(f"Cashier: {s.cashier_name} ({s.cashier_id})")
        print(f"Total: {s.total}")
        print(f"Idempotency Key: {getattr(s, 'idempotency_key', None)}")
        print(f"Anulada: {s.anulada}")
        print(f"Items: {[(i.producto_id, i.descripcion, i.cantidad) for i in s.items]}")

if __name__ == "__main__":
    asyncio.run(check_tickets())
