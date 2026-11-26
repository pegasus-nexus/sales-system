"""
La app no debe arrancar en un entorno desplegado con una llave JWT pública o débil.

Son tests de lógica pura: no requieren MongoDB.
"""

import pytest

from app.infrastructure.core.config import (
    DEV_DEFAULT_JWT_SECRET,
    MIN_JWT_SECRET_LENGTH,
    Settings,
    is_deployed_environment,
    validate_jwt_secret_for_deployment,
)

STRONG_SECRET = "k" * MIN_JWT_SECRET_LENGTH


def make_settings(environment: str, secret: str) -> Settings:
    return Settings(ENVIRONMENT=environment, JWT_SECRET_KEY=secret, _env_file=None)


@pytest.mark.parametrize(
    ("environment", "environ", "expected"),
    [
        ("development", {}, False),
        ("production", {}, True),
        ("PRODUCTION", {}, True),
        # Render define RENDER=true: cuenta como desplegado aunque falte ENVIRONMENT
        ("development", {"RENDER": "true"}, True),
        ("development", {"RENDER": "false"}, False),
    ],
)
def test_is_deployed_environment(environment, environ, expected):
    app_settings = make_settings(environment, STRONG_SECRET)
    assert is_deployed_environment(app_settings, environ) is expected


@pytest.mark.parametrize(
    "secret",
    [
        DEV_DEFAULT_JWT_SECRET,
        "supersecretkey_change_me_in_production",
        "",
        "   ",
        "corta-de-20-caracter",
    ],
)
@pytest.mark.parametrize(
    ("environment", "environ"),
    [("production", {}), ("development", {"RENDER": "true"})],
)
def test_deployed_rejects_public_or_weak_secret(secret, environment, environ):
    app_settings = make_settings(environment, secret)
    with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
        validate_jwt_secret_for_deployment(app_settings, environ)


def test_deployed_accepts_strong_secret():
    app_settings = make_settings("production", STRONG_SECRET)
    validate_jwt_secret_for_deployment(app_settings, {"RENDER": "true"})


def test_local_development_allows_default_secret():
    app_settings = make_settings("development", DEV_DEFAULT_JWT_SECRET)
    validate_jwt_secret_for_deployment(app_settings, {})
