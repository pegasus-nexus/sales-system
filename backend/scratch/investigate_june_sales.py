import asyncio
from datetime import datetime
import pandas as pd
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def test():
    await init_db()
    db = await get_raw_db()
    
    # Vamos a buscar en la base de datos qué días de junio sumados dan 16840.00 o 527 tickets,
    # o si hay algún filtro de sucursal o estado que resulte en esos números exactos.
    
    start_utc = datetime.strptime("2026-06-01 00:00:00", "%Y-%m-%d %H:%M:%S")
    end_utc = datetime.strptime("2026-06-30 23:59:59", "%Y-%m-%d %H:%M:%S")
    
    cursor = db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_utc, "$lte": end_utc}
    })
    datos = await cursor.to_list(length=None)
    
    df = pd.DataFrame(datos)
    df['fecha_transaccion'] = pd.to_datetime(df['fecha_transaccion'], utc=True)
    df['monto_total_bs'] = pd.to_numeric(df['monto_total_bs'], errors='coerce').fillna(0)
    df['fecha_local'] = df['fecha_transaccion'].dt.tz_convert('America/La_Paz')
    
    # 1. Agrupado por día local en junio
    df['fecha_str'] = df['fecha_local'].dt.strftime('%Y-%m-%d')
    
    print("Ventas por día local de junio (todos los estados, todas las sucursales):")
    for date_str, group in df.groupby('fecha_str'):
        print(f"  {date_str}: ingresos={group['monto_total_bs'].sum()}, tickets={len(group)}")
        
    print("\nDesglose por sucursal en junio:")
    for suc, group in df.groupby('sucursal'):
        print(f"  {suc}: ingresos={group['monto_total_bs'].sum()}, tickets={len(group)}")

if __name__ == "__main__":
    asyncio.run(test())
