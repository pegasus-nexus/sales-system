import asyncio
from datetime import datetime, time
from zoneinfo import ZoneInfo
import pandas as pd
from app.db import get_raw_db, init_db
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def check_day_counts():
    await init_db()
    db = await get_raw_db()

    cursor = db.sales.find({"anulada": {"$ne": True}}, {"created_at": 1, "total": 1, "sucursal_id": 1, "_id": 1})
    docs = await cursor.to_list(length=None)

    for d in docs:
        d["_id"] = str(d["_id"])
        val = d.get("total", 0.0)
        if hasattr(val, "to_decimal"):
            val = float(val.to_decimal())
        d["total"] = float(val or 0.0)

    df = pd.DataFrame(docs)
    df["created_at_utc"] = pd.to_datetime(df["created_at"], utc=True, errors="coerce")
    df["fecha_hora_bolivia"] = df["created_at_utc"].dt.tz_convert(BOLIVIA_TZ)
    df["fecha_bolivia"] = df["fecha_hora_bolivia"].dt.date

    # Conteo por fecha oficial en Bolivia
    summary = df.groupby("fecha_bolivia").agg(
        ventas=("total", "sum"),
        ordenes=("_id", "nunique")
    ).reset_index().sort_values("fecha_bolivia", ascending=False)

    print("=" * 70)
    print("RESUMEN EXACTO DE VENTAS POR DÍA (HORA DE BOLIVIA America/La_Paz)")
    print("=" * 70)
    print(summary.head(15).to_string(index=False))

if __name__ == "__main__":
    asyncio.run(check_day_counts())
