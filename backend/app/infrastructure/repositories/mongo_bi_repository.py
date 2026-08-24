from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId

from app.domain.repositories.bi_repository import BIRepository
from app.db import get_raw_db


class MongoBIRepository(BIRepository):
    """
    Implementación del repositorio analítico de BI utilizando PyMongo raw_db.
    Garantiza aislamiento por tenant_id soportando ObjectId y str, y extracción sin mutaciones.
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
        
        # Soportar tenant_id tanto en formato String como ObjectId
        tenant_conditions = [str(tenant_id)]
        if ObjectId.is_valid(tenant_id):
            tenant_conditions.append(ObjectId(tenant_id))

        match_stage: Dict[str, Any] = {
            "tenant_id": {"$in": tenant_conditions},
            "anulada": {"$ne": True}
        }

        if start_utc and end_utc:
            match_stage["created_at"] = {"$gte": start_utc, "$lte": end_utc}

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
        tenant_conditions = [str(tenant_id)]
        if ObjectId.is_valid(tenant_id):
            tenant_conditions.append(ObjectId(tenant_id))

        cursor = db.sucursales.find({"tenant_id": {"$in": tenant_conditions}, "is_deleted": {"$ne": True}})
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
