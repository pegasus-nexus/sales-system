import asyncio
import json
from datetime import datetime, timezone
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

async def audit_phase9_cashiers_sources():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE FUENTES REALES Y CONCILIACIÓN MATEMÁTICA EN MONGODB — FASE 9")
    print("SECCIÓN BI N.º 9: PRODUCTIVIDAD DE CAJEROS, USUARIOS Y AUDITORÍA OPERACIONAL")
    print("=" * 90)

    # 1. AUDITORÍA DE USUARIOS EN db.users
    total_users_cnt = await db.users.count_documents({})
    users_docs = await db.users.find({}).to_list(length=1000)

    users_dict = {}
    for u in users_docs:
        u_id = str(u["_id"])
        users_dict[u_id] = {
            "username": u.get("username", "Sin username"),
            "full_name": u.get("full_name") or u.get("username") or "Usuario Sin Nombre",
            "role": u.get("role", "VENDEDOR")
        }

    print(f"\n1. RESUMEN DE LA COLECCIÓN db.users ({total_users_cnt} usuarios registrados):")
    print(f"   - Muestra de Usuarios Operacionales: {len(users_dict)} perfiles cargados.")

    # 2. AUDITORÍA DE FIELD CASHIER_NAME EN db.sales
    total_sales_history_cnt = await db.sales.count_documents({})
    cashier_cnt = await db.sales.count_documents({"cashier_name": {"$exists": True, "$ne": None}})

    print(f"\n2. HISTÓRICO Y PRESENCIA DE 'cashier_name' EN db.sales ({total_sales_history_cnt} tickets):")
    print(f"   - Tickets Históricos con 'cashier_name' No Nulo: {cashier_cnt} de {total_sales_history_cnt}")

    # Agrupar ventas históricas por cashier_name
    pipeline = [
        {"$match": {"anulada": {"$ne": True}}},
        {"$group": {
            "_id": "$cashier_name",
            "tickets": {"$sum": 1},
            "total_ingresos": {"$sum": "$total"}
        }},
        {"$sort": {"total_ingresos": -1}}
    ]

    grouped_cashiers = await db.sales.aggregate(pipeline).to_list(length=100)
    print(f"\n   - Desglose Histórico por Cajero Registrado (`cashier_name`):")
    print(f"     {'Nombre Cajero':<32} | {'Tickets':<10} | {'Ingresos Totales (Bs.)':<22}")
    print("     " + "-" * 70)
    for c in grouped_cashiers:
        c_nom = str(c["_id"] or "Caja General / No Especificado")
        c_tks = c["tickets"]
        c_ing = safe_float_audit(c["total_ingresos"])
        print(f"     {c_nom:<32} | {c_tks:<10} | Bs. {c_ing:>16,.2f}")

    start_utc = datetime(2026, 8, 25, 4, 0, 0, tzinfo=timezone.utc)
    end_utc = datetime(2026, 8, 26, 4, 0, 0, tzinfo=timezone.utc)

    query_today = {
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "anulada": {"$ne": True}
    }

    sales_today = await db.sales.find(query_today).to_list(length=1000)
    total_sales_today_sum = sum(safe_float_audit(s.get("total")) for s in sales_today)

    user_sales_today = {}
    user_fields_found = set()

    for s in sales_today:
        for k in s.keys():
            if "user" in k.lower() or "cajer" in k.lower() or "vended" in k.lower() or "usua" in k.lower():
                user_fields_found.add(k)

        u_id = str(s.get("usuario_id") or s.get("user_id") or s.get("cajero_id") or "")
        u_nom = s.get("usuario_nombre") or s.get("cajero_nombre") or s.get("username")

        if not u_nom and u_id in users_dict:
            u_nom = users_dict[u_id]["full_name"]
        if not u_nom:
            u_nom = f"Usuario ID: {u_id[:8]}" if u_id else "Cajero No Especificado"

        tot = safe_float_audit(s.get("total"))

        if u_id not in user_sales_today:
            user_sales_today[u_id] = {
                "nombre": u_nom,
                "tickets": 0,
                "ingresos": 0.0
            }

        user_sales_today[u_id]["tickets"] += 1
        user_sales_today[u_id]["ingresos"] += tot

    print(f"\n2. CAMPOS Y FACTURACIÓN POR CAJERO/USUARIO EN VENTAS DEL 25/08/2026:")
    print(f"   - Campos de Identidad Encontrados en db.sales: {list(user_fields_found)}")
    print(f"   - Suma SUM(sales.total): Bs. {total_sales_today_sum:,.2f} en {len(sales_today)} tickets")

    print(f"\n   Desglose de Ventas por Cajero (25/08/2026):")
    print(f"   {'Cajero / Usuario':<32} | {'Tickets':<10} | {'Ingresos (Bs.)':<16} | {'Ticket Medio':<14} | {'Part. %'}")
    print("   " + "-" * 88)

    sum_ingresos_cajeros = 0.0
    for u_id, u_data in sorted(user_sales_today.items(), key=lambda x: x[1]["ingresos"], reverse=True):
        ing = round(u_data["ingresos"], 2)
        sum_ingresos_cajeros += ing
        tk_medio = round(ing / u_data["tickets"], 2) if u_data["tickets"] > 0 else 0.0
        part_pct = round((ing / total_sales_today_sum * 100.0), 2) if total_sales_today_sum > 0 else 0.0
        print(f"   {u_data['nombre']:<32} | {u_data['tickets']:<10} | Bs. {ing:>12,.2f} | Bs. {tk_medio:>10,.2f} | {part_pct:>6.2f}%")

    # 3. AUDITORÍA DE REGISTROS DE AUDITORÍA EN db.audit_logs
    total_audit_cnt = await db.audit_logs.count_documents({})
    audit_samples = await db.audit_logs.find({}).sort("created_at", -1).limit(10).to_list(length=10)

    audit_actions_map = {}
    audit_docs_all = await db.audit_logs.find({}).to_list(length=2000)
    for a in audit_docs_all:
        act = str(a.get("action") or "OTRO")
        audit_actions_map[act] = audit_actions_map.get(act, 0) + 1

    print(f"\n3. AUDITORÍA DE REGISTROS DE SISTEMA EN db.audit_logs ({total_audit_cnt} eventos):")
    print(f"   - Desglose de Acciones Auditadas:")
    for act_name, act_cnt in audit_actions_map.items():
        print(f"     * Action '{act_name}': {act_cnt} eventos")

    print("\n" + "=" * 90)
    print("EVALUACIÓN DE CONCILIACIÓN MATEMÁTICA CON sales.total")
    print("=" * 90)
    print(f"  SUM(ventas_cajeros) == SUM(sales.total) : Bs. {sum_ingresos_cajeros:,.2f} == Bs. {total_sales_today_sum:,.2f} -> {'✓ PASÓ' if sum_ingresos_cajeros == total_sales_today_sum else '❌ FALLÓ'}")
    print(f"  Diferencia Exacta: Bs. {total_sales_today_sum - sum_ingresos_cajeros:,.2f}")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA FORENSE FASE 9")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase9_cashiers_sources())
