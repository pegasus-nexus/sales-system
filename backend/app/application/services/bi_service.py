from typing import Optional, List, Dict, Any
from app.domain.repositories.bi_repository import BIRepository
from app.domain.models.user import User
from app.application.services.bi_pandas_service import BIPandasService
from app.application.services.sales_read_service import SalesReadService
from app.schemas.bi import BIPanelGeneralResponse


class BIService:
    """
    Servicio de Aplicación de BI.
    Coordina la extracción de datos desde el servicio unificado SalesReadService
    y realiza la transformación analítica con Pandas en un Modelo Estrella.
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
        # 1. Extracción de Ventas Unificada (Fuente única MongoDB sales via SalesReadService)
        raw_sales = await SalesReadService.get_raw_sales_for_user(
            user=current_user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        # 2. Extracción de Dimensiones (Sucursales)
        tenant_id = current_user.tenant_id or "default"
        sucursales = await self.repository.get_sucursales(tenant_id=tenant_id)

        # 3. Transformación Analítica en Modelo Estrella con Pandas
        return self.pandas_service.process_panel_general(
            raw_sales=raw_sales,
            sucursales=sucursales,
            start_date_str=start_date,
            end_date_str=end_date
        )

    async def get_sucursales_dim(self, tenant_id: str) -> List[Dict[str, Any]]:
        return await self.repository.get_sucursales(tenant_id=tenant_id)
