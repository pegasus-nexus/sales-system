# -*- coding: utf-8 -*-
"""
Script de Auditoria adicional: verificar si fecha_transaccion esta en UTC o en hora local naive.
Esto es clave para saber si el $hour con timezone='America/La_Paz' es correcto o no.

Uso: python -X utf8 scripts/debug/check_timezone_storage.py
"""
import asyncio
import sys
from datetime import datetime, date
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"
TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    print("=" * 70)
    print("DIAGNOSTICO: Como esta almacenada fecha_transaccion en ventas_historicas_crudas")
    print("=" * 70)
    print()
    print("Si fecha_transaccion es LOCAL NAIVE (e.g., 08:00:00 = 8am Bolivia)")
    print("entonces NO debemos aplicar $hour con timezone='America/La_Paz'")
    print("porque eso restaria 4 horas adicionales (UTC a La Paz)")
    print()
    print("Si fecha_transaccion esta en UTC, entonces SI necesitamos timezone='America/La_Paz'")
    print()

    # Muestra documentos de 2025-08-01 con sus horas exactas
    docs = await db.ventas_historicas_crudas.find(
        {
            "tenant_id": TENANT_ID,
            "fecha_transaccion": {
                "$gte": datetime(2025, 8, 1, 0, 0, 0),
                "$lte": datetime(2025, 8, 1, 23, 59, 59)
            },
            "sucursal": {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"},
            "estado": {"$ne": "anulado"},
            "monto_total_bs": {"$gt": 0}
        }
    ).sort("fecha_transaccion", 1).limit(20).to_list(20)

    print(f"Primeros 20 documentos del 01/08/2025 con monto > 0:")
    print(f"  {'Hora en BD':<12}  {'Sucursal':<12}  {'Monto':>8}  {'Producto':<30}")
    print(f"  {'-'*70}")
    for d in docs:
        ft = d.get("fecha_transaccion")
        hora_str = ft.strftime("%H:%M:%S") if ft else "?"
        suc = str(d.get("sucursal", ""))[:12]
        monto = d.get("monto_total_bs", 0)
        prod = str(d.get("nombre_producto", ""))[:30]
        print(f"  {hora_str:<12}  {suc:<12}  {monto:>8.2f}  {prod}")

    print()
    print("CONCLUSION:")
    print("  Si las horas de arriba son tipo 04:xx, 05:xx, 06:xx -> almacenadas en UTC")
    print("  Si las horas son tipo 08:xx, 09:xx, 10:xx -> almacenadas como LOCAL NAIVE")
    print()

    # Tambien verificar para 01/08/2024
    docs2024 = await db.ventas_historicas_crudas.find(
        {
            "tenant_id": TENANT_ID,
            "fecha_transaccion": {
                "$gte": datetime(2024, 8, 1, 0, 0, 0),
                "$lte": datetime(2024, 8, 1, 23, 59, 59)
            },
            "sucursal": {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"},
            "estado": {"$ne": "anulado"},
            "monto_total_bs": {"$gt": 0}
        }
    ).sort("fecha_transaccion", 1).limit(15).to_list(15)

    print(f"Primeros 15 documentos del 01/08/2024 con monto > 0:")
    print(f"  {'Hora en BD':<12}  {'Sucursal':<12}  {'Monto':>8}  {'Producto':<30}")
    print(f"  {'-'*70}")
    for d in docs2024:
        ft = d.get("fecha_transaccion")
        hora_str = ft.strftime("%H:%M:%S") if ft else "?"
        suc = str(d.get("sucursal", ""))[:12]
        monto = d.get("monto_total_bs", 0)
        prod = str(d.get("nombre_producto", ""))[:30]
        print(f"  {hora_str:<12}  {suc:<12}  {monto:>8.2f}  {prod}")

    # Verificar como estan almacenados en sales (ventas 2026, POS en vivo)
    print()
    print("=" * 70)
    print("DIAGNOSTICO: Como esta almacenado created_at en sales (POS 2026)")
    print("=" * 70)
    
    from datetime import timezone
    start_utc = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_utc = datetime(2026, 8, 1, 23, 59, 59, tzinfo=timezone.utc)
    
    docs_sales = await db.sales.find(
        {
            "created_at": {"$gte": start_utc, "$lt": end_utc},
            "anulada": {"$ne": True},
        }
    ).sort("created_at", 1).limit(10).to_list(10)

    if docs_sales:
        print(f"  {'created_at (UTC)':<25}  {'sucursal_id':<25}  {'total':>8}")
        print(f"  {'-'*65}")
        for d in docs_sales:
            ca = d.get("created_at")
            ca_str = str(ca)[:19] if ca else "?"
            sid = str(d.get("sucursal_id", ""))[:25]
            tot = d.get("total", 0)
            print(f"  {ca_str:<25}  {sid:<25}  {tot:>8}")
    else:
        print("  Sin ventas en sales para 01/08/2026")

    client.close()


if __name__ == "__main__":
    asyncio.run(run())
