import asyncio
import json
from datetime import datetime, timezone
from bson import Decimal128, ObjectId
from app.db import init_db, get_raw_db

def safe_float_audit(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, Decimal128):
        return float(val.to_decimal())
    if hasattr(val, "to_decimal"):
        try:
            return float(val.to_decimal())
        except Exception:
            pass
    try:
        return float(val)
    except Exception:
        return 0.0

async def audit_phase10_mongo_sources():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE FUENTES REALES Y ANÁLISIS DE TRAZABILIDAD EN MONGODB — FASE 10")
    print("SECCIÓN BI N.º 10: CONSOLIDADO DE COMPRAS, PROVEEDORES Y FLUJO DE SUMINISTROS")
    print("=" * 90)

    # 1. AUDITORÍA DE LA COLECCIÓN db.compras / db.pedidos_compra
    collections_all = await db.list_collection_names()
    print(f"\n1. COLECCIONES REGISTRADAS EN MONGODB ({len(collections_all)} colecciones):")
    supply_cols = [c for c in collections_all if any(x in c for x in ["compra", "proveedor", "pedid", "cred", "fidel", "trasla", "almac"])]
    print(f"   - Colecciones Relacionadas con Compras y Cadena de Suministro: {supply_cols}")

    # Inspect db.compras
    compras_cnt = await db.compras.count_documents({}) if "compras" in collections_all else 0
    compras_docs = await db.compras.find({}).to_list(length=100) if compras_cnt > 0 else []
    total_compras_monto = sum(safe_float_audit(c.get("total") or c.get("monto_total")) for c in compras_docs)

    print(f"\n2. COLECCIÓN db.compras ({compras_cnt} documentos):")
    print(f"   - Monto Total en Muestra Compras: Bs. {total_compras_monto:,.2f}")
    if compras_docs:
        print(f"   - Muestra de Campos en db.compras: {list(compras_docs[0].keys())}")

    # Inspect db.proveedores
    prov_cnt = await db.proveedores.count_documents({}) if "proveedores" in collections_all else 0
    print(f"\n3. COLECCIÓN db.proveedores ({prov_cnt} registros de proveedores):")

    # Inspect db.creditos
    cred_cnt = await db.creditos.count_documents({}) if "creditos" in collections_all else 0
    cred_docs = await db.creditos.find({}).to_list(length=100) if cred_cnt > 0 else []
    total_credito_monto = sum(safe_float_audit(c.get("monto_total") or c.get("total") or c.get("saldo_pendiente")) for c in cred_docs)
    print(f"\n4. COLECCIÓN db.creditos ({cred_cnt} cuentas de crédito):")
    print(f"   - Monto Total en Muestra Créditos/Cartera: Bs. {total_credito_monto:,.2f}")

    # Inspect db.traslados
    tras_cnt = await db.traslados.count_documents({}) if "traslados" in collections_all else 0
    print(f"\n5. COLECCIÓN db.traslados ({tras_cnt} traslados entre sucursales/almacenes):")

    print("\n" + "=" * 90)
    print("EVALUACIÓN DE CONCILIACIÓN MATEMÁTICA Y TRAZABILIDAD MONGODB")
    print("=" * 90)
    print(f"  Total Registros Compras:    {compras_cnt} compras operacionales")
    print(f"  Total Proveedores:         {prov_cnt} proveedores activos")
    print(f"  Total Cartera Crédito:      Bs. {total_credito_monto:,.2f}")
    print(f"  Total Traslados Internos:  {tras_cnt} movimientos entre almacenes")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA FORENSE FASE 10")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase10_mongo_sources())
