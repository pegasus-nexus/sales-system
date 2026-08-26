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

async def audit_payment_discrepancy():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA TICKET POR TICKET DE LA DIFERENCIA EN PAGOS")
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

    discrepant_tickets = []

    for s in sales_docs:
        s_total = safe_float_audit(s.get("total"))
        pagos = s.get("pagos") or []
        sum_pagos = sum(safe_float_audit(p.get("monto")) for p in pagos if isinstance(p, dict))

        if abs(sum_pagos - s_total) > 0.01:
            discrepant_tickets.append({
                "ticket_id": str(s.get("_id")),
                "numero_ticket": s.get("numero_ticket"),
                "total": s_total,
                "sum_pagos": sum_pagos,
                "diferencia": sum_pagos - s_total,
                "pagos": pagos,
                "estado_pago": s.get("estado_pago"),
                "created_at": s.get("created_at")
            })

    print(f"\nSe encontraron {len(discrepant_tickets)} tickets con diferencia entre sales.total y SUM(pagos.monto):")
    for t in discrepant_tickets:
        print(f"\n  🎫 Ticket #{t['numero_ticket']} (ID: {t['ticket_id']}):")
        print(f"     - sales.total: Bs. {t['total']:,.2f}")
        print(f"     - SUM(pagos.monto): Bs. {t['sum_pagos']:,.2f}")
        print(f"     - Diferencia: Bs. {t['diferencia']:+,.2f}")
        print(f"     - Detalle de array pagos[]: {t['pagos']}")

if __name__ == "__main__":
    asyncio.run(audit_payment_discrepancy())
