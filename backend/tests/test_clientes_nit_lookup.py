import pytest
from httpx import AsyncClient, ASGITransport
from bson import ObjectId
from app.main import app
from app.domain.models.cliente import Cliente
from app.domain.models.user import User
from app.infrastructure.auth import get_current_active_user

@pytest.mark.asyncio(loop_scope="session")
async def test_cliente_by_nit_and_tenant_isolation():
    tenant_a = "tenant_test_a"
    tenant_b = "tenant_test_b"

    # Clean existing test clients if any
    await Cliente.find(Cliente.tenant_id == tenant_a).delete()
    await Cliente.find(Cliente.tenant_id == tenant_b).delete()

    c_a = Cliente(
        tenant_id=tenant_a,
        nombre="EMPRESA ALFA S.A.",
        nit_ci="12345678",
        telefono="77711122",
        email="alfa@test.com",
        is_active=True
    )
    await c_a.create()

    c_b = Cliente(
        tenant_id=tenant_b,
        nombre="EMPRESA BETA S.A.",
        nit_ci="12345678",
        telefono="77733344",
        is_active=True
    )
    await c_b.create()

    user_a = User(
        id=ObjectId(),
        username="user_a",
        tenant_id=tenant_a,
        role="CAJERO",
        is_active=True,
        hashed_password="pw"
    )
    user_b = User(
        id=ObjectId(),
        username="user_b",
        tenant_id=tenant_b,
        role="CAJERO",
        is_active=True,
        hashed_password="pw"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. As User A
        app.dependency_overrides[get_current_active_user] = lambda: user_a
        res_a = await ac.get("/api/v1/clientes/by-nit/12345678")
        assert res_a.status_code == 200
        data_a = res_a.json()
        assert data_a is not None
        assert data_a["nombre"] == "EMPRESA ALFA S.A."
        assert data_a["tenant_id"] == tenant_a

        # 2. As User B
        app.dependency_overrides[get_current_active_user] = lambda: user_b
        res_b = await ac.get("/api/v1/clientes/by-nit/12345678")
        assert res_b.status_code == 200
        data_b = res_b.json()
        assert data_b is not None
        assert data_b["nombre"] == "EMPRESA BETA S.A."
        assert data_b["tenant_id"] == tenant_b

        # 3. Querying non-existent NIT returns null
        res_none = await ac.get("/api/v1/clientes/by-nit/999999999")
        assert res_none.status_code == 200
        assert res_none.json() is None

    app.dependency_overrides.clear()
    await c_a.delete()
    await c_b.delete()
