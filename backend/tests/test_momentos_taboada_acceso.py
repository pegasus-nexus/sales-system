"""
Acceso al módulo a medida Momentos Taboada.

Regla: solo SUPERADMIN o un tenant con MOMENTOS_TABOADA en modulos_activos.
Nombre, slug o email con "taboada" NO dan acceso (el slug lo edita el propio tenant).
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.momentos_taboada import (
    check_taboada_access,
    get_taboada_tenant_id,
    tenant_has_momentos_taboada,
)
from app.domain.models.user import UserRole

TENANT_ID = "650000000000000000000001"


def _user(role=UserRole.ADMIN_MATRIZ, tenant_id=TENANT_ID, email="admin@otra.com"):
    user = MagicMock()
    user.role = role
    user.tenant_id = tenant_id
    user.username = "admin"
    user.email = email
    return user


def _tenant(name="Otra Empresa", slug="otra-empresa", modulos=None):
    tenant = MagicMock()
    tenant.name = name
    tenant.slug = slug
    tenant.modulos_activos = modulos if modulos is not None else ["INVENTARIO", "POS"]
    return tenant


def test_tenant_con_modulo_tiene_acceso():
    tenant = _tenant(modulos=["POS", "MOMENTOS_TABOADA"])
    assert tenant_has_momentos_taboada(tenant)
    assert check_taboada_access(_user(), tenant)


@pytest.mark.parametrize(
    "tenant",
    [
        _tenant(slug="pasteleria-taboada"),
        _tenant(name="Panadería Taboada"),
        _tenant(name="Chocolates Taboada", slug="chocolates-taboada"),
    ],
)
def test_nombre_o_slug_con_taboada_sin_modulo_no_da_acceso(tenant):
    assert not check_taboada_access(_user(email="x@taboada.com"), tenant)


def test_tenant_inexistente_no_da_acceso():
    assert not tenant_has_momentos_taboada(None)
    assert not check_taboada_access(_user(), None)


def test_superadmin_siempre_tiene_acceso():
    assert check_taboada_access(_user(role=UserRole.SUPERADMIN), _tenant())


@pytest.mark.asyncio
async def test_get_tenant_id_rechaza_tenant_sin_modulo():
    with patch("app.api.v1.endpoints.momentos_taboada.Tenant") as tenant_cls:
        tenant_cls.get = AsyncMock(return_value=_tenant(slug="mi-taboada"))
        with pytest.raises(HTTPException) as exc:
            await get_taboada_tenant_id(_user())
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_get_tenant_id_no_cae_a_otro_tenant_por_nombre():
    """Si el tenant del usuario no existe, se rechaza; no se busca 'Chocolates Taboada'."""
    with patch("app.api.v1.endpoints.momentos_taboada.Tenant") as tenant_cls:
        tenant_cls.get = AsyncMock(return_value=None)
        tenant_cls.find_one = AsyncMock(return_value=_tenant(modulos=["MOMENTOS_TABOADA"]))
        with pytest.raises(HTTPException) as exc:
            await get_taboada_tenant_id(_user())
    assert exc.value.status_code == 403
    tenant_cls.find_one.assert_not_called()


@pytest.mark.asyncio
async def test_get_tenant_id_devuelve_tenant_propio_con_modulo():
    with patch("app.api.v1.endpoints.momentos_taboada.Tenant") as tenant_cls:
        tenant_cls.get = AsyncMock(return_value=_tenant(modulos=["MOMENTOS_TABOADA"]))
        assert await get_taboada_tenant_id(_user()) == TENANT_ID
