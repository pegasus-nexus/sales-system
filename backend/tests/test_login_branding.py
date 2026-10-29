import pytest
from app.api.v1.endpoints.auth import LoginBrandingResponse
from app.domain.models.tenant import TenantSettings, Tenant


def test_login_branding_defaults():
    branding = LoginBrandingResponse()
    assert branding.custom_branding is False
    assert branding.tenant_name == "PEGASUS NEXUS"
    assert branding.primary_color == "#6366f1"
    assert branding.secondary_color == "#06b6d4"
    assert "Potencia tus operaciones" in branding.headline


def test_tenant_settings_login_fields():
    settings = TenantSettings(
        login_bg_image="data:image/png;base64,sample",
        login_primary_color="#2563eb",
        login_secondary_color="#10b981",
        login_headline="Mi Empresa Oficial",
        login_description="Aviso importante",
        login_badge_text="Portal 2026"
    )
    assert settings.login_bg_image == "data:image/png;base64,sample"
    assert settings.login_primary_color == "#2563eb"
    assert settings.login_secondary_color == "#10b981"
    assert settings.login_headline == "Mi Empresa Oficial"
    assert settings.login_description == "Aviso importante"
    assert settings.login_badge_text == "Portal 2026"


def test_tenant_model_fields():
    # Inspect model fields on the Tenant Document class without requiring Mongo init
    assert "slug" in Tenant.model_fields
    assert "settings" in Tenant.model_fields
    assert "name" in Tenant.model_fields
