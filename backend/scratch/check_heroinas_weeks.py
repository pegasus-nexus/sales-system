import asyncio
from datetime import datetime, timedelta
import pandas as pd
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def test():
    await init_db()
    db = await get_raw_db()
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # Rango para todo junio 2026
    start_utc = datetime(2026, 6, 1, 0, 0, 0)
    end_utc = datetime(2026, 7, 1, 0, 0, 0)
    
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
        
    # Excluir sucursales basura
    bad_keywords = ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista"]
    df = df[~df['sucursal'].str.lower().str.contains('|'.join(bad_keywords), na=False)]
    
    # 1. Agrupamiento por semana lunes-domingo de todas las sucursales
    print("--- Agrupamiento Semanal para TODAS las sucursales ---")
    df['semana_key'] = df['fecha_local'].apply(lambda d: d - timedelta(days=d.weekday()))
    df['semana_key_str'] = df['semana_key'].dt.strftime('%Y-%m-%d')
    
    gr_all = df.groupby('semana_key_str').agg(
        ingresos=('monto_total_bs', 'sum'),
        tickets=('monto_total_bs', 'count')
    )
    print(gr_all)
    print(f"Promedio semanal de semanas con ventas: {gr_all['ingresos'].mean():.2f}")
    
    # 2. Agrupamiento por semana lunes-domingo solo para Heroínas
    print("\n--- Agrupamiento Semanal solo para HEROÍNAS ---")
    df_hero = df[df['sucursal'].str.lower().str.contains('heroinas|heroína', na=False)]
    gr_hero = df_hero.groupby('semana_key_str').agg(
        ingresos=('monto_total_bs', 'sum'),
        tickets=('monto_total_bs', 'count')
    )
    print(gr_hero)
    print(f"Promedio semanal Heroínas: {gr_hero['ingresos'].mean():.2f}")
    
    # 3. Agrupamiento por semana lunes-domingo para Heroínas + Calacoto
    print("\n--- Agrupamiento Semanal Heroínas + Calacoto ---")
    df_hc = df[df['sucursal'].str.lower().str.contains('heroinas|heroína|calacoto', na=False)]
    gr_hc = df_hc.groupby('semana_key_str').agg(
        ingresos=('monto_total_bs', 'sum'),
        tickets=('monto_total_bs', 'count')
    )
    print(gr_hc)
    print(f"Promedio semanal Heroínas + Calacoto: {gr_hc['ingresos'].mean():.2f}")

if __name__ == "__main__":
    asyncio.run(test())
