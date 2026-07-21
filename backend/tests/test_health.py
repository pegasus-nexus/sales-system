import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_health_check_endpoint():
    """
    Ensure the API health check endpoint is responding with 200 OK.
    This acts as a deployment readiness probe.
    """
    # Mocking the get_client call to bypass actual MongoDB connection during tests
    with patch("app.main.get_client") as mock_get_client:
        mock_client = AsyncMock()
        # Ensure await client.admin.command() returns successfully
        mock_client.admin.command = AsyncMock(return_value={"ok": 1})
        mock_get_client.return_value = mock_client
        
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/health")
        
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
