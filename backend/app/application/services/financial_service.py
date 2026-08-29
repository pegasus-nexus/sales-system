from typing import Optional, Dict, Any, List
from app.db import get_raw_db
from app.domain.models.user import User
from app.application.services.sales_read_service import SalesReadService, safe_float

class FinancialService:
    """
    Servicio Centralizado de Cálculos Financieros y Márgenes de Pegasus Sales System.
    Garantiza que Finanzas, Márgenes y el Panel BI General utilicen la EXACTA misma
    fórmula de Ventas Públicas, Comisión Matriz 15%, Margen Retail y Margen Neto Total.
    """

    @staticmethod
    async def get_financial_summary(
        user: User,
        start_date_str: str,
        end_date_str: str,
        sucursal_id: Optional[str] = None
    ) -> Dict[str, float]:
        db = await get_raw_db()
        tenant_id = str(user.tenant_id) if user.tenant_id else "default"

        start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(start_date_str, end_date_str)

        match_filter: Dict[str, Any] = {
            "tenant_id": tenant_id,
            "anulada": {"$ne": True}
        }

        if start_utc and end_utc:
            match_filter["created_at"] = {"$gte": start_utc, "$lt": end_utc}

        if sucursal_id and sucursal_id not in ["all", "historial", "todo", ""]:
            match_filter["sucursal_id"] = str(sucursal_id)

        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": None,
                    "total_publico": {
                        "$sum": {
                            "$reduce": {
                                "input": "$items",
                                "initialValue": 0,
                                "in": {"$add": ["$$value", {"$multiply": [{"$ifNull": ["$$this.precio_unitario", 0]}, {"$ifNull": ["$$this.cantidad", 0]}]}]}
                            }
                        }
                    },
                    "total_fabrica": {
                        "$sum": {
                            "$reduce": {
                                "input": "$items",
                                "initialValue": 0,
                                "in": {"$add": ["$$value", {"$multiply": [{"$ifNull": ["$$this.costo_unitario", 0]}, {"$ifNull": ["$$this.cantidad", 0]}]}]}
                            }
                        }
                    }
                }
            },
            {
                "$project": {
                    "total_publico": 1,
                    "total_fabrica": 1,
                    "margen_distribuidor": {"$multiply": ["$total_fabrica", 0.15]},
                    "margen_retail": {"$subtract": ["$total_publico", "$total_fabrica"]},
                    "_id": 0
                }
            },
            {
                "$project": {
                    "total_publico": 1,
                    "total_fabrica": 1,
                    "margen_distribuidor": 1,
                    "margen_retail": 1,
                    "margen_total": {"$add": ["$margen_distribuidor", "$margen_retail"]}
                }
            }
        ]

        cursor = db.sales.aggregate(pipeline)
        res = await cursor.to_list(length=1)

        if not res:
            return {
                "total_publico": 0.0,
                "total_fabrica": 0.0,
                "comision_matriz_bs": 0.0,
                "margen_retail_bs": 0.0,
                "margen_liquido_bs": 0.0,
                "rentabilidad_contable_pct": 0.0
            }

        data = res[0]
        t_pub = round(safe_float(data.get("total_publico")), 2)
        t_fab = round(safe_float(data.get("total_fabrica")), 2)
        c_mat = round(safe_float(data.get("margen_distribuidor")), 2)
        m_ret = round(safe_float(data.get("margen_retail")), 2)
        m_liq = round(safe_float(data.get("margen_total")), 2)
        rent_pct = round((m_liq / t_pub * 100.0), 2) if t_pub > 0 else 0.0

        return {
            "total_publico": t_pub,
            "total_fabrica": t_fab,
            "comision_matriz_bs": c_mat,
            "margen_retail_bs": m_ret,
            "margen_liquido_bs": m_liq,
            "rentabilidad_contable_pct": rent_pct
        }
