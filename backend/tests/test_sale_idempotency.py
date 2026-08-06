import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.application.services.sales_service import SalesService
from app.domain.models.sale import Sale
from app.domain.models.user import UserRole
from app.domain.schemas.sale import SaleCreate, SaleItemIn


@pytest.fixture(autouse=True)
def initialize_test_database():
    """Override conftest DB initialization so unit tests run completely offline."""
    yield


@pytest.mark.asyncio
async def test_sale_idempotency_pre_check():
    """
    1. Idempotencia Pura: Al enviar la misma idempotency_key, SalesService intercepta
    la solicitud pre-transacción y retorna la venta existente sin duplicarla.
    """
    mock_user = MagicMock()
    mock_user.id = "user123"
    mock_user.username = "cajero_test"
    mock_user.role = UserRole.CAJERO
    mock_user.tenant_id = "tenant_test"
    mock_user.sucursal_id = "CENTRAL"

    test_key = f"test-idempotency-{uuid.uuid4()}"
    sale_in = SaleCreate(
        sucursal_id="CENTRAL",
        items=[],
        idempotency_key=test_key
    )

    mock_existing_sale = MagicMock()
    mock_existing_sale.id = "sale123"
    mock_existing_sale.idempotency_key = test_key

    with patch.object(Sale, "find_one", new_callable=AsyncMock) as mock_find:
        mock_find.return_value = mock_existing_sale

        result = await SalesService.create_sale(sale_in, mock_user)

        assert result is not None
        assert result.idempotency_key == test_key
        mock_find.assert_called_once()


@pytest.mark.asyncio
async def test_recent_identical_sale_blocked_without_confirmation():
    """
    2. Bloqueo de Venta Idéntica Consecutiva: Si un cajero intenta cobrar un ticket
    idéntico en menos de 5 segundos sin confirmación (confirm_duplicate=False),
    el backend arroja HTTP 409 impidiendo la duplicación accidental.
    """
    mock_user = MagicMock()
    mock_user.id = "user123"
    mock_user.username = "cajero_test"
    mock_user.role = UserRole.CAJERO
    mock_user.tenant_id = "tenant_test"
    mock_user.sucursal_id = "CENTRAL"

    sale_in = SaleCreate(
        sucursal_id="CENTRAL",
        items=[SaleItemIn(producto_id="prod_abc", cantidad=2)],
        confirm_duplicate=False
    )

    recent_identical_sale = MagicMock()
    recent_identical_sale.id = "sale_prev_999"
    recent_item = MagicMock()
    recent_item.producto_id = "prod_abc"
    recent_item.cantidad = 2
    recent_identical_sale.items = [recent_item]

    with patch.object(Sale, "find_one", new_callable=AsyncMock) as mock_find_one, \
         patch.object(Sale, "find") as mock_find:

        mock_find_one.return_value = None
        mock_query = MagicMock()
        mock_query.to_list = AsyncMock(return_value=[recent_identical_sale])
        mock_find.return_value = mock_query

        with pytest.raises(HTTPException) as exc_info:
            await SalesService.create_sale(sale_in, mock_user)

        assert exc_info.value.status_code == 409
        assert "venta idéntica" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_recent_identical_sale_allowed_with_confirmation():
    """
    3. Confirmación Explícita de Venta Repetida: Si el cajero confirma intencionalmente
    la venta repetida (confirm_duplicate=True), el backend autoriza la transacción.
    """
    mock_user = MagicMock()
    mock_user.id = "user123"
    mock_user.username = "cajero_test"
    mock_user.role = UserRole.CAJERO
    mock_user.tenant_id = "tenant_test"
    mock_user.sucursal_id = "CENTRAL"

    sale_in = SaleCreate(
        sucursal_id="CENTRAL",
        items=[SaleItemIn(producto_id="prod_abc", cantidad=2)],
        confirm_duplicate=True
    )

    recent_identical_sale = MagicMock()
    recent_identical_sale.id = "sale_prev_999"
    recent_item = MagicMock()
    recent_item.producto_id = "prod_abc"
    recent_item.cantidad = 2
    recent_identical_sale.items = [recent_item]

    mock_client = MagicMock()
    mock_session = AsyncMock()
    mock_session.start_transaction = MagicMock()
    mock_client.start_session = AsyncMock(return_value=mock_session)

    with (
        patch.object(Sale, "find_one", new_callable=AsyncMock) as mock_find_one,
        patch.object(Sale, "find") as mock_find,
        patch("app.application.services.sales_service.get_client", return_value=mock_client),
        patch("app.application.services.sales_service.retry_on_write_conflict", new_callable=AsyncMock) as mock_retry,
    ):

        mock_find_one.return_value = None
        mock_query = MagicMock()
        mock_query.to_list = AsyncMock(return_value=[recent_identical_sale])
        mock_find.return_value = mock_query

        expected_sale = MagicMock()
        mock_retry.return_value = expected_sale

        result = await SalesService.create_sale(sale_in, mock_user)
        assert result == expected_sale
