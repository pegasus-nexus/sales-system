import asyncio
import os
import sys

from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db
from app.api.v1.endpoints.reports import get_sales_matrix
from app.domain.models.user import User, UserRole

async def main():
    await init_db()
    
    mock_user = User(username="test", hashed_password="test", email="test@test.com", role=UserRole.ADMIN_MATRIZ, tenant_id="69cd7f0a8f3f6866d4cfbb62", is_active=True, full_name="Test")
    
    try:
        res = await get_sales_matrix(
            start_date="2026-08-01",
            end_date="2026-08-02",
            sucursal_id="all",
            categoria_id="all",
            proveedor_id="all",
            current_user=mock_user
        )
        print(f"Products in matrix: {len(res.get('products', []))}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
