"""Autorización de la sesión de caja elegida al anular una venta. Corre sin MongoDB."""
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId
from fastapi import HTTPException

from app.application.services import sales_anulacion_service as svc_mod
from app.application.services.sales_anulacion_service import SalesAnulacionService
from app.domain.models.user import UserRole
from app.utils.errors import CajaErrors

resolver = SalesAnulacionService._resolver_caja_sesion


def mk_user(role, uid="u1", tenant="t1", sucursal="S1"):
    return SimpleNamespace(id=uid, role=role, tenant_id=tenant, sucursal_id=sucursal)


def mk_sesion(cajero="u1", tenant="t1", sucursal="S1"):
    return SimpleNamespace(id=ObjectId(), cajero_id=cajero, tenant_id=tenant, sucursal_id=sucursal)


@pytest.fixture
def caja_mock(monkeypatch):
    m = MagicMock()
    m.find_one = AsyncMock(return_value=None)
    monkeypatch.setattr(svc_mod, "CajaSesion", m)
    return m


def assert_404(ei):
    assert ei.value.status_code == 404
    assert ei.value.detail == CajaErrors.SESION_NO_ENCONTRADA


async def test_id_invalido_404_sin_db(caja_mock):
    with pytest.raises(HTTPException) as ei:
        await resolver("no-es-objectid", mk_user(UserRole.CAJERO), "t1", "S1")
    assert_404(ei)
    caja_mock.find_one.assert_not_called()


async def test_query_filtra_tenant_y_abierta(caja_mock, monkeypatch):
    # Los operandos de Beanie sobre un MagicMock no son comparables, así que se
    # verifica que la consulta reciba id, tenant y estado (3 filtros) + session.
    caja_mock.find_one.return_value = mk_sesion()
    sentinel = object()
    await resolver(str(ObjectId()), mk_user(UserRole.CAJERO), "t1", "S1", sentinel)
    args, kwargs = caja_mock.find_one.call_args
    assert len(args) == 3
    assert kwargs["session"] is sentinel


async def test_no_encontrada_o_cerrada_404(caja_mock):
    with pytest.raises(HTTPException) as ei:
        await resolver(str(ObjectId()), mk_user(UserRole.CAJERO), "t1", "S1")
    assert_404(ei)


async def test_caja_de_otra_cajera_404(caja_mock):
    caja_mock.find_one.return_value = mk_sesion(cajero="otra")
    with pytest.raises(HTTPException) as ei:
        await resolver(str(ObjectId()), mk_user(UserRole.CAJERO, uid="c1"), "t1", "S1")
    assert_404(ei)


async def test_vendedor_no_usa_caja_ajena(caja_mock):
    caja_mock.find_one.return_value = mk_sesion(cajero="otra")
    with pytest.raises(HTTPException) as ei:
        await resolver(str(ObjectId()), mk_user(UserRole.VENDEDOR, uid="v1"), "t1", "S1")
    assert_404(ei)


async def test_otro_tenant_404(caja_mock):
    # Defensa en profundidad: aunque la query devolviera una sesión ajena.
    caja_mock.find_one.return_value = mk_sesion(tenant="t2")
    with pytest.raises(HTTPException) as ei:
        await resolver(str(ObjectId()), mk_user(UserRole.SUPERADMIN), "t1", "S1")
    assert_404(ei)


async def test_supervisor_otra_sucursal_404(caja_mock):
    caja_mock.find_one.return_value = mk_sesion(cajero="otra", sucursal="S2")
    with pytest.raises(HTTPException) as ei:
        await resolver(str(ObjectId()), mk_user(UserRole.SUPERVISOR), "t1", "S2")
    assert_404(ei)


async def test_matriz_no_revierte_en_caja_de_otra_sucursal_que_la_venta(caja_mock):
    caja_mock.find_one.return_value = mk_sesion(cajero="otra", sucursal="S2")
    with pytest.raises(HTTPException) as ei:
        await resolver(str(ObjectId()), mk_user(UserRole.ADMIN_MATRIZ, sucursal=None), "t1", "S1")
    assert_404(ei)


async def test_matriz_usa_caja_ajena_de_la_sucursal_de_la_venta(caja_mock):
    s = mk_sesion(cajero="otra", sucursal="S2")
    caja_mock.find_one.return_value = s
    got = await resolver(str(ObjectId()), mk_user(UserRole.ADMIN_MATRIZ, sucursal=None), "t1", "S2")
    assert got is s


@pytest.mark.parametrize("role", [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR])
async def test_rol_sucursal_usa_caja_de_su_sucursal(caja_mock, role):
    s = mk_sesion(cajero="otra")
    caja_mock.find_one.return_value = s
    assert await resolver(str(ObjectId()), mk_user(role), "t1", "S1") is s


async def test_cajero_usa_su_propia_caja(caja_mock):
    s = mk_sesion(cajero="c1")
    caja_mock.find_one.return_value = s
    assert await resolver(str(ObjectId()), mk_user(UserRole.CAJERO, uid="c1"), "t1", "S1") is s


async def test_sesion_legacy_sin_sucursal_equivale_a_central(caja_mock):
    s = mk_sesion(cajero="c1", sucursal=None)
    caja_mock.find_one.return_value = s
    user = mk_user(UserRole.CAJERO, uid="c1", sucursal=None)
    assert await resolver(str(ObjectId()), user, "t1", None) is s


async def test_superadmin_staff_solo_dueno(caja_mock):
    caja_mock.find_one.return_value = mk_sesion(cajero="otra")
    with pytest.raises(HTTPException) as ei:
        await resolver(str(ObjectId()), mk_user(UserRole.SUPERADMIN_STAFF, uid="x1"), "t1", "S1")
    assert_404(ei)


# ---------------------------------------------------------------- cableado

class _Tx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


class _Session(_Tx):
    def start_transaction(self):
        return _Tx()


async def test_anular_sale_usa_resolver_y_no_crea_movimientos(monkeypatch):
    """anular_sale con caja_sesion_id ajeno -> 404 del resolver, sin CajaMovimiento."""
    session = _Session()
    client = MagicMock()
    client.start_session = AsyncMock(return_value=session)
    monkeypatch.setattr(svc_mod, "get_client", lambda: client)

    sale = SimpleNamespace(
        id=ObjectId(), tenant_id="t1", sucursal_id="S1", anulada=False,
        cashier_id="c1", items=[], pagos=[], cliente_id=None,
    )
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=sale)
    monkeypatch.setattr(SalesAnulacionService, "_get_sale_repo", staticmethod(lambda: repo))

    movimiento = MagicMock()
    monkeypatch.setattr(svc_mod, "CajaMovimiento", movimiento)

    spy = AsyncMock(side_effect=HTTPException(status_code=404, detail=CajaErrors.SESION_NO_ENCONTRADA))
    monkeypatch.setattr(SalesAnulacionService, "_resolver_caja_sesion", spy)

    user = mk_user(UserRole.ADMIN_MATRIZ, sucursal=None)
    sid = str(ObjectId())
    with pytest.raises(HTTPException) as ei:
        await SalesAnulacionService.anular_sale(
            str(sale.id), user, motivo="OTRO", afectar_caja=True, caja_sesion_id=sid,
        )
    assert_404(ei)
    spy.assert_awaited_once_with(sid, user, "t1", "S1", session)
    movimiento.assert_not_called()
    movimiento.find.assert_not_called()
    repo.update.assert_not_called()
