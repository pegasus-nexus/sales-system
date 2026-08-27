from typing import List, Dict, Any, Optional
from datetime import datetime
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


class MongoInventarioRepository:
    """
    Repositorio de lectura limpia para el Módulo de BI de Inventario y Control de Stock.
    Lee directamente las colecciones operacionales MongoDB: inventario, products, sucursales.
    """

    async def get_raw_inventario(
        self,
        user: User,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        # Aislamiento por Tenant
        if user.tenant_id and str(user.tenant_id) not in ["all", "default", ""]:
            t_cond = [str(user.tenant_id)]
            if ObjectId.is_valid(user.tenant_id):
                t_cond.append(ObjectId(user.tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        # Filtro opcional por Sucursal
        if sucursal_id and sucursal_id not in ["all", "None", ""]:
            s_cond = [str(sucursal_id)]
            if ObjectId.is_valid(sucursal_id):
                s_cond.append(ObjectId(sucursal_id))
            filter_query["sucursal_id"] = {"$in": s_cond}

        cursor = db.inventario.find(filter_query)
        return await cursor.to_list(length=None)

    async def get_products_dim(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        cursor = db.products.find(filter_query)
        docs = await cursor.to_list(length=None)
        res = []
        for d in docs:
            costo = safe_float_bi(d.get("costo_producto") if d.get("costo_producto") is not None else (d.get("costo") or d.get("costo_unitario") or 0.0))
            res.append({
                "_id": str(d["_id"]),
                "nombre": str(d.get("nombre") or d.get("descripcion") or "Producto Sin Nombre"),
                "categoria_nombre": str(d.get("categoria_nombre") or d.get("categoria") or "Sin Categoría"),
                "costo_producto": costo,
                "precio_venta": safe_float_bi(d.get("precio_venta") or d.get("precio"))
            })
        return res

    async def get_sucursales_dim(self, tenant_id: str) -> List[Dict[str, Any]]:
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if tenant_id and tenant_id not in ["all", "test-taboada", "None", "default", ""]:
            t_cond = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                t_cond.append(ObjectId(tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        cursor = db.sucursales.find(filter_query)
        docs = await cursor.to_list(length=None)
        res = []
        for d in docs:
            res.append({
                "_id": str(d["_id"]),
                "nombre": d.get("nombre", "Sucursal Sin Nombre"),
                "ciudad": str(d.get("ciudad") or "Sin Ciudad")
            })
        return res
