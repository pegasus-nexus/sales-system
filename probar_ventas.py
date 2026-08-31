import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

CADENA_MONGO = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"


async def probar():
    cliente = AsyncIOMotorClient(CADENA_MONGO)

    try:
        db = cliente.sales_system_prod

        start_utc = datetime(2026, 8, 11, 4, 0, 0)
        end_utc = datetime(2026, 8, 12, 4, 0, 0)

        cursor = db.sales.find({
            "created_at": {
                "$gte": start_utc,
                "$lt": end_utc
            },
            "anulada": {"$ne": True}
        }).sort("created_at", 1)

        ventas = await cursor.to_list(length=None)

        print("Cantidad de ventas:", len(ventas))

        for venta in ventas:
            print(
                venta.get("created_at"),
                "-> Bs.",
                venta.get("total"),
                "| sucursal:",
                venta.get("sucursal_id")
            )

    finally:
        cliente.close()


asyncio.run(probar())