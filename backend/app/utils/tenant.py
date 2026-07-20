from fastapi import Request, HTTPException

def get_tenant_id(request: Request) -> str:
    """
    FastAPI dependency that extracts the tenant_id from the request state.
    Raises 403 Forbidden if not identified to enforce strict multi-tenant isolation.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=403, detail="Tenant context not identified")
    return tenant_id

def get_sucursal_id_opt(request: Request) -> str | None:
    """
    FastAPI dependency that extracts the sucursal_id from the request state.
    Returns None if Matriz level.
    """
    return getattr(request.state, "sucursal_id", None)
