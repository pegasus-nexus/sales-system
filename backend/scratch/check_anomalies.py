import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson.decimal128 import Decimal128

async def check_anomalies():
    uri = "mongodb+srv://sahian-dev-mongo:8wngkGRxGBKg3gsu@sales-system.hh277gd.mongodb.net/?appName=sales-system"
    import certifi
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client.get_database("salessystem")
    
    print("Conectando a base de datos de producción...")
    cursor = db.sales.find({"anulada": {"$ne": True}})
    
    anomalies = []
    
    async for sale in cursor:
        total = float(sale.get("total", 0).to_decimal()) if isinstance(sale.get("total"), Decimal128) else float(sale.get("total", 0))
        
        pagos = sale.get("pagos", [])
        
        # Check if it has credit
        has_credit = any(p.get("metodo") == "CREDITO" for p in pagos)
        
        if not has_credit:
            total_pagado = 0
            for p in pagos:
                monto = float(p.get("monto", 0).to_decimal()) if isinstance(p.get("monto"), Decimal128) else float(p.get("monto", 0))
                total_pagado += monto
            
            # If total_pagado is significantly less than total (allowing 0.05 margin for rounding)
            if total_pagado < total - 0.05:
                # Discard if it has a discount applied that equals the difference?
                # Actually, total is the final computed total. But let's check.
                anomalies.append({
                    "id": str(sale["_id"]),
                    "date": sale.get("created_at"),
                    "total": total,
                    "pagado": total_pagado,
                    "cajero": sale.get("cashier_name", "N/A")
                })
                
    if not anomalies:
        print("No se encontraron otras anomalías.")
    else:
        print(f"Se encontraron {len(anomalies)} casos sospechosos:")
        for a in anomalies:
            print(f"- Ticket #{a['id'][-6:].upper()} | {a['date']} | Total: Bs. {a['total']:.2f} | Pagado: Bs. {a['pagado']:.2f} | Cajero: {a['cajero']}")

if __name__ == "__main__":
    asyncio.run(check_anomalies())
