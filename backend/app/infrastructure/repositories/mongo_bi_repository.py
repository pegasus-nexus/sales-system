from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.domain.repositories.bi_repository import BIRepository
from app.db import get_raw_db
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class MongoBIRepository(BIRepository):
    """
    Implementación del repositorio analítico de BI utilizando PyMongo raw_db.
    Reutiliza la exactitud de consulta del Historial de Ventas (GET /sales),
    garantizando que tanto SUPERADMIN como usuarios de Tenant consulten
    MongoDB sales en la zona horaria oficial America/La_Paz.
    """

    async def _get_db(self):
        return await get_raw_db()

    async def get_raw_sales(
        self,
        tenant_id: str,
        start_utc: Optional[datetime] = None,
        end_utc: Optional[datetime] = None,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = await self._get_db()

        match_stage: Dict[str, Any] = {
            "anulada": {"$ne": True}
        }

        # Aislamiento por tenant_id (si tenant_id no es 'all', 'test-taboada' o vacío para SUPERADMIN)
        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            tenant_conditions = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                tenant_conditions.append(ObjectId(tenant_id))
            match_stage["tenant_id"] = {"$in": tenant_conditions}

        # Rango de Fechas en UTC derivado de America/La_Paz (coincide con Historial get_range_bolivia)
        if start_utc and end_utc:
            if start_utc == end_utc or (end_utc - start_utc).total_seconds() < 86400:
                end_utc = start_utc + timedelta(days=1)
            match_stage["created_at"] = {"$gte": start_utc, "$lt": end_utc}

        # Filtro por Sucursal
        if sucursal_id and sucursal_id.lower() not in ["all", "todas", "global", ""]:
            if ObjectId.is_valid(sucursal_id):
                match_stage["$or"] = [
                    {"sucursal_id": str(sucursal_id)},
                    {"sucursal_id": ObjectId(sucursal_id)}
                ]
            else:
                match_stage["sucursal_id"] = str(sucursal_id)

        projection = {
            "_id": 1,
            "tenant_id": 1,
            "numero_ticket": 1,
            "sucursal_id": 1,
            "created_at": 1,
            "total": 1,
            "descuento": 1,
            "anulada": 1,
            "estado_pago": 1,
            "idempotency_key": 1,
            "items": 1,
            "pagos": 1
        }

        cursor = db.sales.find(match_stage, projection)
        sales_docs = await cursor.to_list(length=None)

        def safe_float(val) -> float:
            if val is None:
                return 0.0
            if hasattr(val, "to_decimal"):
                return float(val.to_decimal())
            try:
                return float(val)
            except Exception:
                return 0.0

        cleaned_sales = []
        for doc in sales_docs:
            doc["_id"] = str(doc["_id"])
            if "sucursal_id" in doc:
                if isinstance(doc["sucursal_id"], ObjectId):
                    doc["sucursal_id"] = str(doc["sucursal_id"])
                elif not doc["sucursal_id"]:
                    doc["sucursal_id"] = "CENTRAL"
            else:
                doc["sucursal_id"] = "CENTRAL"

            doc["total"] = safe_float(doc.get("total", 0.0))
            cleaned_sales.append(doc)

        return cleaned_sales

    async def get_sucursales(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await self._get_db()
        filter_query: Dict[str, Any] = {"is_deleted": {"$ne": True}}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            tenant_conditions = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                tenant_conditions.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": tenant_conditions}

        cursor = db.sucursales.find(filter_query)
        docs = await cursor.to_list(length=None)

        result = []
        for d in docs:
            result.append({
                "sucursal_id": str(d["_id"]),
                "nombre": d.get("nombre", "Sin Nombre"),
                "ciudad": d.get("ciudad", ""),
                "direccion": d.get("direccion", "")
            })
        return result
