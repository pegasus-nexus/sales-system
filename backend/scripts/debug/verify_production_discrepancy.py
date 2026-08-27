import asyncio
import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.application.bi.ejecutivo_service import EjecutivoBIService
from app.application.services.sales_read_service import safe_float, SalesReadService
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def run_production_discrepancy_audit():
    await init_db()
    db = await get_raw_db()

    print("=" * 100)
    print("AUDITORÍA DE PRECISIÓN DE PRODUCCIÓN: EVALUACIÓN DIRECTA DE ENDPOINT BI PANEL GENERAL")
    print("PEGASUS SALES SYSTEM — PROTOCOLO DE INSPECCIÓN DE DATOS HTTP REALES VS MONGODB")
    print("=" * 100)

    user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)
    if not user:
        user = await User.find_one()

    tenant_id_str = str(user.tenant_id or "69cd7f0a8f3f6866d4cfbb62")
    tenant_cond = {"tenant_id": {"$in": [tenant_id_str, ObjectId(tenant_id_str)]}} if ObjectId.is_valid(tenant_id_str) else {"tenant_id": tenant_id_str}

    # 1. EVALUAR EL RANGO 30 DÍAS: 2026-07-29 a 2026-08-27
    s_30d_str = "2026-07-29"
    e_30d_str = "2026-08-27"

    start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(s_30d_str, e_30d_str)

    # A) Consulta MongoDB directo para ese tenant y rango
    query_mongo = {
        "anulada": {"$ne": True},
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        **tenant_cond
    }
    docs_30d = await db.sales.find(query_mongo).to_list(length=None)
    mongo_30d_tickets = len(docs_30d)
    mongo_30d_monto = sum(safe_float(d.get("total", 0.0)) for d in docs_30d)

    print(f"\n[1. MONGODB DIRECTO (Rango {s_30d_str} a {e_30d_str})]:")
    print(f"  - Documentos Válidos : {mongo_30d_tickets}")
    print(f"  - Suma Total Ventas : Bs. {mongo_30d_monto:,.2f}")

    # B) Consulta por sucursal específica vs sucursal = "all"
    sucursales = await db.sucursales.find(tenant_cond).to_list(length=None)
    print(f"\n[2. DESGLOSE POR SUCURSALES EN MONGODB]:")
    for suc in sucursales:
        s_id_str = str(suc["_id"])
        suc_cond = [s_id_str, ObjectId(s_id_str)] if ObjectId.is_valid(s_id_str) else [s_id_str]
        q_suc = {**query_mongo, "sucursal_id": {"$in": suc_cond}}
        s_docs = await db.sales.find(q_suc).to_list(length=None)
        s_count = len(s_docs)
        s_monto = sum(safe_float(d.get("total", 0.0)) for d in s_docs)
        print(f"  - Sucursal '{suc.get('nombre')}' (ID: {s_id_str}): Bs. {s_monto:,.2f} | {s_count} tickets")

    # C) Invocación de Servicio BI Ejecutivo / Panel General
    ejecutivo_service = EjecutivoBIService()
    res_exec_30d = await ejecutivo_service.get_ejecutivo_summary(user=user, start_date=s_30d_str, end_date=e_30d_str, sucursal_id="all")

    print(f"\n[3. RESPUESTA SERVICIO BACKEND BI (sucursal_id='all')]:")
    print(f"  - Ingresos Totales : Bs. {res_exec_30d.kpis.ingresos_totales:,.2f}")
    print(f"  - Total Tickets    : {res_exec_30d.kpis.total_tickets}")
    print(f"  - Ticket Medio     : Bs. {res_exec_30d.kpis.ticket_medio:,.2f}")

    # D) Verificar si 2026-07-28 a 2026-08-26 o 2026-07-27 a 2026-08-25 devuelve 40,365.64
    for offset_days in [0, 1, 2, 3, 30]:
        s_test = (datetime.strptime(s_30d_str, "%Y-%m-%d") - timedelta(days=offset_days)).strftime("%Y-%m-%d")
        e_test = (datetime.strptime(e_30d_str, "%Y-%m-%d") - timedelta(days=offset_days)).strftime("%Y-%m-%d")
        r_test = await ejecutivo_service.get_ejecutivo_summary(user=user, start_date=s_test, end_date=e_test, sucursal_id="all")
        print(f"  - Test Rango ({s_test} -> {e_test}): Bs. {r_test.kpis.ingresos_totales:,.2f} | {r_test.kpis.total_tickets} tickets")

    print("\n" + "=" * 100)
    print("MATRIZ DE AUDITORÍA DIRECTA DE BACKEND")
    print("=" * 100)
    print(f"  Mongo Directo 30d (2026-07-29 -> 2026-08-27): Bs. {mongo_30d_monto:,.2f} | {mongo_30d_tickets} tks")
    print(f"  API Backend BI 30d (2026-07-29 -> 2026-08-27): Bs. {res_exec_30d.kpis.ingresos_totales:,.2f} | {res_exec_30d.kpis.total_tickets} tks")
    print("=" * 100)


if __name__ == "__main__":
    asyncio.run(run_production_discrepancy_audit())
