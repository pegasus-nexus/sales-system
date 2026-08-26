from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId, Decimal128

from app.db import get_raw_db
from app.core.config import BUSINESS_TIMEZONE
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def safe_float_bi(val) -> float:
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


class MongoClientesRepository:
    """
    Repositorio de lectura limpia para el Módulo de BI de Clientes y Métodos de Pago.
    Lee directamente las colecciones operacionales MongoDB: sales, clientes, cuentas_credito.
    """

    async def get_raw_sales_for_period(
        self,
        user: User,
        start_date_str: str,
        end_date_str: str,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = await get_raw_db()

        s_dt = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        e_dt = datetime.strptime(end_date_str, "%Y-%m-%d").date()

        start_bolivia = datetime.combine(s_dt, datetime.min.time(), tzinfo=BOLIVIA_TZ)
        end_bolivia = datetime.combine(e_dt + timedelta(days=1), datetime.min.time(), tzinfo=BOLIVIA_TZ)

        start_utc = start_bolivia.astimezone(timezone.utc)
        end_utc = end_bolivia.astimezone(timezone.utc)

        query: Dict[str, Any] = {
            "created_at": {"$gte": start_utc, "$lt": end_utc},
            "anulada": {"$ne": True}
        }

        # Aislamiento por Tenant
        if user.tenant_id and str(user.tenant_id) not in ["all", "default", ""]:
            t_cond = [str(user.tenant_id)]
            if ObjectId.is_valid(user.tenant_id):
                t_cond.append(ObjectId(user.tenant_id))
            query["tenant_id"] = {"$in": t_cond}

        # Filtro de Sucursal
        if sucursal_id and sucursal_id not in ["all", "None", ""]:
            s_cond = [str(sucursal_id)]
            if ObjectId.is_valid(sucursal_id):
                s_cond.append(ObjectId(sucursal_id))
            query["sucursal_id"] = {"$in": s_cond}

        cursor = db.sales.find(query)
        return await cursor.to_list(length=None)

    async def get_clientes_dim(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {"is_active": {"$ne": False}}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        cursor = db.clientes.find(filter_query)
        docs = await cursor.to_list(length=None)
        res = []
        for d in docs:
            res.append({
                "_id": str(d["_id"]),
                "nombre": d.get("nombre", "Cliente Sin Nombre"),
                "nit_ci": str(d.get("nit_ci") or "Sin NIT/CI"),
                "email": d.get("email", ""),
                "telefono": d.get("telefono", "")
            })
        return res

    async def get_cuentas_credito_summary(self, tenant_id: str) -> Dict[str, Any]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        cursor = db.cuentas_credito.find(filter_query)
        docs = await cursor.to_list(length=None)

        total_cuentas = len(docs)
        saldo_cartera = sum(safe_float_bi(d.get("saldo_total")) for d in docs)
        al_dia_cnt = sum(1 for d in docs if str(d.get("estado_cuenta")).upper() in ["AL_DIA", "AL DIA", "OK"])
        mora_cnt = sum(1 for d in docs if str(d.get("estado_cuenta")).upper() in ["MORA", "EN_MORA", "VENCIDA"])

        return {
            "total_cuentas": total_cuentas,
            "saldo_total": round(saldo_cartera, 2),
            "cuentas_al_dia": al_dia_cnt,
            "cuentas_mora": mora_cnt
        }
