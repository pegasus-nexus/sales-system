import asyncio
from zoneinfo import ZoneInfo
from app.db import init_db, get_raw_db
from app.domain.models.user import User
from app.application.services.sales_read_service import SalesReadService, safe_float
from app.core.config import BUSINESS_TIMEZONE

async def run_financial_logic_verification():
    await init_db()
    db = await get_raw_db()

    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    tenant_id = str(admin_user.tenant_id) if admin_user else "69cd7f0a8f3f6866d4cfbb62"

    # Consultar para una fecha o período
    start_date = "2026-08-26"
    end_date = "2026-08-26"

    start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(start_date, end_date)

    match_filter = {
        "tenant_id": tenant_id,
        "anulada": {"$ne": True},
        "created_at": {"$gte": start_utc, "$lt": end_utc}
    }

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

    print("=" * 80)
    print(f"VERIFICACIÓN DE LÓGICA FINANCIERA PEGASUS DE REPORTS.PY PARA {start_date}:")
    if res:
        data = res[0]
        t_pub = safe_float(data.get("total_publico"))
        t_fab = safe_float(data.get("total_fabrica"))
        m_dist = safe_float(data.get("margen_distribuidor"))
        m_ret = safe_float(data.get("margen_retail"))
        m_tot = safe_float(data.get("margen_total"))
        rent = (m_tot / t_pub * 100.0) if t_pub > 0 else 0.0

        print(f"  Ventas Públicas (total_publico) : Bs. {t_pub:,.2f}")
        print(f"  Costo Fábrica (total_fabrica)   : Bs. {t_fab:,.2f}")
        print(f"  Comisión Matriz (15%)           : Bs. {m_dist:,.2f}")
        print(f"  Margen Retail                   : Bs. {m_ret:,.2f}")
        print(f"  Margen Neto Total (Líquido)     : Bs. {m_tot:,.2f}")
        print(f"  Rentabilidad Contable (%)       : {rent:.2f}%")
    else:
        print("  Sin registros encontrados para la fecha.")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_financial_logic_verification())
