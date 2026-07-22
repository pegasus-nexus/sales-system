import asyncio
from datetime import datetime, timedelta
import pandas as pd
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def test():
    await init_db()
    db = await get_raw_db()
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # Rango de Mayo y Abril
    start_utc = datetime(2026, 4, 1, 0, 0, 0)
    end_utc = datetime(2026, 6, 1, 0, 0, 0)
    
    filtro = {
        "fecha_transaccion": {"$gte": start_utc, "$lt": end_utc},
        "tenant_id": tenant_id
    }
    
    cursor = db.ventas_historicas_crudas.find(filtro)
    datos = await cursor.to_list(length=None)
    
    df = pd.DataFrame(datos)
    df['monto_total_bs'] = pd.to_numeric(df['monto_total_bs'], errors='coerce').fillna(0)
    df['fecha_transaccion'] = pd.to_datetime(df['fecha_transaccion'], utc=True)
    df['fecha_local'] = df['fecha_transaccion'].dt.tz_convert('America/La_Paz')
    
    if 'estado' in df.columns:
        df = df[df['estado'].str.lower() != 'anulado']
        
    bad_keywords = ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista"]
    df = df[~df['sucursal'].str.lower().str.contains('|'.join(bad_keywords), na=False)]
    
    df['mes'] = df['fecha_local'].dt.strftime('%Y-%m')
    df['semana_key'] = df['fecha_local'].apply(lambda d: d - timedelta(days=d.weekday()))
    df['semana_key_str'] = df['semana_key'].dt.strftime('%Y-%m-%d')
    
    for mes, group in df.groupby('mes'):
        print(f"\n=== Mes: {mes} ===")
        gr = group.groupby('semana_key_str').agg(
            ingresos=('monto_total_bs', 'sum'),
            tickets=('monto_total_bs', 'count')
        )
        print(gr)
        print(f"Promedio semanal (con ceros excluidos): {gr['ingresos'].mean():.2f}")
        # Promedio incluyendo semanas sin ventas si existiesen
        # total de semanas en el mes
        y_m = mes.split('-')
        last_day = pd.Timestamp(int(y_m[0]), int(y_m[1]), 1) + pd.offsets.MonthEnd(0)
        num_weeks = int(last_day.day / 7)
        print(f"Promedio semanal estimado en 5 semanas: {gr['ingresos'].sum() / 5:.2f}")

if __name__ == "__main__":
    asyncio.run(test())
