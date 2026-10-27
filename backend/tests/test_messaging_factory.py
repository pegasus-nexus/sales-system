import pytest

from app.application.services.whatsapp_service import WhatsAppService
from app.domain.models.tenant import WhatsAppSettings
from app.infrastructure.messaging.factory import MessageProviderFactory
from app.infrastructure.messaging.greenapi_provider import GreenApiProvider
from app.infrastructure.messaging.mock_provider import MockMessageProvider
from app.infrastructure.messaging.ultramsg_provider import UltraMsgProvider


def test_factory_creates_greenapi_provider():
    settings = WhatsAppSettings(
        enabled=True,
        provider="GREENAPI",
        instance_id="12345",
        api_token="token_green"
    )
    provider = MessageProviderFactory.create_provider(settings)
    assert isinstance(provider, GreenApiProvider)
    assert provider.instance_id == "12345"
    assert provider.api_token == "token_green"


def test_factory_creates_ultramsg_provider():
    settings = WhatsAppSettings(
        enabled=True,
        provider="ULTRAMSG",
        instance_id="instance99",
        api_token="token_ultra"
    )
    provider = MessageProviderFactory.create_provider(settings)
    assert isinstance(provider, UltraMsgProvider)
    assert provider.instance_id == "instance99"
    assert provider.api_token == "token_ultra"


def test_factory_creates_mock_provider():
    settings = WhatsAppSettings(
        enabled=True,
        provider="MOCK"
    )
    provider = MessageProviderFactory.create_provider(settings)
    assert isinstance(provider, MockMessageProvider)


def test_factory_returns_none_when_disabled():
    settings = WhatsAppSettings(
        enabled=False,
        provider="GREENAPI",
        instance_id="12345",
        api_token="token_green"
    )
    provider = MessageProviderFactory.create_provider(settings)
    assert provider is None


def test_factory_returns_none_when_credentials_missing():
    settings = WhatsAppSettings(
        enabled=True,
        provider="GREENAPI",
        instance_id="",
        api_token=""
    )
    provider = MessageProviderFactory.create_provider(settings)
    assert provider is None


@pytest.mark.asyncio
async def test_whatsapp_service_with_mock_provider():
    settings = WhatsAppSettings(
        enabled=True,
        provider="MOCK"
    )
    # Número local de 8 dígitos debe normalizarse con prefijo 591
    result = await WhatsAppService.send_message(
        phone="71234567",
        message="¡Hola! Tu comprobante está listo.",
        settings=settings,
        pdf_url="https://ejemplo.com/factura.pdf"
    )
    assert result is True


def test_phone_normalization():
    assert WhatsAppService.normalize_phone("71234567") == "59171234567"
    assert WhatsAppService.normalize_phone("+591 712 34567") == "59171234567"
    assert WhatsAppService.normalize_phone("5491122334455") == "5491122334455"
