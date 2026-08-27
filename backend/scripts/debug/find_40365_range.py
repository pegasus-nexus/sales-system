import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.application.services.sales_read_service import safe_float, SalesReadService
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def find_range():
    await init_db()
    db = await get_raw_db()
    user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)
    if not user:
        user = await User.find_one()

    tenant_id_str = str(user.tenant_id or "69cd7f0a8f3f6866d4cfbb62")
    tenant_cond = {"tenant_id": {"$in": [tenant_id_str, ObjectId(tenant_id_str)]}} if ObjectId.is_valid(tenant_id_str) else {"tenant_id": tenant_id_str}

    # Probar rangos mensuales y de fechas específicas
    test_ranges = [
        ("2026-08-01", "2026-08-27"),
        ("2026-07-01", "2026-07-31"),
        ("2026-07-29", "2026-08-20"),
        ("2026-07-29", "2026-08-22"),
        ("2026-07-29", "2026-08-24"),
        ("2026-07-29", "2026-08-25"),
        ("2026-08-01", "2026-08-25"),
        ("2026-08-01", "2026-08-20"),
    ]

    for s_str, e_str in test_ranges:
        start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(s_str, e_str)
        q = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start_utc, "$lt": end_utc},
            **tenant_cond
        }
        docs = await db.sales.find(q).to_list(length=None)
        monto = sum(safe_float(d.get("total", 0.0)) for d in docs)
        print(f"Rango {s_str} -> {e_str}: Bs. {monto:,.2f} ({len(docs)} tks)")


if __name__ == "__main__":
    asyncio.run(find_range())
