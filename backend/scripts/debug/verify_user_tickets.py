import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd
from app.db import get_raw_db, init_db
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def check_exact_user_tickets():
    await init_db()
    db = await get_raw_db()

    # Traer todas las sucursales
    suc_docs = await db.sucursales.find({}).to_list(None)
    suc_map = {str(s["_id"]): s.get("nombre", "Sin Nombre") for s in suc_docs}
    print("=== SUCURSALES REGISTRADAS EN MONGODB ===")
    for s_id, s_name in suc_map.items():
        print(f"  ID: {s_id} -> Nombre: '{s_name}'")

    # Traer ventas del 24 de agosto de 2026
    start_utc = datetime(2026, 8, 24, 4, 0, 0, tzinfo=ZoneInfo("UTC"))
    end_utc = datetime(2026, 8, 25, 3, 59, 59, tzinfo=ZoneInfo("UTC"))

    cursor = db.sales.find({"created_at": {"$gte": start_utc, "$lte": end_utc}, "anulada": {"$ne": True}})
    sales_docs = await cursor.to_list(None)
    print(f"\nTotal ventas en MongoDB entre {start_utc} y {end_utc}: {len(sales_docs)}")

    for d in sales_docs:
        d["_id"] = str(d["_id"])
        sid = str(d.get("sucursal_id", "CENTRAL"))
        d["nombre_sucursal"] = suc_map.get(sid, d.get("sucursal_nombre", sid))
        val = d.get("total", 0.0)
        if hasattr(val, "to_decimal"):
            val = float(val.to_decimal())
        d["total_neto"] = float(val or 0.0)

    df = pd.DataFrame(sales_docs)
    if not df.empty:
        df["created_at_utc"] = pd.to_datetime(df["created_at"], utc=True, errors="coerce")
        df["fecha_hora_bolivia"] = df["created_at_utc"].dt.tz_convert(BOLIVIA_TZ)
        df["hora_bolivia"] = df["fecha_hora_bolivia"].dt.strftime("%H:%M")

        print("\n=== DESGLOSE EXACTO POR SUCURSAL DEL 24 DE AGOSTO DE 2026 ===")
        by_suc = df.groupby("nombre_sucursal").agg(
            ventas_totales=("total_neto", "sum"),
            ordenes=("_id", "nunique"),
            ticket_medio=("total_neto", "mean")
        ).reset_index()
        print(by_suc.to_string(index=False))

        print("\n=== PRIMERAS 10 VENTAS RECIENTES (ORDENADAS POR TIMESTAMPS BOLIVIA DESC) ===")
        df_sorted = df.sort_values("fecha_hora_bolivia", ascending=False).head(10)
        for _, r in df_sorted.iterrows():
            print(f"Ticket: {r.get('numero_ticket', r['_id'])} | Hora Bolivia: {r['hora_bolivia']} | Sucursal: {r['nombre_sucursal']} | Total: Bs. {r['total_neto']} | Estado: {r.get('estado_pago', 'PAGADO')}")

if __name__ == "__main__":
    asyncio.run(check_exact_user_tickets())
