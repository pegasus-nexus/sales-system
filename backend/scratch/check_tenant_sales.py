import asyncio
from datetime import datetime
import pandas as pd
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def test():
    await init_db()
    db = await get_raw_db()
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    start_utc = datetime.strptime("2026-06-01 04:00:00", "%Y-%m-%d %H:%M:%S")
    end_utc = datetime.strptime("2026-06-08 04:00:00", "%Y-%m-%d %H:%M:%S")
    
    filtro = {
        "fecha_transaccion": {
            "$gte": start_utc,
            "$lt": end_utc
        },
        "tenant_id": tenant_id
    }
    
    cursor = db.ventas_historicas_crudas.find(filtro)
    datos = await cursor.to_list(length=None)
    
    df = pd.DataFrame(datos)
    if df.empty:
        print("No hay datos")
        return
        
    df['monto_total_bs'] = pd.to_numeric(df['monto_total_bs'], errors='coerce').fillna(0)
    
    if 'estado' in df.columns:
        df = df[df['estado'].str.lower() != 'anulado']
        
    if 'sucursal' in df.columns:
        bad_keywords = ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista"]
        df = df[~df['sucursal'].str.lower().str.contains('|'.join(bad_keywords), na=False)]
        
    print(f"Resultados de base de datos filtrando por tenant_id = {tenant_id}:")
    print(f"Total Ingresos Limpios: {df['monto_total_bs'].sum()}")
    print(f"Total Tickets Limpios: {len(df)}")
    
    print("\nDesglose por Sucursal para este Tenant:")
    gr = df.groupby('sucursal').agg(
        ingresos=('monto_total_bs', 'sum'),
        tickets=('monto_total_bs', 'count')
    )
    print(gr)

if __name__ == "__main__":
    asyncio.run(test())
