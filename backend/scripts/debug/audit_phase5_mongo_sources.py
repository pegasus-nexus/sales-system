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

def bson_default(obj):
    if isinstance(obj, Decimal128):
        return float(obj.to_decimal())
    if isinstance(obj, ObjectId):
        return str(obj)
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)

async def audit_phase5_mongodb_sources():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE FUENTES REALES DE MONGODB PARA FASE 5")
    print("SECCIÓN BI N.º 5: SUCURSALES / TIENDAS Y DESEMPEÑO OPERATIVO")
    print("=" * 90)

    # 1. AUDITORÍA EN MONGODB SALES DEL 25/08/2026
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
    print(f"   - Total Tickets Válidos: {total_tickets_cnt}")
    print(f"   - Suma SUM(sales.total): Bs. {total_sales_sum:,.2f}")

    # Agrupar ventas por sucursal_id
    sales_by_sucursal = {}

    for s in sales_docs:
        s_total = safe_float_audit(s.get("total"))
        suc_id = str(s.get("sucursal_id") or "SIN_SUCURSAL")
        if suc_id not in sales_by_sucursal:
            sales_by_sucursal[suc_id] = {
                "tickets": 0,
                "ingresos": 0.0
            }
        sales_by_sucursal[suc_id]["tickets"] += 1
        sales_by_sucursal[suc_id]["ingresos"] += s_total

    print("\n2. DISTRIBUCIÓN DE VENTAS POR sucursal_id DENTRO DE SALES:")
    print(f"   {'sucursal_id':<30} | {'Tickets':<10} | {'Ingresos (Bs.)':<18} | {'Ticket Medio':<15}")
    print("   " + "-" * 80)

    sum_suc_ingresos = 0.0
    sum_suc_tickets = 0

    for suc_id, data in sales_by_sucursal.items():
        ing = round(data["ingresos"], 2)
        tks = data["tickets"]
        t_medio = round(ing / tks, 2) if tks > 0 else 0.0
        sum_suc_ingresos += ing
        sum_suc_tickets += tks
        print(f"   {suc_id:<30} | {tks:<10} | Bs. {ing:>14,.2f} | Bs. {t_medio:>11,.2f}")

    print("   " + "-" * 80)
    print(f"   {'TOTALES CALCULADOS':<30} | {sum_suc_tickets:<10} | Bs. {sum_suc_ingresos:>14,.2f}")
    print(f"   {'TOTAL SALES ESPERADO':<30} | {total_tickets_cnt:<10} | Bs. {total_sales_sum:>14,.2f}")
    print(f"   {'DIFERENCIA MATEMÁTICA':<30} | {total_tickets_cnt - sum_suc_tickets:<10} | Bs. {total_sales_sum - sum_suc_ingresos:>14,.2f}")

    # 3. AUDITORÍA DE LA COLECCIÓN SUCURSALES EN MONGODB
    sucursales_docs = await db.sucursales.find({}).to_list(length=100)
    print(f"\n3. AUDITORÍA DE LA COLECCIÓN db.sucursales ({len(sucursales_docs)} documentos):")

    sucursales_map = {}
    for suc in sucursales_docs:
        s_id = str(suc.get("_id"))
        s_nom = suc.get("nombre", "Sin Nombre")
        s_ciud = suc.get("ciudad", "Sin Ciudad")
        s_dir = suc.get("direccion", "")
        s_act = suc.get("is_active", True)

        sucursales_map[s_id] = {
            "nombre": s_nom,
            "ciudad": s_ciud,
            "direccion": s_dir,
            "is_active": s_act
        }

    print("\n   TABLA CRUZADA: VENTA POR SUCURSAL NOMBRADA:")
    print(f"   {'sucursal_id':<26} | {'Nombre Sucursal':<25} | {'Ciudad':<12} | {'Tickets':<8} | {'Ingresos (Bs.)':<15}")
    print("   " + "-" * 95)

    for suc_id, data in sales_by_sucursal.items():
        nom = sucursales_map.get(suc_id, {}).get("nombre", "NO ENCONTRADA EN DB")
        ciudad = sucursales_map.get(suc_id, {}).get("ciudad", "-")
        print(f"   {suc_id:<26} | {nom:<25} | {ciudad:<12} | {data['tickets']:<8} | Bs. {data['ingresos']:>12,.2f}")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA FORENSE FASE 5")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase5_mongodb_sources())
