import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId

async def fix_historical_sales():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    sale_ids = [
        "6a94bd08f4996de97ff7c908",
        "6a94b8cbf4996de97ff7c8b5",
        "6a94b6a4f4996de97ff7c87b",
        "6a94b374f4996de97ff7c83f",
        "6a94b23ff4996de97ff7c816",
        "6a949dc9f4996de97ff7c7cc",
        "6a947bc6f4996de97ff7c44e"
    ]
    
    for sid in sale_ids:
        sale = await db.sales.find_one({"_id": ObjectId(sid)})
        if not sale: continue
        
        tenant_id = sale.get('tenant_id', '69cd7f0a8f3f6866d4cfbb62')
        sucursal_id = sale.get('sucursal_id')
        sale_date = sale.get('created_at')
        
        # 1. Check if analytics exist
        ana_count = await db.sale_item_analytics.count_documents({"sale_id": sid})
        if ana_count == 0:
            for item in sale.get("items", []):
                def get_float(k):
                    val = item.get(k, 0)
                    if val is None: return 0.0
                    if hasattr(val, "to_decimal"): return float(val.to_decimal())
                    return float(val)
                
                analytics_doc = {
                    "tenant_id": tenant_id,
                    "sucursal_id": sucursal_id,
                    "sale_id": sid,
                    "sale_date": sale_date,
                    "producto_id": item.get("producto_id"),
                    "descripcion": item.get("descripcion", item.get("nombre")),
                    "cantidad": get_float("cantidad"),
                    "precio_unitario": get_float("precio_unitario"),
                    "subtotal": get_float("subtotal"),
                    "costo_unitario": get_float("costo_unitario"),
                    "descuento_unitario": get_float("descuento_unitario"),
                    "almacen_id": item.get("almacen_id", "default")
                }
                await db.sale_item_analytics.insert_one(analytics_doc)
            print(f"Created analytics for {sid}")
            
        caja_count = await db.caja_movimientos.count_documents({"sale_id": sid})
        if caja_count == 0:
            def get_float_sale(k):
                val = sale.get(k, 0)
                if val is None: return 0.0
                if hasattr(val, "to_decimal"): return float(val.to_decimal())
                return float(val)

            caja_doc = {
                "tenant_id": tenant_id,
                "sucursal_id": sucursal_id,
                "sesion_id": "HISTORICO",
                "cajero_id": "HISTORICO",
                "cajero_name": "IMPORTACION EXCEL",
                "subtipo": "VENTA_EFECTIVO",
                "tipo": "INGRESO",
                "monto": get_float_sale("total"),
                "descripcion": f"Venta Histórica #{str(sale.get('numero_ticket', sale['_id']))[-6:]}",
                "sale_id": sid,
                "fecha": sale_date,
                "created_at": sale_date
            }
            await db.caja_movimientos.insert_one(caja_doc)
            print(f"Created caja for {sid}")
            
if __name__ == '__main__':
    asyncio.run(fix_historical_sales())
