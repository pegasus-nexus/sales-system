from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId

from app.domain.repositories.analytics_repository import AnalyticsRepository
from app.db import get_raw_db
from app.utils.date_utils import get_range_bolivia

DEFAULT_TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

class MongoAnalyticsRepository(AnalyticsRepository):
    """
    Implementación de AnalyticsRepository usando PyMongo directamente (raw_db).
    Garantiza cobertura 100% de la zona horaria de Bolivia (-04:00) para no recortar ventas nocturnas.
    """

    async def _get_db(self):
        return await get_raw_db()

    def _resolve_tenant_id(self, tenant_id: Optional[str]) -> str:
        if not tenant_id or str(tenant_id).lower() in ["none", "null", "undefined", ""]:
            return DEFAULT_TENANT_ID
        return tenant_id

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

        s_lower = sucursal_id.lower()
        if "hero" in s_lower:
            or_conditions.append({"sucursal_nombre": {"$regex": "Hero", "$options": "i"}})
            or_conditions.append({"sucursal_id": "69cd80098f3f6866d4cfbb64"})
            or_conditions.append({"sucursal_id": ObjectId("69cd80098f3f6866d4cfbb64")})
        elif "recoleta" in s_lower:
            or_conditions.append({"sucursal_nombre": {"$regex": "Recoleta", "$options": "i"}})
            or_conditions.append({"sucursal_id": "69cd84c58f3f6866d4cfbc8b"})
            or_conditions.append({"sucursal_id": ObjectId("69cd84c58f3f6866d4cfbc8b")})
        elif "calacoto" in s_lower:
            or_conditions.append({"sucursal_nombre": {"$regex": "Calacoto", "$options": "i"}})
            or_conditions.append({"sucursal_id": "69ce6b7e8a00124dac6ecc99"})
            or_conditions.append({"sucursal_id": ObjectId("69ce6b7e8a00124dac6ecc99")})
        else:
            or_conditions.append({"sucursal_id": sucursal_id})

        return {"$or": or_conditions}

    async def get_total_sales_and_orders(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        db = await self._get_db()
        t_id = self._resolve_tenant_id(tenant_id)
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": t_id,
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
        db = await self._get_db()
        t_id = self._resolve_tenant_id(tenant_id)
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": t_id,
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
        db = await self._get_db()
        t_id = self._resolve_tenant_id(tenant_id)
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": t_id,
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
        db = await self._get_db()
        t_id = self._resolve_tenant_id(tenant_id)
        s_dt, e_dt = self._sanitize_dates(start_date, end_date)

        match_stage: Dict[str, Any] = {
            "tenant_id": t_id,
            "created_at": {"$gte": s_dt, "$lte": e_dt},
            "anulada": {"$ne": True}
        }
        
        suc_match = self._build_sucursal_match(sucursal_id)
        if suc_match:
            match_stage.update(suc_match)

        return await db.sales.find(match_stage, {"created_at": 1, "total": 1}).to_list(length=None)
