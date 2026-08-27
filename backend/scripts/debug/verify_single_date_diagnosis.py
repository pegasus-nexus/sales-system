import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.application.bi.ejecutivo_service import EjecutivoBIService
from app.application.services.sales_read_service import safe_float
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def run_single_date_diagnosis(target_date_str: str = "2026-08-26"):
    await init_db()
    db = await get_raw_db()

    print("=" * 100)
    print(f"DIAGNÓSTICO QUIRÚRGICO DE FILTRADO TEMPORAL PARA LA FECHA: {target_date_str}")
    print("=" * 100)

    # 1. Mongo Directo sin Filtro de Fecha (Solo por anulada y tenant)
    user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)
    if not user:
        user = await User.find_one()
    
    tenant_id_str = str(user.tenant_id or "69cd7f0a8f3f6866d4cfbb62")
    tenant_cond = {"tenant_id": {"$in": [tenant_id_str, ObjectId(tenant_id_str)]}} if ObjectId.is_valid(tenant_id_str) else {"tenant_id": tenant_id_str}
    
    match_all = {
        "anulada": {"$ne": True},
        **tenant_cond
    }

    total_sales_all = await db.sales.count_documents(match_all)
    print(f"\n[MONGODB BRUTO GLOBAL]:")
    print(f"  - Total Documentos Sales (Sin Filtro Fecha): {total_sales_all}")

    # 2. Rangos de Fecha Bolivia en UTC
    s_dt = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    start_bolivia = datetime.combine(s_dt, datetime.min.time(), tzinfo=BOLIVIA_TZ)
    start_utc = start_bolivia.astimezone(ZoneInfo("UTC"))

    # Rango semiabierto [start_utc, end_utc + 1 day)
    next_day_utc = datetime.combine(s_dt + timedelta(days=1), datetime.min.time(), tzinfo=BOLIVIA_TZ).astimezone(ZoneInfo("UTC"))

    match_single_date = {
        "anulada": {"$ne": True},
        "created_at": {"$gte": start_utc, "$lt": next_day_utc},
        **tenant_cond
    }

    sales_target_docs = await db.sales.find(match_single_date).to_list(length=None)
    sales_target_count = len(sales_target_docs)

    print(f"\n[EVALUACIÓN EN FECHA {target_date_str}]:")
    print(f"  - Límite Inferior Bolivia 00:00 -> UTC: {start_utc}")
    print(f"  - Límite Superior Bolivia 00:00 -> UTC: {next_day_utc}")
    print(f"  - Documentos Mongo Encontrados en Rango: {sales_target_count}")

    if sales_target_count > 0:
        created_ats = [d["created_at"] for d in sales_target_docs if "created_at" in d]
        print(f"  - created_at Mínimo Encontrado : {min(created_ats)}")
        print(f"  - created_at Máximo Encontrado : {max(created_ats)}")
        total_monto = sum(safe_float(d.get("total", 0.0)) for d in sales_target_docs)
        print(f"  - Suma Total Venta Mongo Directo: Bs. {total_monto:,.2f}")

    # 3. Evaluación del Servicio API BI
    ejecutivo_service = EjecutivoBIService()
    res_exec = await ejecutivo_service.get_ejecutivo_summary(
        user=user,
        start_date=target_date_str,
        end_date=target_date_str,
        sucursal_id="all"
    )

    print(f"\n[RESULTADO API BI EN FECHA {target_date_str}]:")
    print(f"  - Status API           : {res_exec.status}")
    print(f"  - Ingresos Totales API : Bs. {res_exec.kpis.ingresos_totales:,.2f}")
    print(f"  - Total Tickets API    : {res_exec.kpis.total_tickets}")

    # 4. Evaluación de Rango 30 Días que incluye la fecha objetivo
    s_30d = (s_dt - timedelta(days=29)).strftime("%Y-%m-%d")
    res_30d = await ejecutivo_service.get_ejecutivo_summary(
        user=user,
        start_date=s_30d,
        end_date=target_date_str,
        sucursal_id="all"
    )

    print(f"\n[RESULTADO API BI RANGO 30 DÍAS ({s_30d} -> {target_date_str})]:")
    print(f"  - Ingresos Totales API 30d: Bs. {res_30d.kpis.ingresos_totales:,.2f}")
    print(f"  - Total Tickets API 30d   : {res_30d.kpis.total_tickets}")

    print("\n" + "=" * 100)
    print("MATRIZ DE DIAGNÓSTICO QUIRÚRGICO DE FECHA ÚNICA")
    print("=" * 100)
    print(f"  Documentos Mongo Directo : {sales_target_count}")
    print(f"  Documentos API BI Single : {res_exec.kpis.total_tickets}")
    print(f"  Conciliación 1:1 Mongo/API: {'✓ MATCH EXACTO' if sales_target_count == res_exec.kpis.total_tickets else '❌ DESVIACIÓN'}")
    print("=" * 100)


if __name__ == "__main__":
    asyncio.run(run_single_date_diagnosis("2026-08-26"))
    asyncio.run(run_single_date_diagnosis("2026-08-25"))
