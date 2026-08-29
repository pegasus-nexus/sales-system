from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.domain.repositories.bi_repository import BIRepository
from app.domain.models.user import User
from app.application.services.bi_pandas_service import BIPandasService
from app.application.services.sales_read_service import SalesReadService
from app.schemas.bi import BIPanelGeneralResponse, BIComparativaResponse, BIProductosResponse


from app.application.services.financial_service import FinancialService

class BIService:
    """
    Servicio de Aplicación de BI.
    Coordina la extracción de datos desde el servicio unificado SalesReadService
    y el servicio financiero unificado FinancialService para garantizar 100% de coincidencia.
    """

    def __init__(self, repository: BIRepository, pandas_service: Optional[BIPandasService] = None):
        self.repository = repository
        self.pandas_service = pandas_service or BIPandasService()

    async def get_panel_general(
        self,
        current_user: User,
        start_date: str,
        end_date: str,
        sucursal_id: Optional[str] = None
    ) -> BIPanelGeneralResponse:
        raw_sales = await SalesReadService.get_raw_sales_for_user(
            user=current_user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )
        financial_summary = await FinancialService.get_financial_summary(
            user=current_user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )
        tenant_id = current_user.tenant_id or "default"
        sucursales = await self.repository.get_sucursales(tenant_id=tenant_id)
        return self.pandas_service.process_panel_general(
            raw_sales=raw_sales,
            sucursales=sucursales,
            start_date_str=start_date,
            end_date_str=end_date,
            financial_summary=financial_summary
        )

    async def get_comparativas(
        self,
        current_user: User,
        start_date: str,
        end_date: str,
        comparar_contra: str = "ayer",
        sucursal_id: Optional[str] = None
    ) -> BIComparativaResponse:
        s_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        e_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        delta_days = (e_dt - s_dt).days + 1

        if comparar_contra == "ayer":
            s_comp = s_dt - timedelta(days=1)
            e_comp = e_dt - timedelta(days=1)
        elif comparar_contra in ["semana_anterior", "wow"]:
            s_comp = s_dt - timedelta(days=7)
            e_comp = e_dt - timedelta(days=7)
        elif comparar_contra in ["mes_anterior", "mom"]:
            s_comp = s_dt - relativedelta(months=1)
            e_comp = e_dt - relativedelta(months=1)
        elif comparar_contra in ["ano_anterior", "yoy"]:
            s_comp = s_dt - relativedelta(years=1)
            e_comp = e_dt - relativedelta(years=1)
        else:
            s_comp = s_dt - timedelta(days=delta_days)
            e_comp = e_dt - timedelta(days=delta_days)

        start_comp_str = s_comp.strftime("%Y-%m-%d")
        end_comp_str = e_comp.strftime("%Y-%m-%d")

        sales_actual = await SalesReadService.get_raw_sales_for_user(
            user=current_user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        sales_comparativo = await SalesReadService.get_raw_sales_for_user(
            user=current_user,
            start_date_str=start_comp_str,
            end_date_str=end_comp_str,
            sucursal_id=sucursal_id
        )

        tenant_id = current_user.tenant_id or "default"
        sucursales = await self.repository.get_sucursales(tenant_id=tenant_id)

        return self.pandas_service.process_comparativas(
            sales_actual=sales_actual,
            sales_comparativo=sales_comparativo,
            sucursales=sucursales,
            start_date_act=start_date,
            end_date_act=end_date,
            start_date_comp=start_comp_str,
            end_date_comp=end_comp_str,
            modo_comparativo=comparar_contra
        )

    async def get_productos_analysis(
        self,
        current_user: User,
        start_date: str,
        end_date: str,
        sucursal_id: Optional[str] = None
    ) -> BIProductosResponse:
        # 1. Extracción Unificada con SalesReadService
        raw_sales = await SalesReadService.get_raw_sales_for_user(
            user=current_user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        # 2. Extracción de Dimensiones Productos y Categorías
        tenant_id = current_user.tenant_id or "default"
        products_dim = await self.repository.get_products_dim(tenant_id=tenant_id)
        categories_dim = await self.repository.get_categories_dim(tenant_id=tenant_id)

        # 3. Transformación Analítica Pandas ETL (Modelo Estrella FACT_SALES_ITEMS)
        return self.pandas_service.process_productos(
            raw_sales=raw_sales,
            products_dim=products_dim,
            categories_dim=categories_dim,
            start_date_str=start_date,
            end_date_str=end_date
        )

    async def get_sucursales_dim(self, tenant_id: str) -> List[Dict[str, Any]]:
        return await self.repository.get_sucursales(tenant_id=tenant_id)
