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


class MongoDescuentosRepository:
    """
    Repositorio de lectura limpia para el Módulo de BI de Descuentos y Promociones.
    Lee directamente las colecciones operacionales MongoDB: descuentos y sales.
    """

    async def get_raw_descuentos_catalog(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        cursor = db.descuentos.find(filter_query)
        docs = await cursor.to_list(length=None)
        res = []
        for d in docs:
            res.append({
                "_id": str(d["_id"]),
                "nombre": d.get("nombre", "Descuento Sin Nombre"),
                "tipo": d.get("tipo", "PORCENTAJE"),
                "valor": safe_float_bi(d.get("valor")),
                "is_active": d.get("is_active", True),
                "uso_actual": int(d.get("uso_actual") or 0),
                "uso_maximo": int(d.get("uso_maximo") or 0)
            })
        return res

    async def get_raw_sales_with_discounts(
        self,
        user: User,
        start_date_str: Optional[str] = None,
        end_date_str: Optional[str] = None,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        query: Dict[str, Any] = {
            "anulada": {"$ne": True},
            "descuento": {"$exists": True, "$ne": None}
        }

        if start_date_str and end_date_str:
            s_dt = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            e_dt = datetime.strptime(end_date_str, "%Y-%m-%d").date()

            start_bolivia = datetime.combine(s_dt, datetime.min.time(), tzinfo=BOLIVIA_TZ)
            end_bolivia = datetime.combine(e_dt + timedelta(days=1), datetime.min.time(), tzinfo=BOLIVIA_TZ)

            query["created_at"] = {
                "$gte": start_bolivia.astimezone(timezone.utc),
                "$lt": end_bolivia.astimezone(timezone.utc)
            }

        # Aislamiento por Tenant
        if user.tenant_id and str(user.tenant_id) not in ["all", "default", ""]:
            t_cond = [str(user.tenant_id)]
            if ObjectId.is_valid(user.tenant_id):
                t_cond.append(ObjectId(user.tenant_id))
            query["tenant_id"] = {"$in": t_cond}

        # Filtro por sucursal
        if sucursal_id and sucursal_id not in ["all", "None", ""]:
            s_cond = [str(sucursal_id)]
            if ObjectId.is_valid(sucursal_id):
                s_cond.append(ObjectId(sucursal_id))
            query["sucursal_id"] = {"$in": s_cond}

        cursor = db.sales.find(query)
        return await cursor.to_list(length=None)
