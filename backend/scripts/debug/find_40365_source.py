import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.application.bi.ejecutivo_service import EjecutivoBIService
from app.application.services.sales_read_service import safe_float, SalesReadService
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def find_source_of_40365():
    await init_db()
    db = await get_raw_db()

    user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)
    if not user:
        user = await User.find_one()

    tenant_id_str = str(user.tenant_id or "69cd7f0a8f3f6866d4cfbb62")
    tenant_cond = {"tenant_id": {"$in": [tenant_id_str, ObjectId(tenant_id_str)]}} if ObjectId.is_valid(tenant_id_str) else {"tenant_id": tenant_id_str}

    print("Buscando qué sucursal, período o vista produce Bs. 40,365.64...")

    # A) ¿Es una sucursal específica?
    sucursales = await db.sucursales.find(tenant_cond).to_list(length=None)
    for suc in sucursales:
        s_id_str = str(suc["_id"])
        start_utc, end_utc = SalesReadService.calculate_bolivia_date_range("2026-07-29", "2026-08-27")
        q_suc = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start_utc, "$lt": end_utc},
            "sucursal_id": {"$in": [s_id_str, ObjectId(s_id_str)] if ObjectId.is_valid(s_id_str) else [s_id_str]},
            **tenant_cond
        }
        docs = await db.sales.find(q_suc).to_list(length=None)
        monto = sum(safe_float(d.get("total", 0.0)) for d in docs)
        print(f"Sucursal '{suc.get('nombre')}': Bs. {monto:,.2f}")

    # B) ¿Es un rango de fechas diferente? Ej: 2026-07-29 a 2026-08-25 o 2026-07-01 a 2026-07-31?
    for d_start in ["2026-07-01", "2026-07-15", "2026-07-20", "2026-07-25", "2026-07-29", "2026-08-01"]:
        for d_end in ["2026-08-20", "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27"]:
            start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(d_start, d_end)
            q_dates = {
                "anulada": {"$ne": True},
                "created_at": {"$gte": start_utc, "$lt": end_utc},
                **tenant_cond
            }
            docs = await db.sales.find(q_dates).to_list(length=None)
            monto = sum(safe_float(d.get("total", 0.0)) for d in docs)
            if abs(monto - 40365.64) < 1000:
                print(f"🎯 COINCIDENCIA CERCANA: {d_start} -> {d_end}: Bs. {monto:,.2f} ({len(docs)} tickets)")


if __name__ == "__main__":
    asyncio.run(find_source_of_40365())
