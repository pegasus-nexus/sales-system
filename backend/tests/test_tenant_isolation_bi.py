import pytest
from datetime import datetime, timezone
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository
from app.application.services.bi_pandas_service import BIPandasService


@pytest.mark.asyncio
async def test_mongo_analytics_empty_tenant():
    repo = MongoAnalyticsRepository()
    # A tenant with None, empty, or default should return 0/empty without hitting MongoDB
    totals_none = await repo.get_total_sales_and_orders(None, datetime.now(timezone.utc), datetime.now(timezone.utc))
    assert totals_none == {"total_ventas": 0.0, "cantidad_ventas": 0}

    hourly_none = await repo.get_hourly_sales_distribution("", datetime.now(timezone.utc), datetime.now(timezone.utc))
    assert hourly_none == []


def test_pandas_bi_empty_sales_produces_zero_mock():
    service = BIPandasService()
    res = service.process_panel_general(
        raw_sales=[],
        sucursales=[],
        start_date_str="2026-10-30",
        end_date_str="2026-10-30",
        financial_summary=None
    )
    assert res.ingresos_totales == 0.0
    assert res.cantidad_ordenes == 0
    assert res.top_productos == []
    assert len(res.desglose_sucursales) == 0


def test_pandas_bi_dynamic_top_products():
    service = BIPandasService()
    dummy_sales = [
        {
            "ticket_id": "T1",
            "total_neto": 100.0,
            "created_at": datetime(2026, 10, 30, 12, 0, 0, tzinfo=timezone.utc),
            "sucursal_id": "SUC1",
            "items": [
                {"nombre": "Galletas Avena", "cantidad": 5, "precio_unitario": 10.0, "subtotal": 50.0},
                {"nombre": "Jugo Naranja", "cantidad": 2, "precio_unitario": 25.0, "subtotal": 50.0}
            ]
        }
    ]
    res = service.process_panel_general(
        raw_sales=dummy_sales,
        sucursales=[{"sucursal_id": "SUC1", "nombre": "Sucursal Norte"}],
        start_date_str="2026-10-30",
        end_date_str="2026-10-30",
        financial_summary=None
    )
    assert res.ingresos_totales == 100.0
    assert len(res.top_productos) == 2
    assert res.top_productos[0].nombre == "Galletas Avena"
    assert res.top_productos[0].unidades_vendidas == 5.0
    assert res.top_productos[1].nombre == "Jugo Naranja"
    assert res.top_productos[1].unidades_vendidas == 2.0
