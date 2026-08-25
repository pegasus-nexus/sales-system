import asyncio
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
import pandas as pd
from app.db import get_raw_db, init_db
from app.core.config import BUSINESS_TIMEZONE
from app.utils.date_utils import get_now_bolivia

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

def build_bi_date_range(start_str: str, end_str: str) -> tuple[datetime, datetime]:
    """
    Construye el rango exacto semiabierto para MongoDB en horario de Bolivia.
    Si start_str == end_str (ej. "2026-08-24"), el rango es:
    gte: 2026-08-24 00:00:00 America/La_Paz -> UTC
    lt:  2026-08-25 00:00:00 America/La_Paz -> UTC
    """
    s_dt = datetime.strptime(start_str, "%Y-%m-%d").date()
    e_dt = datetime.strptime(end_str, "%Y-%m-%d").date()

    start_local = datetime.combine(s_dt, time.min, tzinfo=BOLIVIA_TZ)
    if s_dt == e_dt:
        end_local = datetime.combine(e_dt + timedelta(days=1), time.min, tzinfo=BOLIVIA_TZ)
    else:
        end_local = datetime.combine(e_dt + timedelta(days=1), time.min, tzinfo=BOLIVIA_TZ)

    start_utc = start_local.astimezone(ZoneInfo("UTC"))
    end_utc = end_local.astimezone(ZoneInfo("UTC"))
    return start_utc, end_utc

async def test_date_range_presets():
    await init_db()
    db = await get_raw_db()

    now_bolivia = get_now_bolivia().date()
    today_str = now_bolivia.strftime("%Y-%m-%d")
    yesterday_str = (now_bolivia - timedelta(days=1)).strftime("%Y-%m-%d")
    d7_start = (now_bolivia - timedelta(days=6)).strftime("%Y-%m-%d")
    d30_start = (now_bolivia - timedelta(days=29)).strftime("%Y-%m-%d")

    presets = [
        ("HOY", today_str, today_str),
        ("AYER", yesterday_str, yesterday_str),
        ("7 DÍAS", d7_start, today_str),
        ("30 DÍAS", d30_start, today_str),
    ]

    print("=" * 80)
    print(f"AUDITORÍA DE PRESETS DE FECHA BI (FECHA REFERENCIA BOLIVIA: {today_str})")
    print("=" * 80)

    for name, s_str, e_str in presets:
        s_utc, e_utc = build_bi_date_range(s_str, e_str)
        
        # Filtro semiabierto MongoDB
        query = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": s_utc, "$lt": e_utc}
        }
        
        docs = await db.sales.find(query, {"total": 1, "created_at": 1, "_id": 1, "sucursal_id": 1}).to_list(None)
        
        total_ingresos = 0.0
        for d in docs:
            t = d.get("total", 0.0)
            if hasattr(t, "to_decimal"):
                t = float(t.to_decimal())
            total_ingresos += float(t or 0.0)

        ordenes = len(docs)
        ticket_medio = total_ingresos / ordenes if ordenes > 0 else 0.0

        print(f"\n--- PRESET: {name} (start_date='{s_str}', end_date='{e_str}') ---")
        print(f"  Rango UTC query: {s_utc} <= created_at < {e_utc}")
        print(f"  Ventas Totales:  Bs. {total_ingresos:,.2f}")
        print(f"  Órdenes:         {ordenes}")
        print(f"  Ticket Medio:    Bs. {ticket_medio:,.2f}")

if __name__ == "__main__":
    asyncio.run(test_date_range_presets())
