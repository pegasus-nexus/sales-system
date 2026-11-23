from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException

from app.application.services.account_activation_service import (
    validate_password_complexity,
    validate_password_not_repeated,
)
from app.domain.models.account_token import AccountToken
from app.infrastructure.auth import get_password_hash
from app.infrastructure.core.config import settings
from app.infrastructure.email.base import BaseEmailProvider
from app.infrastructure.email.factory import EmailProviderFactory
from app.infrastructure.email.mock_provider import MockEmailProvider
from app.infrastructure.email.resend_provider import ResendEmailProvider
from app.infrastructure.email.templates import render_activation_email


def test_email_factory_returns_mock_by_default():
    EmailProviderFactory.override_provider(None)
    provider = EmailProviderFactory.get_provider()
    assert isinstance(provider, BaseEmailProvider)
    assert isinstance(provider, MockEmailProvider)


def test_email_factory_creates_resend_when_configured(monkeypatch):
    EmailProviderFactory.override_provider(None)
    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "resend")
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_test_key_12345")
    monkeypatch.setattr(settings, "EMAIL_FROM", "test@pegasus.nexus")

    provider = EmailProviderFactory.get_provider()
    assert isinstance(provider, ResendEmailProvider)
    assert provider.api_key == "re_test_key_12345"
    assert provider.default_from == "test@pegasus.nexus"


def test_email_factory_fallback_when_resend_has_no_key(monkeypatch):
    EmailProviderFactory.override_provider(None)
    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "resend")
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")

    provider = EmailProviderFactory.get_provider()
    assert isinstance(provider, MockEmailProvider)


def test_mock_email_provider_structure():
    mock = MockEmailProvider(should_succeed=True)
    assert mock.should_succeed is True
    assert mock.sent_emails == []
    mock.sent_emails.append({"to": "test@pegasus.com", "subject": "Test"})
    assert len(mock.sent_emails) == 1
    mock.clear()
    assert mock.sent_emails == []


def test_render_activation_email_template():
    html, text = render_activation_email(
        user_name="Carlos Santana",
        activation_url="https://app.pegasus.nexus/activar-cuenta?token=xyz123",
        business_name="Ferretería El Cóndor",
        expire_hours=24,
    )
    assert "Carlos Santana" in html
    assert "Ferretería El Cóndor" in html
    assert "https://app.pegasus.nexus/activar-cuenta?token=xyz123" in html
    assert "24 horas" in html
    assert "Carlos Santana" in text
    assert "https://app.pegasus.nexus/activar-cuenta?token=xyz123" in text


def test_validate_password_complexity_success():
    # Cumple: >=8 chars, mayúscula, minúscula, número y símbolo
    validate_password_complexity("Pegasus@2026!")


@pytest.mark.parametrize(
    "invalid_pwd, expected_err",
    [
        ("Peg@1", "al menos 8 caracteres"),
        ("pegasus@2026", "letra mayúscula"),
        ("PEGASUS@2026", "letra minúscula"),
        ("Pegasus@Nexus", "un número"),
        ("Pegasus2026", "carácter especial"),
    ],
)
def test_validate_password_complexity_failures(invalid_pwd, expected_err):
    with pytest.raises(HTTPException) as exc_info:
        validate_password_complexity(invalid_pwd)
    assert exc_info.value.status_code == 400
    assert expected_err in exc_info.value.detail


def test_validate_password_not_repeated_current():
    current_hash = get_password_hash("PasswordActual@123")

    # Mismo password que el actual -> debe fallar
    with pytest.raises(HTTPException) as exc_info:
        validate_password_not_repeated(
            new_password="PasswordActual@123",
            current_hashed=current_hash,
            history_hashes=[],
        )
    assert exc_info.value.status_code == 400
    assert "idéntica a la contraseña actual" in exc_info.value.detail


def test_validate_password_not_repeated_in_history():
    current_hash = get_password_hash("PasswordActual@123")
    old_hash_1 = get_password_hash("OldPassword@2025")
    old_hash_2 = get_password_hash("AntiguaClave@789")

    # Reutilizar una contraseña histórica -> debe fallar
    with pytest.raises(HTTPException) as exc_info:
        validate_password_not_repeated(
            new_password="OldPassword@2025",
            current_hashed=current_hash,
            history_hashes=[old_hash_1, old_hash_2],
        )
    assert exc_info.value.status_code == 400
    assert "reutilizar una de tus contraseñas anteriores" in exc_info.value.detail

    # Una contraseña totalmente nueva -> debe pasar sin excepción
    validate_password_not_repeated(
        new_password="TotalmenteNuevaClave@2026",
        current_hashed=current_hash,
        history_hashes=[old_hash_1, old_hash_2],
    )


def test_account_token_is_valid_logic():
    now = datetime.now(UTC)

    # Token activo no usado
    valid_token = AccountToken.model_construct(
        email="test@pegasus.com",
        token_hash="hash_123",
        expires_at=now + timedelta(hours=2),
        used_at=None,
    )
    assert valid_token.is_valid() is True

    # Token ya usado
    used_token = AccountToken.model_construct(
        email="test@pegasus.com",
        token_hash="hash_456",
        expires_at=now + timedelta(hours=2),
        used_at=now,
    )
    assert used_token.is_valid() is False

    # Token expirado
    expired_token = AccountToken.model_construct(
        email="test@pegasus.com",
        token_hash="hash_789",
        expires_at=now - timedelta(minutes=5),
        used_at=None,
    )
    assert expired_token.is_valid() is False
