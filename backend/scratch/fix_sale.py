import asyncio
import os
import sys
from decimal import Decimal
from bson import ObjectId

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.infrastructure.db import init_db
from app.domain.models.sale import Sale
from app.domain.models.credito import Deuda, TransaccionCredito, CuentaCredito

async def main():
    await init_db()
    
    sale_id = "664a784d0089e925deff8cfb"
    sale = await Sale.get(sale_id)
    if not sale:
        print("Sale not found!")
        return

    print("BEFORE UPDATE:")
    print(f"Sale Total: {sale.total}")
    print(f"Sale Pagos: {[(p.metodo, p.monto) for p in sale.pagos]}")
    
    # 1. Update Sale
    sale.total = Decimal("423.90")
    if sale.pagos and len(sale.pagos) > 0:
        sale.pagos[0].monto = Decimal("423.90")
    await sale.save()
    print("Updated Sale successfully.")
    
    # 2. Update Deuda
    # The search_sale.py returned Deuda ID: 664a784d0089e925deff8cfc
    deuda = await Deuda.get("664a784d0089e925deff8cfc")
    if deuda:
        print(f"Deuda Original Monto: {deuda.monto_original}, Saldo Pendiente: {deuda.saldo_pendiente}")
        deuda.monto_original = Decimal("423.90")
        deuda.saldo_pendiente = Decimal("423.90")
        await deuda.save()
        print("Updated Deuda successfully.")
        
        # 3. Update CuentaCredito
        cuenta = await CuentaCredito.get(deuda.cuenta_id)
        if cuenta:
            print(f"CuentaCredito ID: {cuenta.id}, Saldo Total antes: {cuenta.saldo_total}")
            cuenta.saldo_total = cuenta.saldo_total - Decimal("0.10")
            await cuenta.save()
            print(f"CuentaCredito Saldo Total después: {cuenta.saldo_total}")
        else:
            print("CuentaCredito not found for deuda!")
    else:
        print("Deuda not found!")

    # 4. Update TransaccionCredito
    # The search_sale.py returned Tx ID: 664a784d0089e925deff8cfd
    tx = await TransaccionCredito.get("664a784d0089e925deff8cfd")
    if tx:
        print(f"TransaccionCredito Original Monto: {tx.monto}")
        tx.monto = Decimal("423.90")
        await tx.save()
        print("Updated TransaccionCredito successfully.")
    else:
        print("TransaccionCredito not found!")

    print("\nAFTER UPDATE VERIFICATION:")
    updated_sale = await Sale.get(sale_id)
    print(f"Sale Total: {updated_sale.total}")
    print(f"Sale Pagos: {[(p.metodo, p.monto) for p in updated_sale.pagos]}")
    
    updated_deuda = await Deuda.get("664a784d0089e925deff8cfc")
    if updated_deuda:
        print(f"Deuda Monto Original: {updated_deuda.monto_original}, Saldo Pendiente: {updated_deuda.saldo_pendiente}")
    
    updated_tx = await TransaccionCredito.get("664a784d0089e925deff8cfd")
    if updated_tx:
        print(f"TransaccionCredito Monto: {updated_tx.monto}")

if __name__ == "__main__":
    asyncio.run(main())
