from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
from bson import ObjectId
from bson.decimal128 import Decimal128

from app.db import get_raw_db
from app.domain.models.user import User, UserRole
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def safe_float(val) -> float:
    """
    Convierte de forma segura cualquier tipo numérico de MongoDB
    (float, int, Decimal128, string, o BSON Decimal) a float nativo de Python.
    """
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


class SalesReadService:
    """
    Servicio Centralizado Unificado de Lectura de Ventas POS (Fuente de Verdad única).
    Garantiza que tanto el Historial de Ventas como el Módulo de BI consulten la colección
    MongoDB 'sales' con las exactas mismas reglas de autorización, fechas y tipos BSON.
    """

    @staticmethod
    def calculate_bolivia_date_range(start_date_str: str, end_date_str: str) -> tuple[Optional[datetime], Optional[datetime]]:
        if start_date_str.lower() in ["all", "historial", "todo", ""]:
            return None, None

        try:
            s_dt = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            e_dt = datetime.strptime(end_date_str, "%Y-%m-%d").date()

            start_local = datetime.combine(s_dt, time.min, tzinfo=BOLIVIA_TZ)
            end_local = datetime.combine(e_dt + timedelta(days=1), time.min, tzinfo=BOLIVIA_TZ)

            start_utc = start_local.astimezone(ZoneInfo("UTC"))
            end_utc = end_local.astimezone(ZoneInfo("UTC"))

            return start_utc, end_utc
        except Exception as err:
            print(f"⚠️ Error parseando rango de fechas de negocio ({start_date_str} -> {end_date_str}): {err}")
            return None, None

    @classmethod
    async def get_raw_sales_for_user(
        cls,
        user: User,
        start_date_str: str,
        end_date_str: str,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = await get_raw_db()

        # 1. Regla de Anuladas (estricta exclusión)
        match_stage: Dict[str, Any] = {
            "anulada": {"$ne": True}
        }

        # 2. Aislamiento por Tenant (igual que Historial de Ventas)
        if user.role != UserRole.SUPERADMIN:
            tenant_id = user.tenant_id or "default"
            tenant_conditions = [str(tenant_id)]
            if ObjectId.is_valid(tenant_id):
                tenant_conditions.append(ObjectId(tenant_id))
            match_stage["tenant_id"] = {"$in": tenant_conditions}

        # 3. Permisos por Rol y Aislamiento por Sucursal
        is_admin_matriz = user.role in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.FACTURADOR]
        if not is_admin_matriz:
            user_suc = user.sucursal_id or "__none__"
            if ObjectId.is_valid(user_suc):
                match_stage["$or"] = [
                    {"sucursal_id": str(user_suc)},
                    {"sucursal_id": ObjectId(user_suc)}
                ]
            else:
                match_stage["sucursal_id"] = str(user_suc)
        elif sucursal_id and sucursal_id.lower() not in ["all", "todas", "global", ""]:
            if ObjectId.is_valid(sucursal_id):
                match_stage["$or"] = [
                    {"sucursal_id": str(sucursal_id)},
                    {"sucursal_id": ObjectId(sucursal_id)}
                ]
            else:
                match_stage["sucursal_id"] = str(sucursal_id)

        # 4. Rango de Fechas Semiabierto [start_utc, end_utc) en America/La_Paz
        start_utc, end_utc = cls.calculate_bolivia_date_range(start_date_str, end_date_str)
        if start_utc and end_utc:
            match_stage["created_at"] = {"$gte": start_utc, "$lt": end_utc}

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
