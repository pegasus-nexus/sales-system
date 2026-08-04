import uuid
from decimal import Decimal

import pytest

from app.application.services.product_service import ProductService
from app.domain.models.category import Category
from app.domain.models.inventario import Inventario
from app.domain.models.product import Product
from app.domain.models.user import User, UserRole


@pytest.mark.asyncio
async def test_product_price_mapping_for_sucursal_cajero():
    """
    Test de Integración para la resolución de precios por sucursal.
    Garantiza que un cajero asignado a una sucursal reciba el precio_sucursal (> 0)
    en lugar del precio base de la matriz (0.00), evitando la falla de ceros en el POS.
    """
    tenant_id = f"tenant_test_prices_{uuid.uuid4().hex[:8]}"
    sucursal_id = f"sucursal_heroinas_{uuid.uuid4().hex[:8]}"

    # 1. Crear categoría de prueba
    cat = Category(
        tenant_id=tenant_id,
        name="Cremas Test",
        is_active=True
    )
    await cat.create()

    # 2. Crear Producto con precio base = 0.0 (o base)
    product = Product(
        tenant_id=tenant_id,
        descripcion="Crema Secadora de Acne Test",
        precio_venta=Decimal("0.0"),
        categoria_id=str(cat.id),
        codigo_corto="TEST-01",
        is_active=True
    )
    await product.create()

    # 3. Crear Registro de Inventario con precio_sucursal = 63.0
    inv = Inventario(
        tenant_id=tenant_id,
        sucursal_id=sucursal_id,
        producto_id=str(product.id),
        cantidad=100.0,
        precio_sucursal=Decimal("63.0")
    )
    await inv.create()

    # 4. Crear Usuario Cajero asignado a la sucursal
    cajero = User(
        username="cajero_heroinas_test",
        email="cajero@heroinas.com",
        tenant_id=tenant_id,
        sucursal_id=sucursal_id,
        role=UserRole.CAJERO,
        hashed_password="hashed_pwd"
    )
    await cajero.create()

    # 5. Ejecutar la resolución de productos a través de ProductService
    result = await ProductService.get_products_list(
        current_user=cajero,
        page=1,
        limit=50
    )

    items = result.get("items", [])
    assert len(items) == 1, "Debe devolver 1 producto de prueba"
    fetched_product = items[0]

    # Validar que el precio de venta resuelto para el cajero es 63.0 y NO 0.0
    assert fetched_product.precio_venta == 63.0
