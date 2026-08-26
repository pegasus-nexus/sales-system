import asyncio
import json
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

async def audit_phase4_math_reconciliation():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("SEGUNDA AUDITORÍA FORENSE DE CONCILIACIÓN MATEMÁTICA EN MONGODB (FASE 4)")
    print("=" * 90)

    from datetime import datetime, timezone
    start_utc = datetime(2026, 8, 25, 4, 0, 0, tzinfo=timezone.utc)
    end_utc = datetime(2026, 8, 26, 4, 0, 0, tzinfo=timezone.utc)

    query = {
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "anulada": {"$ne": True}
    }

    cursor = db.sales.find(query)
    sales_docs = await cursor.to_list(length=1000)

    total_sales_sum = sum(safe_float_audit(doc.get("total")) for doc in sales_docs)
    total_tickets_cnt = len(sales_docs)

    print(f"\n1. RESUMEN BASE DE VENTAS DEL 25/08/2026:")
    print(f"   - Conteo de Tickets Válidos: {total_tickets_cnt}")
    print(f"   - Suma SUM(sales.total): Bs. {total_sales_sum:,.2f}")

    # =========================================================================
    # AUDITORÍA 1: INVESTIGACIÓN FORENSE DE LA ESTRUCTURA DE PAGOS Y CAMBIO/VUELTO
    # =========================================================================
    print("\n2. ANÁLISIS DE OBJETOS DE PAGO Y VUELTO (CAMBIO) EN SALES:")

    total_pagos_monto_bruto = 0.0
    total_pagos_monto_neto = 0.0
    by_method_bruto = {}
    by_method_neto = {}
    sales_with_change = 0

    for s in sales_docs:
        s_total = safe_float_audit(s.get("total"))
        s_cambio = safe_float_audit(s.get("cambio") or s.get("vuelto"))
        pagos = s.get("pagos") or []

        if s_cambio > 0:
            sales_with_change += 1

        if isinstance(pagos, list) and len(pagos) > 0:
            # Calcular la suma entregada en el array de pagos para este ticket
            monto_entregado_ticket = sum(safe_float_audit(p.get("monto")) for p in pagos if isinstance(p, dict))

            for p in pagos:
                if isinstance(p, dict):
                    m_tipo = str(p.get("metodo") or p.get("tipo") or "DESCONOCIDO").upper()
                    m_bruto = safe_float_audit(p.get("monto"))

                    # Si hubo cambio en el ticket y es pago en efectivo, el monto neto cobrado real es:
                    # m_bruto - s_cambio (o proporcional si hubo múltiples métodos)
                    if m_tipo == "EFECTIVO" and s_cambio > 0:
                        m_neto = max(0.0, m_bruto - s_cambio)
                    else:
                        m_neto = m_bruto

                    by_method_bruto[m_tipo] = by_method_bruto.get(m_tipo, 0.0) + m_bruto
                    by_method_neto[m_tipo] = by_method_neto.get(m_tipo, 0.0) + m_neto

                    total_pagos_monto_bruto += m_bruto
                    total_pagos_monto_neto += m_neto

    print(f"   - Tickets con Cambio/Vuelto entregado al cliente: {sales_with_change}")
    print(f"   - SUMA BRUTA entregada por clientes (incluye billetes recibidos): Bs. {total_pagos_monto_bruto:,.2f}")
    print(f"   - SUMA NETA cobrada real desglosada por método: Bs. {total_pagos_monto_neto:,.2f}")

    print("\n   TABLA DE CONCILIACIÓN DE MÉTODOS DE PAGO:")
    print(f"   {'Método':<15} | {'Monto Bruto Recibido':<20} | {'Monto Neto Cobrado (Real)':<25}")
    print("   " + "-" * 65)
    for m in sorted(by_method_neto.keys()):
        print(f"   {m:<15} | Bs. {by_method_bruto[m]:>17,.2f} | Bs. {by_method_neto[m]:>22,.2f}")
    print("   " + "-" * 65)
    print(f"   {'TOTAL NETO':<15} |                     | Bs. {total_pagos_monto_neto:>22,.2f}")
    print(f"   {'TOTAL SALES':<15} |                     | Bs. {total_sales_sum:>22,.2f}")
    print(f"   {'DIFERENCIA':<15} |                     | Bs. {total_sales_sum - total_pagos_monto_neto:>22,.2f}")

    # =========================================================================
    # AUDITORÍA 2: CLIENTES NOMINADOS VS MOSTRADOR ANÓNIMO
    # =========================================================================
    print("\n3. ANÁLISIS DE CLIENTES NOMINADOS VS MOSTRADOR ANÓNIMO:")

    ventas_nominadas_cnt = 0
    ventas_nominadas_sum = 0.0
    ventas_anonimas_cnt = 0
    ventas_anonimas_sum = 0.0

    client_id_map = {}

    for s in sales_docs:
        s_total = safe_float_audit(s.get("total"))
        c_id = s.get("cliente_id") or s.get("client_id")

        if c_id and str(c_id) not in ["None", "null", "", "undefined"]:
            ventas_nominadas_cnt += 1
            ventas_nominadas_sum += s_total
            c_str = str(c_id)
            client_id_map[c_str] = client_id_map.get(c_str, 0.0) + s_total
        else:
            ventas_anonimas_cnt += 1
            ventas_anonimas_sum += s_total

    print(f"   - Ventas Nominadas (con cliente_id): {ventas_nominadas_cnt} tickets | Total: Bs. {ventas_nominadas_sum:,.2f}")
    print(f"   - Ventas Mostrador (sin cliente_id): {ventas_anonimas_cnt} tickets | Total: Bs. {ventas_anonimas_sum:,.2f}")

    # Cruzar cliente_id nominados con db.clientes para obtener nombres reales
    db_clientes_count = await db.clientes.count_documents({})
    matched_clients = 0
    for cid_str in client_id_map.keys():
        cl_doc = None
        try:
            cl_doc = await db.clientes.find_one({"_id": ObjectId(cid_str)})
        except Exception:
            pass
        if not cl_doc:
            cl_doc = await db.clientes.find_one({"_id": cid_str})
        if cl_doc:
            matched_clients += 1

    print(f"\n   - Total Clientes Registrados en db.clientes: {db_clientes_count}")
    print(f"   - Clientes Nominados distintos en el día: {len(client_id_map)}")
    print(f"   - Clientes resueltos en db.clientes: {matched_clients} / {len(client_id_map)}")

    print("\n   TABLA DE CONCILIACIÓN DE CLIENTES:")
    print(f"   SUM(Ventas Nominadas): Bs. {ventas_nominadas_sum:,.2f}")
    print(f"   SUM(Ventas Anónimas):   Bs. {ventas_anonimas_sum:,.2f}")
    print(f"   SUMA TOTAL CALCULADA:   Bs. {ventas_nominadas_sum + ventas_anonimas_sum:,.2f}")
    print(f"   SUM(sales.total):       Bs. {total_sales_sum:,.2f}")
    print(f"   DIFERENCIA CALCULADA:   Bs. {total_sales_sum - (ventas_nominadas_sum + ventas_anonimas_sum):,.2f}")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA FORENSE MATEMÁTICA FASE 4")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase4_math_reconciliation())
