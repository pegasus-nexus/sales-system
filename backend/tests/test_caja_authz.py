"""Autorización horizontal de sesiones de caja. Corre sin MongoDB."""
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId
from fastapi import HTTPException

from app.application.services import caja_service
from app.application.services.caja_access import (
    cajero_filtro,
    puede_acceder_sesion,
    sucursal_de,
)
from app.application.services.caja_service import CajaService
from app.domain.models.user import UserRole
from app.domain.schemas.caja import CerrarCajaIn
from app.utils.errors import CajaErrors


def mk_user(role, uid="u1", tenant="t1", sucursal="S1"):
    return SimpleNamespace(id=uid, role=role, tenant_id=tenant, sucursal_id=sucursal)


def mk_sesion(cajero="u1", tenant="t1", sucursal="S1", **kw):
    return SimpleNamespace(cajero_id=cajero, tenant_id=tenant, sucursal_id=sucursal, **kw)


# ---------------------------------------------------------------- política

def test_matriz_ve_otra_sucursal():
    u = mk_user(UserRole.ADMIN_MATRIZ, sucursal=None)
    assert puede_acceder_sesion(u, mk_sesion(cajero="otro", sucursal="S9"))


def test_admin_alias_es_matriz():
    u = mk_user(UserRole.ADMIN)
    assert puede_acceder_sesion(u, mk_sesion(cajero="otro", sucursal="S9"))


@pytest.mark.parametrize("role", [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR])
def test_rol_sucursal_ve_su_sucursal_no_otra(role):
    u = mk_user(role)
    assert puede_acceder_sesion(u, mk_sesion(cajero="otro", sucursal="S1"))
    assert not puede_acceder_sesion(u, mk_sesion(cajero="otro", sucursal="S2"))


def test_cajero_solo_la_suya():
    u = mk_user(UserRole.CAJERO, uid="c1")
    assert puede_acceder_sesion(u, mk_sesion(cajero="c1"))
    assert not puede_acceder_sesion(u, mk_sesion(cajero="c2"))


def test_cajero_no_ve_la_suya_en_otra_sucursal():
    u = mk_user(UserRole.CAJERO, uid="c1")
    assert not puede_acceder_sesion(u, mk_sesion(cajero="c1", sucursal="S2"))


@pytest.mark.parametrize("suc_sesion", [None, "CENTRAL"])
def test_usuario_sin_sucursal_equivale_a_central(suc_sesion):
    u = mk_user(UserRole.CAJERO, uid="c1", sucursal=None)
    assert sucursal_de(u) == "CENTRAL"
    assert puede_acceder_sesion(u, mk_sesion(cajero="c1", sucursal=suc_sesion))
    assert not puede_acceder_sesion(u, mk_sesion(cajero="c1", sucursal="S1"))


def test_usuario_con_sucursal_no_ve_sesion_legacy_central():
    u = mk_user(UserRole.ADMIN_SUCURSAL)
    assert not puede_acceder_sesion(u, mk_sesion(sucursal=None))


@pytest.mark.parametrize("role", [UserRole.VENDEDOR, UserRole.FACTURADOR])
def test_otros_roles_dueno_solo(role):
    u = mk_user(role, uid="v1")
    assert puede_acceder_sesion(u, mk_sesion(cajero="v1"))
    assert not puede_acceder_sesion(u, mk_sesion(cajero="v2"))


@pytest.mark.parametrize("role", [
    UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL,
    UserRole.SUPERVISOR, UserRole.CAJERO, UserRole.VENDEDOR,
])
def test_tenant_distinto_siempre_negado(role):
    u = mk_user(role, uid="u1")
    assert not puede_acceder_sesion(u, mk_sesion(cajero="u1", tenant="t2"))


def test_tenant_none_es_default():
    u = mk_user(UserRole.ADMIN_MATRIZ, tenant=None)
    assert puede_acceder_sesion(u, mk_sesion(tenant="default"))
    assert not puede_acceder_sesion(u, mk_sesion(tenant="t1"))


def test_cajero_filtro():
    assert cajero_filtro(mk_user(UserRole.SUPERADMIN)) is None
    assert cajero_filtro(mk_user(UserRole.ADMIN_MATRIZ)) is None
    assert cajero_filtro(mk_user(UserRole.ADMIN_SUCURSAL)) is None
    assert cajero_filtro(mk_user(UserRole.SUPERVISOR)) is None
    assert cajero_filtro(mk_user(UserRole.CAJERO, uid="c1")) == "c1"
    assert cajero_filtro(mk_user(UserRole.VENDEDOR, uid=42)) == "42"


# ---------------------------------------------------------------- servicio

@pytest.fixture
def caja_mock(monkeypatch):
    m = MagicMock()
    m.find_one = AsyncMock(return_value=None)
    monkeypatch.setattr(caja_service, "CajaSesion", m)
    return m


async def test_id_invalido_404_sin_db(caja_mock):
    with pytest.raises(HTTPException) as ei:
        await CajaService.get_sesion_autorizada("no-es-objectid", mk_user(UserRole.CAJERO))
    assert ei.value.status_code == 404
    caja_mock.find_one.assert_not_called()


async def test_no_encontrada_404(caja_mock):
    with pytest.raises(HTTPException) as ei:
        await CajaService.get_sesion_autorizada(str(ObjectId()), mk_user(UserRole.CAJERO))
    assert ei.value.status_code == 404
    assert ei.value.detail == CajaErrors.SESION_NO_ENCONTRADA
    caja_mock.find_one.assert_awaited_once()


async def test_denegada_404_mismo_detail(caja_mock):
    caja_mock.find_one.return_value = mk_sesion(cajero="otra")
    with pytest.raises(HTTPException) as ei:
        await CajaService.get_sesion_autorizada(str(ObjectId()), mk_user(UserRole.CAJERO, uid="c1"))
    assert ei.value.status_code == 404
    assert ei.value.detail == CajaErrors.SESION_NO_ENCONTRADA


async def test_permitida_devuelve_sesion(caja_mock):
    s = mk_sesion(cajero="c1")
    caja_mock.find_one.return_value = s
    got = await CajaService.get_sesion_autorizada(str(ObjectId()), mk_user(UserRole.CAJERO, uid="c1"))
    assert got is s


async def test_cerrar_caja_ajena_404_y_no_guarda(caja_mock):
    s = mk_sesion(cajero="otra", save=AsyncMock(), estado="ABIERTA")
    caja_mock.find_one.return_value = s
    with pytest.raises(HTTPException) as ei:
        await CajaService.cerrar_caja(
            str(ObjectId()), CerrarCajaIn(monto_fisico_contado=10.0), mk_user(UserRole.CAJERO, uid="c1")
        )
    assert ei.value.status_code == 404
    s.save.assert_not_called()
    assert s.estado == "ABIERTA"
