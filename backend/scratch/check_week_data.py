import asyncio
import pandas as pd
from datetime import datetime
from app.db import get_raw_db

async def test():
    from app.infrastructure.db import init_db
    await init_db()
    db = await get_raw_db()
    
    # Rango de fechas local de Bolivia para la semana 1
    # 2026-06-01T00:00:00-04:00 a 2026-06-07T23:59:59-04:00
    # En UTC: 2026-06-01 04:00:00 a 2026-06-08 04:00:00
    start_utc = datetime.strptime("2026-06-01 04:00:00", "%Y-%m-%d %H:%M:%S")
    end_utc = datetime.strptime("2026-06-08 04:00:00", "%Y-%m-%d %H:%M:%S")
    
    filtro = {
        "fecha_transaccion": {
            "$gte": start_utc,
            "$lt": end_utc
        }
    }
    
    cursor = db.ventas_historicas_crudas.find(filtro)
    datos = await cursor.to_list(length=None)
    
    print(f"Total registros en DB para la semana en UTC: {len(datos)}")
    
    df = pd.DataFrame(datos)
    if df.empty:
        print("No hay datos")
        return
        
    df['fecha_transaccion'] = pd.to_datetime(df['fecha_transaccion'], utc=True)
    df['monto_total_bs'] = pd.to_numeric(df['monto_total_bs'], errors='coerce').fillna(0)
    
    # Filtro de estados
    if 'estado' in df.columns:
        df = df[df['estado'].str.lower() != 'anulado']
        
    # Filtro sucursales basura
    if 'sucursal' in df.columns:
        bad_keywords = ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista"]
        df = df[~df['sucursal'].str.lower().str.contains('|'.join(bad_keywords), na=False)]
        
    df['fecha_local'] = df['fecha_transaccion'].dt.tz_convert('America/La_Paz')
    
    print(f"Registros despues de limpiar sucursales/estados: {len(df)}")
    print(f"Suma total ingresos: {df['monto_total_bs'].sum()}")
    print(f"Tickets total: {len(df)}")
    
    # Agrupado por sucursal
    gr = df.groupby('sucursal').agg(
        ingresos=('monto_total_bs', 'sum'),
        tickets=('monto_total_bs', 'count')
    )
    print("\nDesglose por sucursal:")
    print(gr)

if __name__ == "__main__":
    asyncio.run(test())
