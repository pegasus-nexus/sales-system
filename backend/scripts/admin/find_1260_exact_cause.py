import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
import pandas as pd

async def analyze_1008_sales():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    ts_2026 = pd.Timestamp("2026-08-10", tz="America/La_Paz")
    start_utc = ts_2026.tz_convert("UTC").to_pydatetime()
    end_utc = (ts_2026 + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    sales = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lt": end_utc}
    }).to_list(1000)

    print("==========================================================================")
    print(f"ANÁLISIS DE LAS VENTAS DEL 10-08-2026 EN 'sales' (Total encontradas: {len(sales)})")
    print("==========================================================================")

    df = []
    for s in sales:
        total = float(str(s.get("total", 0)))
        subtotal = float(str(s.get("subtotal", s.get("total", 0))))
        desc_val = 0
        desc_obj = s.get("descuento")
        if isinstance(desc_obj, dict):
            val = desc_obj.get("valor", 0)
            tipo = desc_obj.get("tipo", "MONTO")
            if tipo == "MONTO":
                desc_val = float(str(val))
            elif tipo == "PORCENTAJE":
                desc_val = total * (float(str(val)) / 100.0)
        neto = total - desc_val

        estado = s.get("estado", "")
        anulada = s.get("anulada", False)
        tipo_venta = s.get("tipo", "")
        origen = s.get("origen", "")
        suc_id = str(s.get("sucursal_id", ""))

        ca = s.get("created_at")
        local_ts = pd.Timestamp(ca).tz_localize("UTC").tz_convert("America/La_Paz")
        hora = local_ts.hour

        df.append({
            "id": str(s["_id"]),
            "total": total,
            "neto": neto,
            "estado": estado,
            "anulada": anulada,
            "tipo": tipo_venta,
            "origen": origen,
            "sucursal_id": suc_id,
            "hora": hora,
            "created_at_local": local_ts.strftime('%H:%M:%S')
        })

    pdf = pd.DataFrame(df)
    print(pdf.info())

    print("\nTotal Sum total (Bruto):", pdf['total'].sum())
    print("Total Sum neto (Neto):", pdf['neto'].sum())
    print("Total count:", len(pdf))

    print("\nDesglose por estado:")
    print(pdf.groupby("estado")[['total', 'neto', 'id']].agg({'total': 'sum', 'neto': 'sum', 'id': 'count'}))

    print("\nDesglose por anulada:")
    print(pdf.groupby("anulada")[['total', 'neto', 'id']].agg({'total': 'sum', 'neto': 'sum', 'id': 'count'}))

    print("\nDesglose por hora (Venta Neta):")
    print(pdf.groupby("hora")[['neto', 'id']].agg({'neto': 'sum', 'id': 'count'}))

if __name__ == '__main__':
    asyncio.run(analyze_1008_sales())
