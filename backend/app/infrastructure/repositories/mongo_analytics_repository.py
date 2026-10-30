from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from bson import ObjectId

from app.domain.repositories.analytics_repository import AnalyticsRepository
from app.db import get_raw_db
from app.utils.date_utils import get_range_bolivia


class MongoAnalyticsRepository(AnalyticsRepository):
    """
    Implementación de AnalyticsRepository usando PyMongo directamente (raw_db).
    Aislamiento estricto de Tenant: nunca comparte datos entre empresas distintas.
    Garantiza cobertura 100% de la zona horaria de Bolivia (-04:00) para no recortar ventas nocturnas.
    """

    async def _get_db(self):
        return await get_raw_db()

    def _resolve_tenant_conditions(self, tenant_id: Optional[str]) -> Optional[List[Any]]:
        if not tenant_id or str(tenant_id).lower() in ["none", "null", "undefined", "", "default"]:
            return None
        conds = [str(tenant_id)]
        if ObjectId.is_valid(tenant_id):
            conds.append(ObjectId(tenant_id))
        return conds

    def _sanitize_dates(self, start_date: datetime, end_date: datetime) -> tuple[datetime, datetime]:
        """
        Ajusta las fechas para cubrir el día completo en hora local de Bolivia (UTC-4).
        Cubre desde las 00:00:00 Bolivia (04:00:00 UTC) hasta las 23:59:59.999 Bolivia (03:59:59 UTC del día siguiente).
        """
        try:
            s_str = start_date.strftime("%Y-%m-%d")
            e_str = end_date.strftime("%Y-%m-%d")
            return get_range_bolivia(s_str, e_str)
        except Exception:
            return (start_date, end_date)

    def _build_sucursal_match(self, sucursal_id: Optional[str]) -> Optional[Dict[str, Any]]:
        if not sucursal_id or sucursal_id.lower() in ["all", "todas", "global", ""]:
            return None

        or_conditions = []
        if ObjectId.is_valid(sucursal_id):
            or_conditions.append({"sucursal_id": ObjectId(sucursal_id)})
            or_conditions.append({"sucursal_id": str(sucursal_id)})
        else:
            or_conditions.append({"sucursal_id": str(sucursal_id)})
            or_conditions.append({"sucursal_nombre": {"$regex": f"^{re.escape(sucursal_id)}$", "$options": "i"}})

        return {"$or": or_conditions}

    async def get_total_sales_and_orders(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        tenant_conds = self._resolve_tenant_conditions(tenant_id)
        if not tenant_conds:
            return {"total_ventas": 0.0, "cantidad_ventas": 0}

        db = await self._get_db()
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": {"$in": tenant_conds},
            "created_at": {"$gte": s_dt, "$lte": e_dt},
            "anulada": {"$ne": True}
        }
        
        suc_match = self._build_sucursal_match(sucursal_id)
        if suc_match:
            match_stage.update(suc_match)

        pipeline = [
            {"$match": match_stage},
            {"$group": {
                "_id": None,
                "total_ventas": {"$sum": {"$toDouble": "$total"}},
                "cantidad_ventas": {"$sum": 1}
            }}
        ]
        result = await db.sales.aggregate(pipeline).to_list(length=1)
        if not result:
            return {"total_ventas": 0.0, "cantidad_ventas": 0}
        
        return {
            "total_ventas": result[0].get("total_ventas", 0.0),
            "cantidad_ventas": result[0].get("cantidad_ventas", 0)
        }

    async def get_hourly_sales_distribution(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        tenant_conds = self._resolve_tenant_conditions(tenant_id)
        if not tenant_conds:
            return []

        db = await self._get_db()
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": {"$in": tenant_conds},
            "created_at": {"$gte": s_dt, "$lte": e_dt},
            "anulada": {"$ne": True}
        }
        
        suc_match = self._build_sucursal_match(sucursal_id)
        if suc_match:
            match_stage.update(suc_match)

        pipeline = [
            {"$match": match_stage},
            {"$addFields": {
                "hour": {"$hour": {"date": "$created_at", "timezone": "-04:00"}},
                "num_total": {"$toDouble": "$total"}
            }},
            {"$group": {
                "_id": "$hour",
                "total_ventas": {"$sum": "$num_total"},
                "cantidad_ventas": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        return await db.sales.aggregate(pipeline).to_list(length=24)

    async def get_sales_by_payment_method(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        tenant_conds = self._resolve_tenant_conditions(tenant_id)
        if not tenant_conds:
            return []

        db = await self._get_db()
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": {"$in": tenant_conds},
            "created_at": {"$gte": s_dt, "$lte": e_dt},
            "anulada": {"$ne": True}
        }
        
        suc_match = self._build_sucursal_match(sucursal_id)
        if suc_match:
            match_stage.update(suc_match)

        pipeline = [
            {"$match": match_stage},
            {"$unwind": "$pagos"},
            {"$group": {
                "_id": "$pagos.metodo",
                "monto_total": {"$sum": {"$toDouble": "$pagos.monto"}},
                "cantidad_transacciones": {"$sum": 1}
            }},
            {"$sort": {"monto_total": -1}}
        ]
        return await db.sales.aggregate(pipeline).to_list(length=100)

    async def get_raw_sales_for_period(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        tenant_conds = self._resolve_tenant_conditions(tenant_id)
        if not tenant_conds:
            return []

        db = await self._get_db()
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": {"$in": tenant_conds},
            "created_at": {"$gte": s_dt, "$lte": e_dt},
            "anulada": {"$ne": True}
        }
        
        suc_match = self._build_sucursal_match(sucursal_id)
        if suc_match:
            match_stage.update(suc_match)

        return await db.sales.find(match_stage, {"created_at": 1, "total": 1}).to_list(length=None)
