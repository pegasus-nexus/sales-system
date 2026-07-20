from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from jose import jwt, JWTError
from app.infrastructure.core.config import settings

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"

class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that extracts the tenant_id from the JWT token in request headers
    and stores it in request.state for absolute database isolation helpers to use.
    """
    async def dispatch(self, request: Request, call_next):
        # Default tenant context to None
        request.state.tenant_id = None
        request.state.sucursal_id = None

        # Check Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "", 1)
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                request.state.tenant_id = payload.get("tenant_id")
                request.state.sucursal_id = payload.get("sucursal_id")
            except JWTError:
                # Let OAuth2 security dependencies handle actual validation failures
                pass

        return await call_next(request)
