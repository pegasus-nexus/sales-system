from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository

class AnalyticsV3Service:
    def __init__(self, repository: MongoAnalyticsRepository):
        self.repository = repository

    async def get_dashboard_summary(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene el resumen ejecutivo del dashboard sin modificaciones de timezone extrañas.
        Asume que start_date y end_date ya vienen correctos desde el frontend.
        """
        # 1. Obtener totales
        totales = await self.repository.get_total_sales_and_orders(
            tenant_id, start_date, end_date, sucursal_id
        )

        # 2. Desglose horario
        hourly = await self.repository.get_hourly_sales_distribution(
            tenant_id, start_date, end_date, sucursal_id
        )

        # 3. Métodos de pago
        payments = await self.repository.get_sales_by_payment_method(
            tenant_id, start_date, end_date, sucursal_id
        )

        ventas_brutas = totales.get("total_ventas", 0.0)
        cantidad_ventas = totales.get("cantidad_ventas", 0)

        # Calcular ticket medio
        ticket_medio = round(ventas_brutas / cantidad_ventas, 2) if cantidad_ventas > 0 else 0.0

        # Formatear hourly para recharts
        formatted_hourly = [
            {"hora": f"{h['_id']:02d}:00", "total": round(h.get("total_ventas", 0), 2), "ordenes": h.get("cantidad_ventas", 0)}
            for h in hourly
        ]

        return {
            "overview": {
                "ventas_brutas": round(ventas_brutas, 2),
                "total_orders": cantidad_ventas,
                "ticket_medio": ticket_medio,
            },
            "hourly_distribution": formatted_hourly,
            "payment_methods": [
                {
                    "metodo": p["_id"] or "Desconocido",
                    "monto": round(p.get("monto_total", 0), 2),
                    "transacciones": p.get("cantidad_transacciones", 0)
                } for p in payments
            ]
        }
