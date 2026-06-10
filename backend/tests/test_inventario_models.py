import pytest
import pytest_asyncio
from decimal import Decimal
from datetime import datetime
from bson import ObjectId

from app.domain.models.inventario import Inventario, InventoryLog, TipoMovimiento
from app.domain.models.base import DecimalMoney

@pytest.mark.asyncio
async def test_inventario_model_validation():
    """
    Test de validación del modelo de Inventario y Kárdex (InventoryLog).
    Asegura que Pydantic valide correctamente las cantidades y tipos de movimiento.
    """
    try:
        inventario = Inventario(
            tenant_id="test_tenant",
            sucursal_id="sucursal_1",
            almacen_id="almacen_principal",
            producto_id="producto_123",
            cantidad=100.5,
            precio_sucursal=DecimalMoney("15.50")
        )
        
        assert inventario.cantidad == 100.5
        assert inventario.precio_sucursal.to_decimal() == Decimal("15.50")
    except Exception as e:
        pytest.fail(f"Falló la instanciación de Inventario: {e}")

@pytest.mark.asyncio
async def test_inventory_log_kardex():
    """
    Test del Kárdex (Log de Inventario).
    """
    try:
        log = InventoryLog(
            tenant_id="test_tenant",
            sucursal_id="sucursal_1",
            almacen_id="almacen_principal",
            producto_id="producto_123",
            descripcion="Arroz integral",
            tipo_movimiento=TipoMovimiento.ENTRADA_MANUAL,
            cantidad_movida=50.0,
            stock_resultante=150.5,
            usuario_id="user_123",
            usuario_nombre="Admin Test",
            notas="Ingreso de proveedor"
        )
        
        assert log.tipo_movimiento == TipoMovimiento.ENTRADA_MANUAL
        assert log.cantidad_movida == 50.0
        assert log.stock_resultante == 150.5
    except Exception as e:
        pytest.fail(f"Falló la instanciación de InventoryLog: {e}")
