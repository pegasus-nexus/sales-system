import asyncio
import os
import sys
from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo
import pandas as pd
from pymongo import UpdateOne
from motor.motor_asyncio import AsyncIOMotorClient

# Add backend directory to path
sys.path.insert(0, r"c:\Users\dell\OneDrive\Desktop\SalesSystem\backend")

from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def import_facts():
    excel_path = r"C:\Users\dell\OneDrive\Desktop\SalesSystem\Tabla_de_Hechos_BI.xlsx"
    if not os.path.exists(excel_path):
        print(f"Error: No se encontró el archivo {excel_path}")
        return

    print(f"Leyendo archivo Excel: {excel_path}...")
    df = pd.read_excel(excel_path, sheet_name="Datos_Crudos")
    print(f"Filas totales crudas: {len(df)}")

    # 1. Deduplicación estricta para evitar bloques duplicados del Excel
    df_dedup = df.drop_duplicates(subset=[
        'fecha_transaccion', 'sucursal', 'nombre_producto', 'cantidad_vendida', 'monto_total_bs'
    ]).copy()
    print(f"Filas únicas tras deduplicación: {len(df_dedup)}")

    # 2. Parseo y normalización de fechas y montos
    df_dedup['dt_parsed'] = pd.to_datetime(df_dedup['fecha_transaccion'], errors='coerce')
    df_dedup = df_dedup[df_dedup['dt_parsed'].notna()].copy()
    df_dedup['monto_total_bs'] = pd.to_numeric(df_dedup['monto_total_bs'], errors='coerce').fillna(0.0)
    df_dedup['cantidad_vendida'] = pd.to_numeric(df_dedup['cantidad_vendida'], errors='coerce').fillna(1.0)

    # 3. Conexión a MongoDB local
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["salessystem"]

    # 4. Agrupación por ticket / transacción (fecha_transaccion + sucursal)
    print("Agrupando transacciones...")
    tickets_dict = {}

    for _, row in df_dedup.iterrows():
        dt_raw = row['dt_parsed']
        sucursal = str(row['sucursal']).strip() if pd.notna(row['sucursal']) else "CENTRAL"
        t_id = str(row['tenant_id']).strip() if (pd.notna(row['tenant_id']) and str(row['tenant_id']).lower() != 'nan') else "test-taboada"

        # Localizar a hora de Bolivia y convertir a UTC
        if dt_raw.tzinfo is None:
            dt_local = dt_raw.replace(tzinfo=BOLIVIA_TZ)
        else:
            dt_local = dt_raw.astimezone(BOLIVIA_TZ)

        dt_utc = dt_local.astimezone(ZoneInfo("UTC"))
        fecha_bolivia_str = dt_local.strftime("%Y-%m-%d")
        ticket_key = f"{dt_local.strftime('%Y-%m-%d %H:%M:%S')}_{sucursal}"

        prod_nombre = str(row['nombre_producto']).strip() if pd.notna(row['nombre_producto']) else "Producto Histórico"
        qty = float(row['cantidad_vendida'])
        monto = float(row['monto_total_bs'])
        precio_u = round(monto / qty, 2) if qty > 0 else monto

        item_obj = {
            "producto_id": "HIST",
            "nombre": prod_nombre,
            "cantidad": qty,
            "precio_unitario": precio_u,
            "subtotal": monto
        }

        if ticket_key not in tickets_dict:
            tickets_dict[ticket_key] = {
                "numero_ticket": f"HIST-{ticket_key}",
                "created_at": dt_utc,
                "fecha_bolivia": fecha_bolivia_str,
                "sucursal_id": sucursal,
                "tenant_id": t_id,
                "total": 0.0,
                "anulada": False,
                "items": [],
                "cajero_id": "HISTORICO",
                "cajero_name": "Carga Histórica BI"
            }

        tickets_dict[ticket_key]["items"].append(item_obj)
        tickets_dict[ticket_key]["total"] = round(tickets_dict[ticket_key]["total"] + monto, 2)

    tickets_list = list(tickets_dict.values())
    print(f"Total tickets consolidados listos para inserción: {len(tickets_list)}")

    # 5. Bulk Upsert por lotes de 1000
    CHUNK_SIZE = 1000
    total_upserted = 0
    total_modified = 0

    print(f"Iniciando inserción en chunks de {CHUNK_SIZE}...")
    for i in range(0, len(tickets_list), CHUNK_SIZE):
        chunk = tickets_list[i:i+CHUNK_SIZE]
        ops = []
        for reg in chunk:
            op = UpdateOne(
                {"numero_ticket": reg["numero_ticket"]},
                {"$set": reg},
                upsert=True
            )
            ops.append(op)

        if ops:
            res = await db.sales.bulk_write(ops)
            total_upserted += res.upserted_count
            total_modified += res.modified_count
            print(f"  Procesados {min(i+CHUNK_SIZE, len(tickets_list))}/{len(tickets_list)} (Upserted: {res.upserted_count}, Modified: {res.modified_count})")

    print("\n=== IMPORTACIÓN HISTÓRICA COMPLETADA CON ÉXITO ===")
    print(f"Total upserted: {total_upserted}, Total modified: {total_modified}")

    # Verificación de fechas clave
    print("\n--- Verificación en BD local post-importación ---")
    
    # 2024-09-27
    s24 = await db.sales.find({"fecha_bolivia": "2024-09-27", "anulada": {"$ne": True}}).to_list(length=None)
    tot24 = sum(float(s.get("total", 0)) for s in s24)
    print(f"👉 Viernes 27 Sept 2024: {len(s24)} tickets | Total: Bs. {tot24:.2f}")
    for s in s24:
        print(f"   - {s.get('sucursal_id')}: Bs. {s.get('total')}")

    # 2025-09-26
    s25 = await db.sales.find({"fecha_bolivia": "2025-09-26", "anulada": {"$ne": True}}).to_list(length=None)
    tot25 = sum(float(s.get("total", 0)) for s in s25)
    print(f"👉 Viernes 26 Sept 2025: {len(s25)} tickets | Total: Bs. {tot25:.2f}")
    for s in s25:
        print(f"   - {s.get('sucursal_id')}: Bs. {s.get('total')}")

if __name__ == "__main__":
    asyncio.run(import_facts())
