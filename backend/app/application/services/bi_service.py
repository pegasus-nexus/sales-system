from typing import Optional, List, Dict, Any
from datetime import datetime, time
from zoneinfo import ZoneInfo

from app.core.config import BUSINESS_TIMEZONE
from app.domain.repositories.bi_repository import BIRepository
from app.application.services.bi_pandas_service import BIPandasService
from app.schemas.bi import BIPanelGeneralResponse

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class BIService:
    """
    Servicio de aplicación para Business Intelligence.
    Desacopla los endpoints de la infraestructura y coordina la extracción
    de datos con la transformación en Modelo Estrella usando Pandas.
    """

    def __init__(self, repository: BIRepository, pandas_service: Optional[BIPandasService] = None):
        self.repository = repository
        self.pandas_service = pandas_service or BIPandasService()

    def _convert_bolivia_dates_to_utc_range(self, start_date_str: str, end_date_str: str) -> tuple[datetime, datetime]:
        """
        Convierte cadenas 'YYYY-MM-DD' de la fecha oficial de Bolivia a su correspondiente
        rango de timestamps UTC para consulta en MongoDB.
        00:00:00.000000 America/La_Paz (-04:00) -> 04:00:00 UTC
        23:59:59.999999 America/La_Paz (-04:00) -> 03:59:59.999999 UTC del día siguiente
        """
        s_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        e_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()

        start_local = datetime.combine(s_date, time.min, tzinfo=BOLIVIA_TZ)
        end_local = datetime.combine(e_date, time.max, tzinfo=BOLIVIA_TZ)

        start_utc = start_local.astimezone(ZoneInfo("UTC"))
        end_utc = end_local.astimezone(ZoneInfo("UTC"))

        return start_utc, end_utc

    async def get_panel_general(
        self,
        tenant_id: str,
        start_date: str,
        end_date: str,
        sucursal_id: Optional[str] = None
    ) -> BIPanelGeneralResponse:
        start_utc, end_utc = self._convert_bolivia_dates_to_utc_range(start_date, end_date)

        # 1. Extracción de Ventas
        raw_sales = await self.repository.get_raw_sales(
            tenant_id=tenant_id,
            start_utc=start_utc,
            end_utc=end_utc,
            sucursal_id=sucursal_id
        )

        # 2. Extracción de Dimensiones (Sucursales)
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
