import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        start_date = datetime(2026, 7, 16, 0, 0, 0, tzinfo=timezone.utc)
        
        # Manually run the equivalent of what the endpoint does for a session
        cursor = db["caja_sesiones"].find({
            "abierta_at": {"$gte": start_date}
        }).sort("abierta_at", -1)
        
        sessions = await cursor.to_list(length=10)
        for s in sessions:
            print(f"Session: {s['_id']}")
            movs = await db["caja_movimientos"].find({"sesion_id": str(s['_id'])}).to_list(length=1000)
            print(f"  Movs: {len(movs)}")
            
            cerrada_at = s.get('cerrada_at') or datetime.utcnow()
            sales = await db["sales"].find({
                "sucursal_id": s['sucursal_id'],
                "created_at": {"$gte": s['abierta_at'], "$lte": cerrada_at},
                "anulada": False
            }).to_list(length=1000)
            print(f"  Sales: {len(sales)}")
            
            for sale in sales:
                pagos = sale.get('pagos', [])
                if pagos is None: pagos = []
                for p in pagos:
                    # this is where it might crash in the code
                    if type(p) is dict:
                        metodo = p.get('metodo')
                        monto = p.get('monto')
                    else:
                        metodo = p.metodo
                        monto = p.monto
            print("  OK")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
