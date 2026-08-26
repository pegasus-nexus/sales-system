import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from bson.decimal128 import Decimal128
import pandas as pd

from app.db import get_raw_db, init_db
from app.core.config import BUSINESS_TIMEZONE
from app.utils.date_utils import get_range_bolivia

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

def safe_convert_total(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, Decimal128):
        return float(val.to_decimal())
    if hasattr(val, "to_decimal"):
        return float(val.to_decimal())
    try:
        return float(val)
    except Exception:
        return 0.0

async def inspect_sales_types():
    await init_db()
    db = await get_raw_db()

    start_dt, end_dt = get_range_bolivia("2026-08-25", "2026-08-25")
    sales_docs = await db.sales.find({
        "created_at": {"$gte": start_dt, "$lte": end_dt},
        "anulada": {"$ne": True}
    }).to_list(None)

    print(f"Total ventas registradas HOY 25/08/2026: {len(sales_docs)}")

    total_sum = 0.0
    type_counts = {}
    for s in sales_docs:
        raw_tot = s.get("total")
        t_type = type(raw_tot).__name__
        type_counts[t_type] = type_counts.get(t_type, 0) + 1

        val = safe_convert_total(raw_tot)
        total_sum += val

    print("\nDesglose de tipos de datos en el campo 'total':")
    for t_name, count in type_counts.items():
        print(f"  Tipo '{t_name}': {count} documentos")

    print(f"\nSuma Real de Ventas de HOY (25/08/2026): Bs. {total_sum:,.2f}")

    print("\n--- 5 VENTAS DE HOY MÁS RECIENTES ---")
    for s in sales_docs[:5]:
        print(f"  Ticket: #{str(s.get('numero_ticket', s['_id']))[-6:]} | Hora: {s['created_at']} | Total: Bs. {safe_convert_total(s.get('total'))} (Tipo: {type(s.get('total')).__name__})")

if __name__ == "__main__":
    asyncio.run(inspect_sales_types())
