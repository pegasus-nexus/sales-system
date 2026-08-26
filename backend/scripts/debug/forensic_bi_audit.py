import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from bson import ObjectId
from bson.decimal128 import Decimal128
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token
from app.core.config import BUSINESS_TIMEZONE
from app.utils.date_utils import get_range_bolivia
from app.application.services.sales_read_service import SalesReadService, safe_float
from app.application.services.bi_service import BIService
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def run_forensic_audit():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA FORENSE PASO A PASO (HISTORIAL DE VENTAS VS PANEL GENERAL BI)")
    print("=" * 90)

    # 1. Obtener usuario de prueba
    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    print(f"USUARIO AUTENTICADO: {user.email}")
    print(f"  Rol: {user.role} | Tenant ID: '{user.tenant_id}' | Sucursal ID: '{user.sucursal_id}'")

    dates = ["2026-08-24", "2026-08-25"]

    for d_str in dates:
        print(f"\n" + "─" * 90)
        print(f"🔍 INSPECCIÓN FORENSE PARA LA FECHA: {d_str} (America/La_Paz)")
        print("─" * 90)

        # ---------------------------------------------------------------------
        # CAPA 1: MONGODB DIRECTO (db.sales)
        # ---------------------------------------------------------------------
        start_utc, end_utc = get_range_bolivia(d_str, d_str)

        # Recrear el filtro de tenant exactamente como lo hace MongoDB/Beanie
        tenant_conditions = [str(user.tenant_id)]
        if ObjectId.is_valid(user.tenant_id):
            tenant_conditions.append(ObjectId(user.tenant_id))

        query_c1 = {
            "created_at": {"$gte": start_utc, "$lte": end_utc},
            "anulada": {"$ne": True},
            "tenant_id": {"$in": tenant_conditions}
        }

        cursor_c1 = db.sales.find(query_c1)
        docs_c1 = await cursor_c1.to_list(None)

        total_c1 = sum(safe_float(doc.get("total")) for doc in docs_c1)
        print(f"CAPA 1 [MongoDB db.sales Directo]:")
        print(f"  Filtro Mongo: {query_c1}")
        print(f"  Rango UTC: {start_utc} <= created_at <= {end_utc}")
        print(f"  Documentos Encontrados: {len(docs_c1)}")
        print(f"  Suma Total: Bs. {total_c1:,.2f}")
        if len(docs_c1) > 0:
            sample_3 = docs_c1[:3]
            print("  Muestra de 3 Documentos Reales:")
            for s in sample_3:
                print(f"    - ID: {s['_id']} | Ticket: {s.get('numero_ticket')} | created_at: {s.get('created_at')} | tenant_id: {s.get('tenant_id')} (tipo {type(s.get('tenant_id')).__name__}) | total: {s.get('total')} (tipo {type(s.get('total')).__name__})")

        # ---------------------------------------------------------------------
        # CAPA 2: ENDPOINT DE HISTORIAL (GET /api/v1/sales)
        # ---------------------------------------------------------------------
        token = create_access_token(data={"sub": user.email})
        headers = {"Authorization": f"Bearer {token}"}
        transport = ASGITransport(app=app)

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res_sales = await client.get(f"/api/v1/sales?start_date={d_str}&end_date={d_str}&limit=500", headers=headers)
            print(f"\nCAPA 2 [Endpoint GET /api/v1/sales]:")
            print(f"  Status Code: {res_sales.status_code}")
            if res_sales.status_code == 200:
                data_s = res_sales.json()
                items_s = data_s.get("items", [])
                total_c2 = sum(float(x.get("total", 0.0)) for x in items_s if not x.get("anulada"))
                print(f"  Documentos Encontrados (items): {len(items_s)}")
                print(f"  Suma Total: Bs. {total_c2:,.2f}")
            else:
                print(f"  ❌ Error HTTP: {res_sales.text}")
                items_s = []
                total_c2 = 0.0

        # ---------------------------------------------------------------------
        # CAPA 3: SERVICIO COMPARTIDO (SalesReadService)
        # ---------------------------------------------------------------------
        raw_c3 = await SalesReadService.get_raw_sales_for_user(user=user, start_date_str=d_str, end_date_str=d_str)
        total_c3 = sum(doc.get("total", 0.0) for doc in raw_c3)
        print(f"\nCAPA 3 [SalesReadService.get_raw_sales_for_user]:")
        print(f"  Documentos Encontrados: {len(raw_c3)}")
        print(f"  Suma Total: Bs. {total_c3:,.2f}")

        # ---------------------------------------------------------------------
        # CAPA 4 & 5: PANDAS ETL Y BISERVICE
        # ---------------------------------------------------------------------
        repo = MongoBIRepository()
        bi_service = BIService(repository=repo)
        bi_resp = await bi_service.get_panel_general(current_user=user, start_date=d_str, end_date=d_str)

        print(f"\nCAPA 4 & 5 [BIService & Pandas Star Schema]:")
        print(f"  Órdenes en BIPanelGeneralResponse: {bi_resp.cantidad_ordenes}")
        print(f"  Ingresos Totales: Bs. {bi_resp.ingresos_totales:,.2f}")
        print(f"  Ticket Medio: Bs. {bi_resp.ticket_medio:,.2f}")

        # ---------------------------------------------------------------------
        # CAPA 6: ENDPOINT REAL DE BI (GET /api/v1/bi/panel-general)
        # ---------------------------------------------------------------------
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res_bi = await client.get(f"/api/v1/bi/panel-general?start_date={d_str}&end_date={d_str}&sucursal_id=all", headers=headers)
            print(f"\nCAPA 6 [Endpoint GET /api/v1/bi/panel-general]:")
            print(f"  Status Code: {res_bi.status_code}")
            if res_bi.status_code == 200:
                data_bi = res_bi.json()
                print(f"  Órdenes en JSON Endpoint: {data_bi.get('cantidad_ordenes')}")
                print(f"  Ingresos Totales en JSON: Bs. {data_bi.get('ingresos_totales'):,.2f}")
                print(f"  Estado Sincronización: '{data_bi.get('estado_sincronizacion')}'")
            else:
                print(f"  ❌ Error HTTP BI: {res_bi.text}")

if __name__ == "__main__":
    asyncio.run(run_forensic_audit())
