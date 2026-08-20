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
    
    print("\n--- PASO 1: Reconstruyendo Catálogo de Productos ---")
    try:
        df_pos = pd.read_csv('../exports/ventas_pos_detallado.csv')
        df_pos['precio_unitario'] = pd.to_numeric(df_pos['precio_unitario'], errors='coerce').fillna(0)
        df_pos['costo_unitario'] = pd.to_numeric(df_pos['costo_unitario'], errors='coerce').fillna(0)
        
        # Obtener los últimos precios y costos usados para cada producto
        df_pos = df_pos.sort_values('fecha', ascending=True)
        unique_products = df_pos.drop_duplicates(subset=['producto_id'], keep='last')
        
        products_to_insert = []
        for _, row in unique_products.iterrows():
            if pd.isna(row['producto_id']) or str(row['producto_id']).strip() == "":
                continue
                
            products_to_insert.append({
                "tenant_id": tenant_id,
                "name": str(row['producto']),
                "sku": str(row['producto_id']),
                "category_id": "General", 
                "price": float(row['precio_unitario']),
                "cost": float(row['costo_unitario']),
                "stock": 0,
                "is_active": True,
                "created_at": datetime.utcnow()
            })
            
        if products_to_insert:
            # Delete just in case
            await db.products.delete_many({"tenant_id": tenant_id})
            await db.products.insert_many(products_to_insert)
            print(f"Catálogo reconstruido: {len(products_to_insert)} productos insertados.")
    except Exception as e:
        print(f"Error en paso 1: {e}")

    print("\n--- PASO 2: Reconstruyendo Ventas Crudas (Histórico) ---")
    try:
        df_hist = pd.read_csv('../exports/ventas_historicas_completo.csv')
        # Limpiar NaNs
        df_hist = df_hist.replace({np.nan: None})
        
        # Convertir fechas
        df_hist['fecha_transaccion'] = pd.to_datetime(df_hist['fecha_transaccion'], errors='coerce')
        df_hist = df_hist.dropna(subset=['fecha_transaccion'])
        
        docs_hist = []
        for _, row in df_hist.iterrows():
            fecha = row['fecha_transaccion'].to_pydatetime()
            docs_hist.append({
                "tenant_id": str(row.get('tenant_id', tenant_id)),
                "fecha_transaccion": fecha,
                "nombre_producto": str(row.get('nombre_producto', '')),
                "cantidad_vendida": float(row.get('cantidad_vendida', 1)),
                "sucursal": str(row.get('sucursal', 'Heroinas')),
                "monto_total_bs": float(row.get('monto_total_bs', 0)),
                "original_sale_id": str(row.get('original_sale_id', '')) if row.get('original_sale_id') else None,
                "estado": str(row.get('estado', 'completado'))
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

    print("\n--- PASO 3: Reconstruyendo Ventas POS Agrupadas (Sales) ---")
    try:
        # Ya tenemos df_pos cargado, agrupar por sale_id
        df_pos['fecha'] = pd.to_datetime(df_pos['fecha'], errors='coerce')
        df_pos = df_pos.dropna(subset=['fecha'])
        df_pos = df_pos.replace({np.nan: None})
        
        grupos = df_pos.groupby('sale_id')
        sales_docs = []
        
        for sale_id, grupo in grupos:
            primera_fila = grupo.iloc[0]
            
            items = []
            for _, fila in grupo.iterrows():
                items.append({
                    "product_id": str(fila.get('producto_id', '')),
                    "product_name": str(fila.get('producto', '')),
                    "quantity": float(fila.get('cantidad', 1)),
                    "unit_price": float(fila.get('precio_unitario', 0)),
                    "subtotal": float(fila.get('subtotal_item', 0))
                })
                
            sales_docs.append({
                "tenant_id": tenant_id,
                "numero_ticket": str(sale_id),
                "sucursal_id": str(primera_fila.get('sucursal_id', '')),
                "created_at": primera_fila['fecha'].to_pydatetime(),
                "total": float(primera_fila.get('total_venta', 0)),
                "anulada": bool(primera_fila.get('anulada', False)),
                "cajero": str(primera_fila.get('cajero', '')),
                "metodos_pago": str(primera_fila.get('metodos_pago', 'Efectivo')),
                "items": items
            })
            
        if sales_docs:
            await db.sales.delete_many({"tenant_id": tenant_id})
            chunk_size = 5000
            for i in range(0, len(sales_docs), chunk_size):
                await db.sales.insert_many(sales_docs[i:i+chunk_size])
            print(f"Ventas POS reconstruidas: {len(sales_docs)} tickets de venta únicos.")
    except Exception as e:
        print(f"Error en paso 3: {e}")

    print("\n--- PASO 4: Inyectando las ventas del 20 de Julio al 2 de Agosto ---")
    try:
        f = '../plan_implementations/2026_Heroinas.xlsx'
        df_excel = pd.read_excel(f)
        df_excel = df_excel.dropna(how='all')
        
        docs_excel = []
        for idx, row in df_excel.iterrows():
            monto = 0.0
            if "TOTAL" in row and pd.notnull(row["TOTAL"]):
                monto = float(row["TOTAL"])
            elif "VENTA NETA" in row and pd.notnull(row["VENTA NETA"]):
                monto = float(row["VENTA NETA"])
                
            cantidad = 1.0
            if "CANTIDAD" in row and pd.notnull(row["CANTIDAD"]):
                cantidad = float(row["CANTIDAD"])
                
            nombre_prod = "Desconocido"
            if "DESCRIPCION" in row and pd.notnull(row["DESCRIPCION"]):
                nombre_prod = str(row["DESCRIPCION"]).strip()
                
            fecha_val = None
            if "FECHA.1" in row and pd.notnull(row["FECHA.1"]):
                fecha_val = row["FECHA.1"]
            elif "FECHA" in row and pd.notnull(row["FECHA"]):
                fecha_val = row["FECHA"]
                
            fecha_final = None
            if isinstance(fecha_val, datetime):
                fecha_final = fecha_val
            elif pd.notnull(fecha_val):
                try:
                    fecha_final = pd.to_datetime(fecha_val)
                except:
                    pass
                    
            if not fecha_final:
                continue
                
            if isinstance(fecha_final, pd.Timestamp):
                fecha_final = fecha_final.to_pydatetime()
            if fecha_final.tzinfo is not None:
                fecha_final = fecha_final.replace(tzinfo=None)
                
            # Solo agregar si es posterior al 20 de julio
            if fecha_final > datetime(2026, 7, 20):
                docs_excel.append({
                    "tenant_id": tenant_id,
                    "sucursal": "Heroinas",
                    "fecha_transaccion": fecha_final,
                    "monto_total_bs": monto,
                    "cantidad_vendida": cantidad,
                    "nombre_producto": nombre_prod,
                    "estado": "completado"
                })
                
        if docs_excel:
            await db.ventas_historicas_crudas.insert_many(docs_excel)
            print(f"Añadidas {len(docs_excel)} ventas del Excel (20 Julio al 2 de Agosto).")
        else:
            print("No se encontraron ventas nuevas en el Excel después del 20 de Julio.")
    except Exception as e:
        print(f"Error en paso 4: {e}")

    print("\n>>> RESTAURACIÓN COMPLETA FINALIZADA <<<")

if __name__ == "__main__":
    asyncio.run(main())
