from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User
from app.domain.schemas.catalogo import (
    CatalogoRegisterRequest,
    CatalogoGoogleAuthRequest,
    CatalogoAuthResponse,
    CatalogoConfigUpdate,
    CatalogoConfigOut,
    CatalogoProductoCreate,
    CatalogoProductoUpdate,
    CatalogoProductoOut,
    PublicCatalogoResponse,
)
from app.application.services.catalogo_service import CatalogoService
from app.infrastructure.repositories.catalogo_repository import (
    MongoCatalogoConfigRepository,
    MongoCatalogoProductoRepository,
    MongoCatalogoAuthRepository,
)

router = APIRouter(prefix="/catalogo", tags=["catalogo"])


def get_catalogo_service() -> CatalogoService:
    config_repo = MongoCatalogoConfigRepository()
    producto_repo = MongoCatalogoProductoRepository()
    auth_repo = MongoCatalogoAuthRepository()
    return CatalogoService(config_repo, producto_repo, auth_repo)


# ==========================================
# Endpoints Públicos (Sin Autenticación)
# ==========================================

@router.post("/register", response_model=CatalogoAuthResponse, status_code=status.HTTP_201_CREATED)
async def register_merchant(
    req: CatalogoRegisterRequest,
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Registro rápido para nuevos comercios en el servicio de catálogos digitales.
    Crea automáticamente el tenant, usuario administrador y configuración inicial.
    """
    return await service.register_merchant(req)


@router.post("/google-auth", response_model=CatalogoAuthResponse)
async def google_auth_merchant(
    req: CatalogoGoogleAuthRequest,
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Inicio de sesión o registro con 1 clic mediante Google OAuth (Google Identity Services).
    """
    return await service.google_auth_merchant(req)


@router.get("/public/{slug}", response_model=PublicCatalogoResponse)
async def get_public_catalog(
    slug: str,
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Consulta pública para clientes y redes sociales.
    Retorna la configuración de marca (logo, colores, WhatsApp) y la lista de productos disponibles.
    """
    return await service.get_public_catalog(slug)


@router.get("/check-slug/{slug}")
async def check_slug_availability(
    slug: str,
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Verifica en tiempo real si un slug está disponible para ser usado por un comercio.
    """
    available = await service.config_repo.is_slug_available(slug)
    return {"slug": slug, "available": available}


# ==========================================
# Endpoints Protegidos (Gestión del Comercio)
# ==========================================

@router.get("/config", response_model=CatalogoConfigOut)
async def get_my_catalog_config(
    current_user: User = Depends(get_current_active_user),
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Obtiene la configuración visual y de contacto del catálogo del comercio autenticado.
    """
    return await service.get_tenant_config(current_user.tenant_id)


@router.put("/config", response_model=CatalogoConfigOut)
async def update_my_catalog_config(
    updates: CatalogoConfigUpdate,
    current_user: User = Depends(get_current_active_user),
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Actualiza colores, logo, teléfono de WhatsApp o slug del catálogo.
    """
    return await service.update_tenant_config(current_user.tenant_id, updates)


@router.get("/productos", response_model=List[CatalogoProductoOut])
async def list_my_products(
    current_user: User = Depends(get_current_active_user),
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Lista todos los productos del catálogo del comercio autenticado.
    """
    return await service.list_products(current_user.tenant_id)


@router.post("/productos", response_model=CatalogoProductoOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: CatalogoProductoCreate,
    current_user: User = Depends(get_current_active_user),
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Crea un nuevo producto en el catálogo digital.
    """
    return await service.create_product(current_user.tenant_id, data)


@router.put("/productos/{product_id}", response_model=CatalogoProductoOut)
async def update_product(
    product_id: str,
    data: CatalogoProductoUpdate,
    current_user: User = Depends(get_current_active_user),
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Actualiza datos, fotos, precio o visibilidad de un producto del catálogo.
    """
    return await service.update_product(current_user.tenant_id, product_id, data)


@router.delete("/productos/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    service: CatalogoService = Depends(get_catalogo_service)
):
    """
    Elimina (soft-delete) un producto del catálogo digital.
    """
    return await service.delete_product(current_user.tenant_id, product_id)
