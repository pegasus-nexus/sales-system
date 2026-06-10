import pytest
import pytest_asyncio
from decimal import Decimal
from datetime import datetime
from bson import ObjectId

from app.domain.models.caja import CajaSesion, CajaMovimiento, EstadoSesion, SubtipoMovimiento
from app.domain.models.base import DecimalMoney
from app.domain.models.user import User

@pytest_asyncio.fixture
async def mock_user():
    return User(
        id=ObjectId(),
        username="cajero_1",
        email="cajero1@test.com",
        tenant_id="test_tenant",
        sucursal_id="sucursal_1",
        role="CAJERO",
        hashed_password="hashed"
    )

@pytest.mark.asyncio
async def test_apertura_caja_model(mock_user):
    """
    Test de validación del modelo de Sesión de Caja.
    Comprueba que los saldos iniciales se asignan correctamente.
    """
    try:
        sesion = CajaSesion(
            tenant_id=mock_user.tenant_id,
            sucursal_id=mock_user.sucursal_id,
            cajero_id=str(mock_user.id),
            cajero_name=mock_user.username,
            saldo_apertura=DecimalMoney("150.50"),
            saldo_esperado=DecimalMoney("150.50"),
            estado=EstadoSesion.ABIERTA,
            opened_at=datetime.utcnow()
        )
        
        assert sesion.estado == EstadoSesion.ABIERTA
        assert sesion.saldo_apertura.to_decimal() == Decimal("150.50")
        assert sesion.saldo_esperado.to_decimal() == Decimal("150.50")
    except Exception as e:
        pytest.fail(f"Falló la instanciación de CajaSesion: {e}")

@pytest.mark.asyncio
async def test_movimiento_caja_model(mock_user):
    """
    Test de validación para un Movimiento de Caja (Ingreso/Egreso).
    """
    try:
        movimiento = CajaMovimiento(
            tenant_id=mock_user.tenant_id,
            sucursal_id=mock_user.sucursal_id,
            sesion_id=str(ObjectId()),
            cajero_id=str(mock_user.id),
            cajero_name=mock_user.username,
            tipo="INGRESO",
            subtipo=SubtipoMovimiento.VENTA_EFECTIVO,
            monto=DecimalMoney("50.00"),
            descripcion="Venta de prueba"
        )
        
        assert movimiento.tipo == "INGRESO"
        assert movimiento.subtipo == SubtipoMovimiento.VENTA_EFECTIVO
        assert movimiento.monto.to_decimal() == Decimal("50.00")
    except Exception as e:
        pytest.fail(f"Falló la instanciación de CajaMovimiento: {e}")
