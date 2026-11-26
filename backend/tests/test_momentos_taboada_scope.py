"""
Segregación por sucursal en Momentos Taboada.

Cajeros y admins de sucursal operan y consultan SOLO su sucursal;
la matriz elige la sucursal y ve todas.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import HTTPException

from app.application.services.momentos_taboada_scope_service import (
    MomentosTaboadaScopeService as Scope,
)
from app.application.services.momentos_taboada_service import MomentosTaboadaService
from app.domain.models.user import UserRole

PROPIA = "650000000000000000000011"
OTRA = "650000000000000000000022"


def _user(role, sucursal_id=PROPIA):
    user = MagicMock()
    user.id = ObjectId()
    user.role = role
    user.sucursal_id = sucursal_id
    user.full_name = "Usuario"
    user.username = "usuario"
    return user


@pytest.mark.parametrize(
    "role", [UserRole.CAJERO, UserRole.VENDEDOR, UserRole.SUPERVISOR, UserRole.ADMIN_SUCURSAL]
)
def test_usuario_sucursal_canjea_en_su_sucursal(role):
    assert Scope.resolver_sucursal_operacion(_user(role), None) == PROPIA
    assert Scope.resolver_sucursal_operacion(_user(role), PROPIA) == PROPIA


@pytest.mark.parametrize("role", [UserRole.CAJERO, UserRole.ADMIN_SUCURSAL])
def test_usuario_sucursal_no_puede_canjear_en_otra(role):
    with pytest.raises(HTTPException) as exc:
        Scope.resolver_sucursal_operacion(_user(role), OTRA)
    assert exc.value.status_code == 403


def test_cajero_sin_sucursal_queda_bloqueado():
    with pytest.raises(HTTPException) as exc:
        Scope.resolver_sucursal_operacion(_user(UserRole.CAJERO, sucursal_id=None), None)
    assert exc.value.status_code == 403
    assert "sucursal asignada" in exc.value.detail


def test_matriz_elige_sucursal_y_debe_indicarla():
    matriz = _user(UserRole.ADMIN_MATRIZ, sucursal_id=None)
    assert Scope.resolver_sucursal_operacion(matriz, OTRA) == OTRA
    with pytest.raises(HTTPException) as exc:
        Scope.resolver_sucursal_operacion(matriz, None)
    assert exc.value.status_code == 400


def test_lectura_sucursal_ignora_filtro_pedido():
    assert Scope.resolver_sucursal_lectura(_user(UserRole.CAJERO), OTRA) == PROPIA
    assert Scope.resolver_sucursal_lectura(_user(UserRole.CAJERO), "TODAS") == PROPIA


def test_lectura_matriz_respeta_filtro():
    matriz = _user(UserRole.ADMIN_MATRIZ, sucursal_id=None)
    assert Scope.resolver_sucursal_lectura(matriz, "TODAS") == "TODAS"
    assert Scope.resolver_sucursal_lectura(matriz, OTRA) == OTRA


@pytest.mark.asyncio
async def test_canje_rechaza_sucursal_de_otro_tenant():
    premio = MagicMock()
    premio.tenant_id = "tenant_a"
    premio.nombre = "Taza"
    premio.sellos_requeridos = 5
    premio.stock_por_sucursal = {OTRA: 3}

    sucursal_ajena = MagicMock()
    sucursal_ajena.tenant_id = "tenant_b"

    base = "app.application.services.momentos_taboada_service"
    with patch(f"{base}.PremioMomentosTaboada") as premio_cls, \
         patch(f"{base}.Sucursal") as sucursal_cls, \
         patch.object(MomentosTaboadaService, "buscar_cliente_sellos", new=AsyncMock(
             return_value={"balance": {"sellos_disponibles": 10}, "cliente": {"id": None, "nombre": "C"}}
         )):
        premio_cls.get = AsyncMock(return_value=premio)
        sucursal_cls.get = AsyncMock(return_value=sucursal_ajena)
        with pytest.raises(HTTPException) as exc:
            await MomentosTaboadaService.registrar_canje(
                "tenant_a",
                {"premio_id": str(ObjectId()), "sucursal_id": OTRA, "cliente_telefono": "70000000"},
                _user(UserRole.ADMIN_MATRIZ),
            )
    assert exc.value.status_code == 400
    premio.save.assert_not_called()
