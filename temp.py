import asyncio
from datetime import datetime

f = open('backend/app/application/services/sales_service.py', 'r', encoding='utf-8')
c = f.read()
f.close()

idx = c.find('    @staticmethod\n    async def create_sale')
if idx != -1:
    method = '''    @staticmethod
    async def update_sale_date(tenant_id: str, sale_id: str, nueva_fecha: datetime, current_user: User):
        from fastapi import HTTPException
        from app.infrastructure.db import get_client
        sale = await Sale.get(sale_id)
        if not sale or sale.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Venta no encontrada")
        
        client = get_client()
        async with await client.start_session() as session:
            async with session.start_transaction():
                sale.created_at = nueva_fecha
                await sale.save(session=session)
                
                await SaleItemAnalytics.find(SaleItemAnalytics.sale_id == sale_id, session=session).update({"": {"sale_date": nueva_fecha}}, session=session)
                
                await InventoryLog.find(InventoryLog.referencia_id == sale_id, session=session).update({"": {"created_at": nueva_fecha}}, session=session)
                
                await CajaMovimiento.find(CajaMovimiento.sale_id == sale_id, session=session).update({"": {"fecha": nueva_fecha, "created_at": nueva_fecha}}, session=session)
                
        return sale

'''
    c = c[:idx] + method + c[idx:]
    with open('backend/app/application/services/sales_service.py', 'w', encoding='utf-8') as fw:
        fw.write(c)
