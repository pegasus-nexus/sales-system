import asyncio
import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    print("Conectando a MongoDB Atlas...")
    await init_db()
    db = await get_raw_db()
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    print("\n--- PASO 2 (REINTENTO): Reconstruyendo Ventas Crudas (Histórico) ---")
    try:
        df_hist = pd.read_csv('../exports/ventas_historicas_completo.csv', low_memory=False)
        
        # Limpiar numéricos ANTES de reemplazar con None
        df_hist['cantidad_vendida'] = pd.to_numeric(df_hist['cantidad_vendida'], errors='coerce').fillna(1.0)
        df_hist['monto_total_bs'] = pd.to_numeric(df_hist['monto_total_bs'], errors='coerce').fillna(0.0)
        
        # Limpiar NaNs en strings
        df_hist = df_hist.replace({np.nan: None})
        
        # Convertir fechas
        df_hist['fecha_transaccion'] = pd.to_datetime(df_hist['fecha_transaccion'], errors='coerce')
        df_hist = df_hist.dropna(subset=['fecha_transaccion'])
        
        docs_hist = []
        for _, row in df_hist.iterrows():
            fecha = row['fecha_transaccion'].to_pydatetime()
            docs_hist.append({
                "tenant_id": str(row.get('tenant_id', tenant_id)) if row.get('tenant_id') else tenant_id,
                "fecha_transaccion": fecha,
                "nombre_producto": str(row.get('nombre_producto', '')),
                "cantidad_vendida": float(row['cantidad_vendida']),
                "sucursal": str(row.get('sucursal', 'Heroinas')) if row.get('sucursal') else 'Heroinas',
                "monto_total_bs": float(row['monto_total_bs']),
                "original_sale_id": str(row.get('original_sale_id', '')) if row.get('original_sale_id') else None,
                "estado": str(row.get('estado', 'completado')) if row.get('estado') else 'completado'
            })
            
        if docs_hist:
            await db.ventas_historicas_crudas.delete_many({"tenant_id": tenant_id})
            # Insertar en lotes
            chunk_size = 5000
            for i in range(0, len(docs_hist), chunk_size):
                await db.ventas_historicas_crudas.insert_many(docs_hist[i:i+chunk_size])
            print(f"Ventas históricas reconstruidas: {len(docs_hist)} registros.")
    except Exception as e:
        print(f"Error en paso 2: {e}")

if __name__ == "__main__":
    asyncio.run(main())
