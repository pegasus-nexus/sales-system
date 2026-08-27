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


class MongoEjecutivoRepository:
    """
    Repositorio de lectura limpia para el Módulo de Resumen Ejecutivo BI (Fase 10).
    Consolida de manera trazable las colecciones operacionales MongoDB: sales, products, descuentos, sucursales.
    """

    async def get_raw_sales(
        self,
        user: User,
        start_date_str: Optional[str] = None,
        end_date_str: Optional[str] = None,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        query: Dict[str, Any] = {
            "anulada": {"$ne": True}
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

    async def get_products_cost_map(self, tenant_id: str) -> Dict[str, float]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        cursor = db.products.find(filter_query, {"_id": 1, "costo_producto": 1, "costo": 1, "precio_costo": 1})
        docs = await cursor.to_list(length=None)
        cost_map = {}
        for d in docs:
            p_id = str(d["_id"])
            c_val = d.get("costo_producto")
            if c_val is None:
                c_val = d.get("costo")
            if c_val is None:
                c_val = d.get("precio_costo")
            cost_map[p_id] = safe_float_bi(c_val)
        return cost_map

    async def get_inventory_summary(self, tenant_id: str) -> Dict[str, float]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if tenant_id and str(tenant_id) not in ["all", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        cursor = db.products.find(filter_query, {"_id": 1, "stock": 1, "stock_actual": 1, "costo_producto": 1, "costo": 1})
        docs = await cursor.to_list(length=None)

        tot_units = 0.0
        tot_val = 0.0

        for d in docs:
            stk = safe_float_bi(d.get("stock") if d.get("stock") is not None else d.get("stock_actual"))
            cost = safe_float_bi(d.get("costo_producto") if d.get("costo_producto") is not None else d.get("costo"))
            if stk > 0:
                tot_units += stk
                tot_val += (stk * cost)

        return {
            "total_unidades_stock": round(tot_units, 2),
            "valorizacion_costo_stock": round(tot_val, 2)
        }

    async def get_descuentos_summary(self, tenant_id: str) -> Dict[str, Any]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if tenant_id and str(tenant_id) not in ["all", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        count_promos = await db.descuentos.count_documents(filter_query)
        return {"promociones_configuradas": count_promos}

    async def get_sucursales_map(self) -> Dict[str, str]:
        db = await get_raw_db()
        cursor = db.sucursales.find({})
        docs = await cursor.to_list(length=None)
        s_map = {}
        for d in docs:
            s_map[str(d["_id"])] = d.get("nombre", "Sucursal Sin Nombre")
        return s_map
