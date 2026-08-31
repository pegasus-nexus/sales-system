import asyncio
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User
from app.application.services.sales_read_service import safe_float, SalesReadService
from app.application.services.bi_service import BIService
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def run_timezone_boundary_audit():
    await init_db()
    db = await get_raw_db()

    print("=" * 110)
    print("FASE 1 & 4 — AUDITORÍA DE TIMEZONE Y BOUNDARY DE MONGODB PARA 2026-08-27")
    print("=" * 110)

    target_date_str = "2026-08-27"

    # 1. CÁLCULO DE LÍMITES TEMPORALES POR SALESREADSERVICE
    start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(target_date_str, target_date_str)

    # Convertir a hora Bolivia para visualización explícita
    start_local = start_utc.astimezone(BOLIVIA_TZ)
    end_local = end_utc.astimezone(BOLIVIA_TZ)

    print(f"\n[1. CÁLCULO DE BOUNDARIES EN AMERICA/LA_PAZ Y UTC]:")
    print(f"  Fecha solicitada : '{target_date_str}'")
    print(f"  START LOCAL      : {start_local.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"  START UTC        : {start_utc.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"  END LOCAL        : {end_local.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"  END UTC          : {end_utc.strftime('%Y-%m-%d %H:%M:%S %Z')}")

    # 2. BÚSQUEDA DIRECTA EN MONGODB SIN FILTROS DE TENANT / ROL
    query_mongo = {
        "anulada": {"$ne": True},
        "created_at": {"$gte": start_utc, "$lt": end_utc}
    }

    docs = await db.sales.find(query_mongo).sort("created_at", 1).to_list(length=None)
    monto_total = sum(safe_float(d.get("total", 0.0)) for d in docs)

    print(f"\n[2. DOCUMENTOS REALES EN MONGODB 'sales' PARA EL RANGO {target_date_str}]:")
    print(f"  Total Documentos Encontrados : {len(docs)}")
    print(f"  Monto Acumulado Total        : Bs. {monto_total:,.2f}")

    if docs:
        print("\n  DETALLE DE LAS PRIMERAS Y ÚLTIMAS VENTAS ENCONTRADAS:")
        for idx, doc in enumerate(docs[:5] + docs[-3:] if len(docs) > 8 else docs):
            c_at = doc.get("created_at")
            c_at_bolivia = c_at.astimezone(BOLIVIA_TZ) if isinstance(c_at, datetime) else c_at
            print(f"   [{idx+1:02d}] ID: {str(doc['_id'])} | created_at UTC: {c_at} | created_at Bolivia: {c_at_bolivia} | total: Bs. {safe_float(doc.get('total', 0.0)):,.2f} | sucursal_id: {doc.get('sucursal_id')}")

    # 3. BÚSQUEDA DE DOCUMENTOS ADYACENTES (AMPLIANDO RANGO -1 DÍA Y +1 DÍA)
    prev_date_str = "2026-08-26"
    next_date_str = "2026-08-28"
    start_prev_utc, end_next_utc = SalesReadService.calculate_bolivia_date_range(prev_date_str, next_date_str)
    all_adj_docs = await db.sales.find({"anulada": {"$ne": True}, "created_at": {"$gte": start_prev_utc, "$lt": end_next_utc}}).sort("created_at", 1).to_list(length=None)

    print(f"\n[3. MUESTRA ADYACENTE DESDE {prev_date_str} HASTA {next_date_str}]:")
    print(f"  Total documentos en ventana de 3 días (26 al 28 de agosto): {len(all_adj_docs)}")
    if all_adj_docs:
        min_dt = min(d['created_at'] for d in all_adj_docs)
        max_dt = max(d['created_at'] for d in all_adj_docs)
        print(f"  Timestamp Mínimo real encontrado : {min_dt} UTC ({min_dt.astimezone(BOLIVIA_TZ)} Bolivia)")
        print(f"  Timestamp Máximo real encontrado : {max_dt} UTC ({max_dt.astimezone(BOLIVIA_TZ)} Bolivia)")

    print("\n" + "=" * 110)


if __name__ == "__main__":
    asyncio.run(run_timezone_boundary_audit())
