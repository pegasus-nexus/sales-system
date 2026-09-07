from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        # Prevenir Clickjacking (Click invisible)
        response.headers["X-Frame-Options"] = "DENY"
        # Forzar navegadores a respetar el MIME-type
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevenir XSS
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Forzar HTTPS (HSTS)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Ocultar la tecnologia real del servidor
        response.headers["Server"] = "Pegasus-Secure"
        
        return response
