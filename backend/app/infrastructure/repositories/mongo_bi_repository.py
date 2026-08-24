from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId

from app.domain.repositories.bi_repository import BIRepository
from app.db import get_raw_db


class MongoBIRepository(BIRepository):
    """
    Implementación del repositorio analítico de BI utilizando PyMongo raw_db.
    Garantiza aislamiento estricto por tenant_id y extracción limpia sin mutaciones.
    """

    async def _get_db(self):
        return await get_raw_db()

    async def get_raw_sales(
        self,
        tenant_id: str,
        start_utc: datetime,
        end_utc: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = await self._get_db()
        
        match_stage: Dict[str, Any] = {
            "tenant_id": str(tenant_id),
            "created_at": {"$gte": start_utc, "$lte": end_utc},
            "anulada": {"$ne": True}
        }
        
        if sucursal_id and sucursal_id.lower() not in ["all", "todas", "global", ""]:
            # Soportar búsqueda por ObjectId o string id
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
            return float(val)

        # Convertir ObjectId y Decimals a formatos estándar de Python
        cleaned_sales = []
        for doc in sales_docs:
            doc["_id"] = str(doc["_id"])
            if "sucursal_id" in doc and isinstance(doc["sucursal_id"], ObjectId):
                doc["sucursal_id"] = str(doc["sucursal_id"])
            doc["total"] = safe_float(doc.get("total", 0.0))
            cleaned_sales.append(doc)
            
        return cleaned_sales

    async def get_sucursales(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await self._get_db()
        cursor = db.sucursales.find({"tenant_id": str(tenant_id), "is_deleted": {"$ne": True}})
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
