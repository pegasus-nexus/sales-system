import asyncio
from datetime import datetime, timedelta
import pandas as pd
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def test():
    await init_db()
    db = await get_raw_db()
    
    # Cargar todas las ventas de junio 2026
    start_utc = datetime(2026, 5, 20)
    end_utc = datetime(2026, 7, 10)
    
    cursor = db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_utc, "$lte": end_utc}
    })
    datos = await cursor.to_list(length=None)
    
    df = pd.DataFrame(datos)
    df['fecha_transaccion'] = pd.to_datetime(df['fecha_transaccion'], utc=True)
    df['monto_total_bs'] = pd.to_numeric(df['monto_total_bs'], errors='coerce').fillna(0)
    df['fecha_local'] = df['fecha_transaccion'].dt.tz_convert('America/La_Paz')
    df['fecha_str'] = df['fecha_local'].dt.strftime('%Y-%m-%d')
    
    # Filtrar anulados
    if 'estado' in df.columns:
        df = df[df['estado'].str.lower() != 'anulado']
        
    print("Buscando rangos de 7 días consecutivos que sumen ~16840 o tengan ~527 tickets...")
    
    # Obtener lista de fechas únicas ordenadas
    fechas = sorted(df['fecha_str'].unique())
    
    # Probar diferentes combinaciones de sucursales:
    # 1. Todas las sucursales (con y sin exclusión de distribución)
    # 2. Solo Heroínas, Calacoto, Recoleta, etc.
    
    sucursales_sets = {
        "Todas (limpias)": lambda d: d[~d['sucursal'].str.lower().str.contains('dsitribucion|distribucion|distribución|fexco|vendedores|sucre|mayorista', na=False)],
        "Todas (incluyendo dsitribucion)": lambda d: d[~d['sucursal'].str.lower().str.contains('fexco|vendedores|sucre|mayorista', na=False)],
        "Solo Heroínas": lambda d: d[d['sucursal'].str.lower().str.contains('heroinas|heroína', na=False)],
        "Heroínas + Recoleta": lambda d: d[d['sucursal'].str.lower().str.contains('heroinas|heroína|recoleta', na=False)],
        "Heroínas + Calacoto": lambda d: d[d['sucursal'].str.lower().str.contains('heroinas|heroína|calacoto', na=False)],
    }
    
    for label, filter_func in sucursales_sets.items():
        df_sub = filter_func(df.copy())
        if df_sub.empty:
            continue
            
        # Agrupar por día
        daily = df_sub.groupby('fecha_str').agg(
            ingresos=('monto_total_bs', 'sum'),
            tickets=('monto_total_bs', 'count')
        ).reindex(fechas, fill_value=0).reset_index()
        
        # Ventanas de 7 días
        for i in range(len(daily) - 6):
            window = daily.iloc[i:i+7]
            sum_ing = window['ingresos'].sum()
            sum_tkt = window['tickets'].sum()
            start_w = window.iloc[0]['fecha_str']
            end_w = window.iloc[-1]['fecha_str']
            
            # Si se parece a los números del usuario (ingresos +- 500, tickets +- 20)
            if abs(sum_ing - 16840) < 500 or abs(sum_tkt - 527) < 20:
                print(f"[{label}] Rango: {start_w} al {end_w} | Ingresos: {sum_ing:.2f} | Tickets: {sum_tkt}")

if __name__ == "__main__":
    asyncio.run(test())
