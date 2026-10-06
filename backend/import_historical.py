import asyncio
import sys
import os
import pandas as pd
import unicodedata
from datetime import datetime
from pymongo import UpdateOne, InsertOne
from bson.objectid import ObjectId

sys.path.append(os.getcwd())
from app.infrastructure.db import init_db
from app.domain.models.sale import Sale
from app.domain.models.sucursal import Sucursal

def safe_num(v, default=0.0):
    try:
        if pd.isna(v): return float(default)
        return float(v)
    except:
        return float(default)

async def import_file(file_path, tenant_id, sucursal_id):
    print(f"Importing {file_path}...")
    df = pd.read_excel(file_path)
    # clean columns
    df.columns = [unicodedata.normalize('NFKD', str(c)).encode('ASCII', 'ignore').decode('utf-8').upper().replace(' ', '_').replace('.', '') for c in df.columns]
    
    grupos_tickets = {}
    
    for idx, row in df.iterrows():
        f_val = row.get("FECHA")
        if pd.isna(f_val):
            continue
            
        if hasattr(f_val, "strftime"):
            numero_ticket = f_val.strftime("%Y-%m-%d %H:%M:%S")
            created_at = f_val.to_pydatetime() if hasattr(f_val, "to_pydatetime") else f_val
        else:
            numero_ticket = str(f_val)
            try:
                created_at = pd.to_datetime(f_val).to_pydatetime()
            except:
                continue

        p_cant = safe_num(row.get("CANTIDAD"), default=1.0)
        p_precio = safe_num(row.get("PRECIO_UNITARIO"), default=0.0)
        
        if numero_ticket not in grupos_tickets:
            grupos_tickets[numero_ticket] = {
                "numero_ticket": numero_ticket,
                "created_at": created_at,
                "sucursal_id": sucursal_id,
                "tenant_id": tenant_id,
                "total": 0.0,
                "items": []
            }
        
        subtotal = p_cant * p_precio
        grupos_tickets[numero_ticket]["total"] += subtotal
        grupos_tickets[numero_ticket]["items"].append({
            "producto_id": str(ObjectId()),
            "producto_nombre": str(row.get("DESCRIPCION", "S/N")),
            "cantidad": p_cant,
            "precio_unitario": p_precio,
            "subtotal": subtotal
        })
        
    ops_sale = []
    
    for num, reg in grupos_tickets.items():
        items_docs = []
        for it in reg["items"]:
            items_docs.append({
                "producto_id": it["producto_id"],
                "producto_nombre": it["producto_nombre"],
                "cantidad": it["cantidad"],
                "precio_unitario": it["precio_unitario"],
                "subtotal": it["subtotal"]
            })
            
        ops_sale.append(UpdateOne(
            {"numero_ticket": reg["numero_ticket"], "sucursal_id": reg["sucursal_id"]},
            {"$set": {
                "tenant_id": tenant_id,
                "sucursal_id": sucursal_id,
                "cajero_id": None,
                "cliente_id": None,
                "cliente_nombre": "Cliente GenArico",
                "total": float(reg["total"]),
                "metodo_pago": "EFECTIVO",
                "estado_pago": "PAGADO",
                "items": items_docs,
                "created_at": reg["created_at"],
                "updated_at": reg["created_at"],
                "is_active": True
            }},
            upsert=True
        ))
        
    if ops_sale:
        print(f"Executing {len(ops_sale)} bulk operations...")
        res = await Sale.get_motor_collection().bulk_write(ops_sale)
        print(f"Inserted/Updated Sales: {res.upserted_count} upserts, {res.modified_count} modifications.")
    else:
        print("No valid data found.")

async def main():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    s = await Sucursal.find({"nombre": {"$regex": "Heroinas", "$options": "i"}}).to_list()
    if not s:
        print("No Heroinas sucursal found!")
        return
    sucursal_id = str(s[0].id)
    print(f"Using Sucursal {s[0].nombre} ({sucursal_id})")
    
    files = [
        "../exports/Hoja de cAlculo sin tAtulo (3).xlsx",
        "../exports/2026 Heroinas.xlsx",
        "../exports/2024 Heroinas.xlsx"
    ]
    
    for f in files:
        actual_name = f
        if "Hoja de" in f:
            for file_in_dir in os.listdir("../exports"):
                if "Hoja de" in file_in_dir:
                    actual_name = f"../exports/{file_in_dir}"
                    break
                    
        if os.path.exists(actual_name):
            await import_file(actual_name, tenant_id, sucursal_id)
        else:
            print(f"File not found: {actual_name}")

asyncio.run(main())
