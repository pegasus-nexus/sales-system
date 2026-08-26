import asyncio
import json
from bson import Decimal128, ObjectId
from app.db import init_db, get_raw_db

def bson_default(obj):
    if isinstance(obj, Decimal128):
        return float(obj.to_decimal())
    if isinstance(obj, ObjectId):
        return str(obj)
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)

async def audit_phase4_mongodb_sources():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE FUENTES REALES DE MONGODB PARA FASE 4")
    print("SECCIÓN BI N.º 4: CLIENTES, MÉTODOS DE PAGO Y FIDELIZACIÓN")
    print("=" * 90)

    # 1. INSPECCIÓN DE CAMPOS DE CLIENTE Y MÉTODOS DE PAGO EN SALES (25/08/2026)
    from datetime import datetime, timezone
    start_utc = datetime(2026, 8, 25, 4, 0, 0, tzinfo=timezone.utc)
    end_utc = datetime(2026, 8, 26, 4, 0, 0, tzinfo=timezone.utc)

    query = {
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "anulada": {"$ne": True}
    }

    cursor = db.sales.find(query)
    sales_docs = await cursor.to_list(length=1000)

    print(f"\n1. AUDITORÍA EN MONGODB SALES ({len(sales_docs)} documentos del 25/08/2026):")

    payment_methods_found = {}
    client_fields_found = set()
    sample_payment_structures = []
    sample_client_structures = []

    for s in sales_docs:
        # Registrar todas las llaves del documento
        for k in s.keys():
            if "client" in k or "customer" in k or "nit" in k or "razon" in k or "comprador" in k:
                client_fields_found.add(k)

        # Inspección de Métodos de Pago
        pagos = s.get("pagos") or s.get("metodos_pago") or s.get("metodo_pago") or s.get("forma_pago")
        if isinstance(pagos, list):
            for p in pagos:
                if isinstance(p, dict):
                    m_type = p.get("tipo") or p.get("metodo") or p.get("forma") or p.get("tipo_pago") or "DESCONOCIDO"
                    m_monto = float(p.get("monto").to_decimal()) if isinstance(p.get("monto"), Decimal128) else float(p.get("monto") or 0.0)
                    payment_methods_found[str(m_type)] = payment_methods_found.get(str(m_type), 0.0) + m_monto
        elif isinstance(pagos, str):
            tot = float(s.get("total").to_decimal()) if isinstance(s.get("total"), Decimal128) else float(s.get("total") or 0.0)
            payment_methods_found[pagos] = payment_methods_found.get(pagos, 0.0) + tot

        if len(sample_payment_structures) < 3:
            sample_payment_structures.append({
                "ticket_id": str(s.get("_id")),
                "total": float(s.get("total").to_decimal()) if isinstance(s.get("total"), Decimal128) else float(s.get("total") or 0.0),
                "estado_pago": s.get("estado_pago"),
                "metodo_pago": s.get("metodo_pago"),
                "pagos": s.get("pagos")
            })

        if len(sample_client_structures) < 3:
            sample_client_structures.append({
                "ticket_id": str(s.get("_id")),
                "cliente_id": s.get("cliente_id"),
                "cliente_nombre": s.get("cliente_nombre"),
                "cliente_nit": s.get("cliente_nit") or s.get("nit_ci") or s.get("nit"),
                "razon_social": s.get("razon_social")
            })

    print("\n  A. CAMPOS RELACIONADOS CON CLIENTES DENTRO DE SALES:")
    print(f"     - Llaves de cliente detectadas: {sorted(list(client_fields_found))}")
    print("     - Muestras de campos de cliente en sales:")
    print(json.dumps(sample_client_structures, indent=6, default=bson_default))

    print("\n  B. DISTRIBUCIÓN DE MÉTODOS DE PAGO EN SALES (25/08/2026):")
    for m, sum_val in payment_methods_found.items():
        print(f"     - Método '{m}': Bs. {sum_val:,.2f}")
    print("     - Muestras de estructura de pagos en sales:")
    print(json.dumps(sample_payment_structures, indent=6, default=bson_default))

    # 2. AUDITORÍA DE COLECCIONES RELACIONADAS CON CLIENTES Y FIDELIZACIÓN
    collections = await db.list_collection_names()
    target_cols = [c for c in collections if "client" in c or "credito" in c or "fideliz" in c or "user" in c or "puntos" in c]

    print(f"\n2. AUDITORÍA DE COLECCIONES RELACIONADAS ({target_cols}):")
    for c_name in target_cols:
        cnt = await db[c_name].count_documents({})
        sample_c = await db[c_name].find_one()
        print(f"\n  📁 Colección '{c_name}' (Total Documentos: {cnt}):")
        if sample_c:
            print("     - Claves disponibles:", list(sample_c.keys()))
            print("     - Muestra documento:", json.dumps(sample_c, indent=8, default=bson_default)[:400] + "...")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA DE MONGODB PARA FASE 4")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase4_mongodb_sources())
