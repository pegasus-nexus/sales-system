import asyncio
import os
import sys
from decimal import Decimal

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.infrastructure.db import init_db
from app.domain.models.sale import Sale
from app.domain.models.credito import Deuda, TransaccionCredito
from app.domain.models.caja import CajaMovimiento

async def main():
    await init_db()
    
    # Let's search for sales with total 424 or around 424 created today (May 19/20 UTC, since Bolivia is -4)
    # Bolivia date May 19
    sales = await Sale.find(
        Sale.total == Decimal("424.00")
    ).to_list()
    
    print(f"Found {len(sales)} sales with total 424.00:")
    for sale in sales:
        print(f"ID: {sale.id}")
        print(f"  Sucursal: {sale.sucursal_id}")
        print(f"  Total: {sale.total}")
        print(f"  Subtotal: {sale.subtotal}")
        print(f"  Cliente: {sale.cliente.razon_social if sale.cliente else 'N/A'}")
        print(f"  Created At: {sale.created_at}")
        print(f"  Anulada: {sale.anulada}")
        print(f"  Pagos: {[(p.metodo, p.monto) for p in sale.pagos]}")
        print(f"  Items: {[(i.descripcion, i.cantidad, i.precio_unitario, i.subtotal) for i in sale.items]}")
        
        # Let's also check related credit records
        deudas = await Deuda.find(Deuda.venta_id == str(sale.id)).to_list()
        print(f"  Deudas asociadas: {len(deudas)}")
        for d in deudas:
            print(f"    Deuda ID: {d.id}, Monto Original: {d.monto_original}, Saldo Pendiente: {d.saldo_pendiente}")
            
        txs = await TransaccionCredito.find(TransaccionCredito.venta_id == str(sale.id)).to_list()
        print(f"  Transacciones Credito asociadas: {len(txs)}")
        for tx in txs:
            print(f"    Tx ID: {tx.id}, Monto: {tx.monto}, Tipo: {tx.tipo}")
            
        caja_movs = await CajaMovimiento.find(CajaMovimiento.referencia_id == str(sale.id)).to_list()
        print(f"  Movimientos de caja asociados: {len(caja_movs)}")
        for cm in caja_movs:
            print(f"    Caja Mov ID: {cm.id}, Monto: {cm.monto}, Subtipo: {cm.subtipo}")

if __name__ == "__main__":
    asyncio.run(main())
