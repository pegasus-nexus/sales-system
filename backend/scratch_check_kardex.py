import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import InventoryLog, TipoMovimiento

async def test():
    await init_db()
    
    total = await InventoryLog.find_all().count()
    compras = await InventoryLog.find(InventoryLog.tipo_movimiento == TipoMovimiento.COMPRA).count()
    ventas = await InventoryLog.find(InventoryLog.tipo_movimiento == TipoMovimiento.VENTA).count()
    entradas = await InventoryLog.find(InventoryLog.tipo_movimiento == TipoMovimiento.ENTRADA_MANUAL).count()
    salidas = await InventoryLog.find(InventoryLog.tipo_movimiento == TipoMovimiento.SALIDA_MANUAL).count()
    ajustes = await InventoryLog.find(InventoryLog.tipo_movimiento == TipoMovimiento.AJUSTE_FISICO).count()
    traslados = await InventoryLog.find(InventoryLog.tipo_movimiento == TipoMovimiento.TRASLADO).count()
    
    print(f"Total InventoryLog: {total}")
    print(f"COMPRA: {compras}")
    print(f"VENTA: {ventas}")
    print(f"ENTRADA_MANUAL: {entradas}")
    print(f"SALIDA_MANUAL: {salidas}")
    print(f"AJUSTE_FISICO: {ajustes}")
    print(f"TRASLADO: {traslados}")
    
    # Check almacen_id distribution
    from collections import Counter
    all_logs = await InventoryLog.find_all().to_list()
    almacens = Counter(log.almacen_id for log in all_logs)
    print(f"\nAlmacen distribution: {dict(almacens)}")

asyncio.run(test())
