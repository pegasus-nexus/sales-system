# -*- coding: utf-8 -*-
"""
Inspección profunda del origen del dato Bs. 1,066.50 en Calacoto y Recoleta para el 01/08/2025.
"""
import asyncio
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"
MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"

async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["sales_system_prod"]

    start = datetime(2025, 8, 1, 0, 0, 0)
    end = datetime(2025, 8, 1, 23, 59, 59, 999999)

    for suc in ["Calacoto", "Recoleta", "Heroínas"]:
        if suc == "Heroínas":
            match_suc = {"$regex": "Hero.*nas", "$options": "i"}
        else:
            match_suc = {"$regex": f"^{suc}$", "$options": "i"}

        match = {
            "tenant_id": TENANT_ID,
            "fecha_transaccion": {"$gte": start, "$lte": end},
            "estado": {"$ne": "anulado"},
            "sucursal": match_suc
        }

        docs = await db.ventas_historicas_crudas.find(match).to_list(1000)
        total = sum(float(d.get("monto_total_bs", 0) or 0) for d in docs)
        
        print(f"\n========================================================")
        print(f"SUCURSAL: {suc}  (Fecha: 01/08/2025)")
        print(f"========================================================")
        print(f"Total en BD: {total:.2f} Bs | Cantidad de documentos: {len(docs)}")
        
        # Muestra de los primeros 5 documentos
        print("\nPrimeros 5 documentos:")
        for d in docs[:5]:
            print(f"  ID: {d['_id']} | Hora: {d.get('fecha_transaccion')} | Producto: {d.get('nombre_producto')} | Monto: {d.get('monto_total_bs')} | Ticket/NumDoc: {d.get('numero_documento') or d.get('id_venta_origen')}")

    # Verificar si Calacoto y Recoleta comparten exactamente los mismos documentos (mismos IDs o mismos tickets)
    docs_cala = await db.ventas_historicas_crudas.find({
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
        "sucursal": {"$regex": "^Calacoto$", "$options": "i"}
    }).to_list(1000)

    docs_reco = await db.ventas_historicas_crudas.find({
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
        "sucursal": {"$regex": "^Recoleta$", "$options": "i"}
    }).to_list(1000)

    ids_cala = [str(d["_id"]) for d in docs_cala]
    ids_reco = [str(d["_id"]) for d in docs_reco]
    
    ids_coincidentes = set(ids_cala).intersection(set(ids_reco))
    print(f"\n========================================================")
    print(f"COMPARACIÓN DE DOCUMENTOS ENTRE CALACOTO Y RECOLETA (01/08/2025)")
    print(f"========================================================")
    print(f"IDs idénticos entre ambos: {len(ids_coincidentes)}")

    # Comparar productos/montos/horas de Calacoto vs Recoleta
    pares_coincidentes = 0
    for dc in docs_cala:
        for dr in docs_reco:
            if (dc.get("fecha_transaccion") == dr.get("fecha_transaccion") and 
                dc.get("nombre_producto") == dr.get("nombre_producto") and 
                dc.get("monto_total_bs") == dr.get("monto_total_bs")):
                pares_coincidentes += 1
                break

    print(f"Pares con exactamente misma fecha, producto y monto: {pares_coincidentes} / {len(docs_cala)}")

    client.close()

if __name__ == "__main__":
    asyncio.run(run())
