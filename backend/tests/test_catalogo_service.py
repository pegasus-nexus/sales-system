import pytest
from unittest.mock import AsyncMock, patch
from app.application.services.catalogo_service import CatalogoService, slugify
from app.domain.schemas.catalogo import (
    CatalogoRegisterRequest,
    CatalogoProductoCreate,
)


def test_slugify():
    assert slugify("Pastelería Dulce Corazón 100%!") == "pasteleria-dulce-corazon-100"
    assert slugify("Chocolates Taboada") == "chocolates-taboada"
    assert slugify("   ") == "catalogo"


@pytest.mark.asyncio
async def test_register_merchant():
    mock_config_repo = AsyncMock()
    mock_producto_repo = AsyncMock()
    mock_auth_repo = AsyncMock()

    mock_auth_repo.find_user_by_email.return_value = None
    mock_config_repo.is_slug_available.return_value = True
    mock_auth_repo.create_tenant.return_value = {"id": "tenant-123", "name": "Mi Tienda", "slug": "mi-tienda"}
    mock_auth_repo.create_user.return_value = {
        "id": "user-123",
        "username": "test@tienda.com",
        "email": "test@tienda.com",
        "full_name": "Juan Perez",
        "role": "CATALOGO_MERCHANT"
    }
    mock_config_repo.create.return_value = {"id": "cfg-123", "slug": "mi-tienda"}

    service = CatalogoService(mock_config_repo, mock_producto_repo, mock_auth_repo)

    req = CatalogoRegisterRequest(
        first_name="Juan",
        last_name="Perez",
        company_name="Mi Tienda",
        email="test@tienda.com",
        password="secretpassword123",
        whatsapp="+59170012345"
    )

    with patch("app.application.services.catalogo_service.get_password_hash", return_value="hashed_secret"):
        res = await service.register_merchant(req)

    assert res.user_id == "user-123"
    assert res.tenant_id == "tenant-123"
    assert res.slug == "mi-tienda"
    assert res.access_token is not None
    mock_auth_repo.create_tenant.assert_called_once()
    mock_auth_repo.create_user.assert_called_once()
    mock_config_repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_get_public_catalog():
    mock_config_repo = AsyncMock()
    mock_producto_repo = AsyncMock()
    mock_auth_repo = AsyncMock()

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    mock_config_repo.get_by_slug.return_value = {
        "id": "cfg-1",
        "tenant_id": "tenant-123",
        "business_name": "Pastelería Luna",
        "slug": "pasteleria-luna",
        "primary_color": "#ff007f",
        "secondary_color": "#00f0ff",
        "whatsapp_number": "+59170011223",
        "currency_symbol": "Bs.",
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    mock_producto_repo.list_by_tenant.return_value = [
        {
            "id": "prod-1",
            "tenant_id": "tenant-123",
            "title": "Torta Selva Negra",
            "description": "Deliciosa torta con cerezas",
            "price": 120.0,
            "currency_symbol": "Bs.",
            "images": ["https://img.com/torta.jpg"],
            "category": "Tortas",
            "is_available": True,
            "is_featured": True,
            "order": 1,
            "created_at": now,
            "updated_at": now
        }
    ]

    service = CatalogoService(mock_config_repo, mock_producto_repo, mock_auth_repo)
    catalog = await service.get_public_catalog("pasteleria-luna")

    assert catalog.config.business_name == "Pastelería Luna"
    assert len(catalog.products) == 1
    assert catalog.products[0].title == "Torta Selva Negra"
    assert catalog.categories == ["Tortas"]
