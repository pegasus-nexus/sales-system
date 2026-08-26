from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId

from app.domain.repositories.bi_repository import BIRepository
from app.domain.models.user import User
from app.application.services.sales_read_service import SalesReadService, safe_float
from app.db import get_raw_db


class MongoBIRepository(BIRepository):
    """
    Implementación del repositorio analítico de BI utilizando la capa unificada
    SalesReadService para garantizar 100% de coincidencia con el Historial de Ventas.
    """

    async def get_raw_sales(
        self,
        user_or_tenant: Any,
        start_utc: Optional[datetime] = None,
        end_utc: Optional[datetime] = None,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return []

    async def get_raw_sales_by_dates(
        self,
        user: User,
        start_date_str: str,
        end_date_str: str,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return await SalesReadService.get_raw_sales_for_user(
            user=user,
            start_date_str=start_date_str,
            end_date_str=end_date_str,
            sucursal_id=sucursal_id
        )

    async def get_sucursales(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await get_raw_db()
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

    async def get_products_dim(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {"is_active": {"$ne": False}}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            tenant_conditions = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                tenant_conditions.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": tenant_conditions}

        cursor = db.products.find(filter_query)
        docs = await cursor.to_list(length=None)
        res = []
        for d in docs:
            res.append({
                "_id": str(d["_id"]),
                "descripcion": d.get("descripcion", ""),
                "categoria_id": str(d.get("categoria_id", "")),
                "precio_venta": safe_float(d.get("precio_venta"))
            })
        return res

    async def get_categories_dim(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {"is_active": {"$ne": False}}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            tenant_conditions = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                tenant_conditions.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": tenant_conditions}

        cursor = db.categories.find(filter_query)
        docs = await cursor.to_list(length=None)
        res = []
        for d in docs:
            res.append({
                "_id": str(d["_id"]),
                "name": d.get("name", "")
            })
        return res
