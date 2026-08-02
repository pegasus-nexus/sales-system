import asyncio
import os
import sys
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    print("Conectando a base de datos...")
    await init_db()
    db = await get_raw_db()
    
    # We will hardcode the default tenant
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    files = [
        "plan_implementations/2024_Heroinas.xlsx",
        "plan_implementations/2025_Heroinas.xlsx",
        "plan_implementations/2026_Heroinas.xlsx"
    ]
    
    for f in files:
        print(f"\nProcesando archivo {f}...")
        try:
            df = pd.read_excel(f)
            # Limpieza básica
            df = df.dropna(how='all')
            
            docs_to_insert = []
            
            for idx, row in df.iterrows():
                # Extraer monto
                monto = 0.0
                if "TOTAL" in row and pd.notnull(row["TOTAL"]):
                    monto = float(row["TOTAL"])
                elif "VENTA NETA" in row and pd.notnull(row["VENTA NETA"]):
                    monto = float(row["VENTA NETA"])
                
                # Extraer cantidad
                cantidad = 1.0
                if "CANTIDAD" in row and pd.notnull(row["CANTIDAD"]):
                    cantidad = float(row["CANTIDAD"])
                    
                # Extraer producto
                nombre_prod = "Desconocido"
                if "DESCRIPCION" in row and pd.notnull(row["DESCRIPCION"]):
                    nombre_prod = str(row["DESCRIPCION"]).strip()
                    
                # Ensamblar fecha
                fecha_final = None
                
                # Si hay columna FECHA.1 o FECHA
                fecha_val = None
                if "FECHA.1" in row and pd.notnull(row["FECHA.1"]):
                    fecha_val = row["FECHA.1"]
                elif "FECHA" in row and pd.notnull(row["FECHA"]):
                    fecha_val = row["FECHA"]
                    
                if isinstance(fecha_val, datetime):
                    fecha_final = fecha_val
                elif pd.notnull(fecha_val):
                    try:
                        fecha_final = pd.to_datetime(fecha_val)
                    except:
                        pass
                
                if not fecha_final:
                    # Intentar por AÑO, MES, DIA, HORA
                    try:
                        y = int(row.get("AÑO", 2026))
                        m = int(row.get("MES", 1))
                        d = int(row.get("DIA", 1))
                        
                        hora_str = str(row.get("HORA", "12:00:00"))
                        if ":" in hora_str:
                            hr = int(hora_str.split(":")[0])
                            mn = int(hora_str.split(":")[1])
                        else:
                            hr, mn = 12, 0
                            
                        fecha_final = datetime(y, m, d, hr, mn, 0)
                    except:
                        pass
                        
                if not fecha_final:
                    continue # Saltar filas sin fecha
                
                # Convertir a pydatetime si es timestamp
                if isinstance(fecha_final, pd.Timestamp):
                    fecha_final = fecha_final.to_pydatetime()
                    
                # Limpiar a naive datetime para evitar problemas en MongoDB
                if fecha_final.tzinfo is not None:
                    fecha_final = fecha_final.replace(tzinfo=None)
                    
                doc = {
                    "tenant_id": tenant_id,
                    "sucursal": "Heroinas",
                    "fecha_transaccion": fecha_final,
                    "monto_total_bs": monto,
                    "cantidad_vendida": cantidad,
                    "nombre_producto": nombre_prod,
                    "estado": "completado"
                }
                docs_to_insert.append(doc)
                
            if docs_to_insert:
                print(f"Insertando {len(docs_to_insert)} registros...")
                await db.ventas_historicas_crudas.insert_many(docs_to_insert)
                print("Inserción exitosa.")
            else:
                print("No se encontraron registros válidos para insertar.")
                
        except Exception as e:
            print(f"Error procesando {f}: {e}")
            
    print("\nProceso finalizado.")

if __name__ == "__main__":
    asyncio.run(main())
