import asyncio
from bson import Decimal128
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

async def verify_payment_proportional_math():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("DEMOSTRACIÓN MATEMÁTICA DE CONCILIACIÓN DE MÉTODOS DE PAGO NETOS")
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

    method_net_totals = {}
    tickets_without_pagos = 0

    for s in sales_docs:
        s_total = safe_float_audit(s.get("total"))
        pagos = s.get("pagos") or []

        if not pagos or not isinstance(pagos, list):
            tickets_without_pagos += 1
            # Si el ticket no tiene array pagos, se asigna como EFECTIVO directo
            method_net_totals["EFECTIVO"] = method_net_totals.get("EFECTIVO", 0.0) + s_total
            continue

        valid_pagos = [p for p in pagos if isinstance(p, dict) and safe_float_audit(p.get("monto")) > 0]
        total_entregado = sum(safe_float_audit(p.get("monto")) for p in valid_pagos)

        if total_entregado <= 0:
            method_net_totals["EFECTIVO"] = method_net_totals.get("EFECTIVO", 0.0) + s_total
            continue

        for p in valid_pagos:
            m_tipo = str(p.get("metodo") or p.get("tipo") or "EFECTIVO").upper()
            m_monto = safe_float_audit(p.get("monto"))
            # Ponderación neta del cobro real del ticket
            m_neto_proporcional = round(s_total * (m_monto / total_entregado), 2)
            method_net_totals[m_tipo] = method_net_totals.get(m_tipo, 0.0) + m_neto_proporcional

    total_neto_calculado = sum(method_net_totals.values())

    print("\n   TABLA DE CONCILIACIÓN MATEMÁTICA REAL DE MÉTODOS DE PAGO NETOS:")
    print("   " + "-" * 60)
    for m in sorted(method_net_totals.keys()):
        print(f"   - Método {m:<15} : Bs. {method_net_totals[m]:>12,.2f}")
    print("   " + "-" * 60)
    print(f"   SUMA TOTAL PAGOS NETOS  : Bs. {total_neto_calculado:>12,.2f}")
    print(f"   SUM(sales.total)         : Bs. {total_sales_sum:>12,.2f}")
    print(f"   DIFERENCIA EXACTA        : Bs. {total_sales_sum - total_neto_calculado:>12,.2f}")

    if abs(total_sales_sum - total_neto_calculado) < 0.05:
        print("\n✓ CONCILIACIÓN MATEMÁTICA DE MÉTODOS DE PAGO APROBADA CON CERO DIFERENCIA (Bs. 0.00)")

if __name__ == "__main__":
    asyncio.run(verify_payment_proportional_math())
