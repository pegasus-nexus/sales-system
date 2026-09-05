import asyncio
import pandas as pd
import datetime
from bson.objectid import ObjectId
from app.db import get_raw_db

async def test_etl():
    print("Testing ETL simulation locally")
    
    # 1. Create a dummy dataframe
    data = {
        'FECHA': ['2026-08-31 10:00:00', '2026-08-31 10:00:00', '2026-08-31 11:00:00'],
        'S/N': ['PROD1', 'PROD2', 'PROD3'],
        'DESCRIPCION': ['Item A', 'Item B', 'Item C'],
        'CANTIDAD': [2, 1, 3],
        'PRECIO UNITARIO': [10.0, 15.0, 5.0],
        'TOTAL': [20.0, 15.0, 15.0]
    }
    df = pd.DataFrame(data)
    
    # 2. Transform logic
    df['FECHA'] = pd.to_datetime(df['FECHA'], errors='coerce')
    grupos = df.groupby('FECHA')
    
    registros = []
    for fecha, grupo in grupos:
        numero_ticket = str(fecha)
        created_at = pd.to_datetime(fecha)
        total_ticket = round(grupo['TOTAL'].astype(float).sum(), 2)
        
        items = []
        for _, fila in grupo.iterrows():
            items.append({
                "producto_id": str(fila['S/N']),
                "nombre": str(fila['DESCRIPCION']),
                "cantidad": float(fila['CANTIDAD']),
                "precio_unitario": float(fila['PRECIO UNITARIO']),
                "subtotal": float(fila['TOTAL'])
            })
            
        registro = {
            "numero_ticket": numero_ticket,
            "created_at": created_at,
            "sucursal_id": "SUC_TEST",
            "tenant_id": "TENANT_TEST",
            "total": total_ticket,
            "items": items,
        }
        registros.append(registro)
        
    print(f"Grouped into {len(registros)} tickets")
    assert len(registros) == 2, "Should group into 2 tickets"
    
    print("Test passed.")

if __name__ == '__main__':
    asyncio.run(test_etl())
