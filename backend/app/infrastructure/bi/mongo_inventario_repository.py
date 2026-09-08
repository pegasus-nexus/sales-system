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

    async def get_sales_velocity_by_product(
        self,
        user: User,
        sucursal_id: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, float]:
        """
        Calcula la velocidad promedio diaria de ventas (unidades/día) por producto.
        Soporta fallback histórico para asegurar que todos los productos reciban su velocidad proyectada.
        """
        from datetime import timezone, timedelta
        db = await get_raw_db()
        now_utc = datetime.now(timezone.utc)
        start_utc = now_utc - timedelta(days=days)

        query: Dict[str, Any] = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start_utc}
        }

        if user.tenant_id and str(user.tenant_id) not in ["all", "default", ""]:
            t_cond = [str(user.tenant_id)]
            if ObjectId.is_valid(user.tenant_id):
                t_cond.append(ObjectId(user.tenant_id))
            query["tenant_id"] = {"$in": t_cond}

        if sucursal_id and sucursal_id not in ["all", "None", ""]:
            s_cond = [str(sucursal_id)]
            if ObjectId.is_valid(sucursal_id):
                s_cond.append(ObjectId(sucursal_id))
            query["sucursal_id"] = {"$in": s_cond}

        pipeline = [
            {"$match": query},
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.producto_id",
                    "total_unidades": {"$sum": "$items.cantidad"}
                }
            }
        ]

        docs = await db.sales.aggregate(pipeline).to_list(length=None)
        res: Dict[str, float] = {}
        for d in docs:
            pid = str(d["_id"])
            total_qty = safe_float_bi(d.get("total_unidades"))
            res[pid] = round(total_qty / float(days), 3)

        # Fallback histórico sin límite rígido de fecha si las ventas en 30 días son escasas
        if len(res) < 5:
            query_all: Dict[str, Any] = {"anulada": {"$ne": True}}
            if user.tenant_id and str(user.tenant_id) not in ["all", "default", ""]:
                t_cond = [str(user.tenant_id)]
                if ObjectId.is_valid(user.tenant_id):
                    t_cond.append(ObjectId(user.tenant_id))
                query_all["tenant_id"] = {"$in": t_cond}
            if sucursal_id and sucursal_id not in ["all", "None", ""]:
                s_cond = [str(sucursal_id)]
                if ObjectId.is_valid(sucursal_id):
                    s_cond.append(ObjectId(sucursal_id))
                query_all["sucursal_id"] = {"$in": s_cond}

            pipeline_all = [
                {"$match": query_all},
                {"$unwind": "$items"},
                {
                    "$group": {
                        "_id": "$items.producto_id",
                        "total_unidades": {"$sum": "$items.cantidad"},
                        "primera_venta": {"$min": "$created_at"},
                        "ultima_venta": {"$max": "$created_at"}
                    }
                }
            ]
            docs_all = await db.sales.aggregate(pipeline_all).to_list(length=None)
            for d in docs_all:
                pid = str(d["_id"])
                if pid not in res or res[pid] == 0:
                    total_qty = safe_float_bi(d.get("total_unidades"))
                    fv = d.get("primera_venta")
                    lv = d.get("ultima_venta")
                    span_days = 30
                    if isinstance(fv, datetime) and isinstance(lv, datetime):
                        span_days = max(1, (lv - fv).days)
                    res[pid] = round(total_qty / float(span_days), 3)

        return res

    async def get_recent_inventory_logs(
        self,
        user: User,
        sucursal_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Obtiene los últimos movimientos de stock (Kárdex) registrados en db.inventory_logs.
        """
        db = await get_raw_db()
        filter_query: Dict[str, Any] = {}

        if user.tenant_id and str(user.tenant_id) not in ["all", "default", ""]:
            t_cond = [str(user.tenant_id)]
            if ObjectId.is_valid(user.tenant_id):
                t_cond.append(ObjectId(user.tenant_id))
            filter_query["tenant_id"] = {"$in": t_cond}

        if sucursal_id and sucursal_id not in ["all", "None", ""]:
            s_cond = [str(sucursal_id)]
            if ObjectId.is_valid(sucursal_id):
                s_cond.append(ObjectId(sucursal_id))
            filter_query["sucursal_id"] = {"$in": s_cond}

        cursor = db.inventory_logs.find(filter_query).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=None)
        res = []
        for d in docs:
            dt_val = d.get("created_at")
            fecha_str = dt_val.strftime("%Y-%m-%d %H:%M:%S") if isinstance(dt_val, datetime) else str(dt_val or "")
            res.append({
                "log_id": str(d["_id"]),
                "producto_id": str(d.get("producto_id", "")),
                "descripcion": str(d.get("descripcion") or "Producto Sin Nombre"),
                "tipo_movimiento": str(d.get("tipo_movimiento") or "AJUSTE_FISICO"),
                "cantidad_movida": safe_float_bi(d.get("cantidad_movida")),
                "stock_resultante": safe_float_bi(d.get("stock_resultante")),
                "usuario_nombre": str(d.get("usuario_nombre") or "Sistema"),
                "fecha": fecha_str
            })
        return res

