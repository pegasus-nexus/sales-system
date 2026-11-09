import re
import secrets
import unicodedata
from typing import Optional, List, Dict, Any
from datetime import timedelta
from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.domain.repositories.catalogo_repository import (
    ICatalogoConfigRepository,
    ICatalogoProductoRepository,
    ICatalogoAuthRepository,
)
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
from app.infrastructure.auth import (
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.domain.models.user import UserRole
from app.infrastructure.core.config import settings


def normalize_catalog_phone(phone: Optional[str]) -> str:
    """Normaliza un número de WhatsApp asegurando prefijo internacional (por defecto +591 en Bolivia)."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if not digits:
        return ""
    if len(digits) == 8 and digits[0] in ("6", "7"):
        return f"+591{digits}"
    return f"+{digits}" if not phone.strip().startswith("+") else phone.strip()


def slugify(text: str) -> str:
    """Convierte texto en un slug limpio y seguro para URL."""
    clean = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8').lower()
    clean = re.sub(r'[^a-z0-9]+', '-', clean).strip('-')
    return clean or "catalogo"


class CatalogoService:
    def __init__(
        self,
        config_repo: ICatalogoConfigRepository,
        producto_repo: ICatalogoProductoRepository,
        auth_repo: ICatalogoAuthRepository,
    ):
        self.config_repo = config_repo
        self.producto_repo = producto_repo
        self.auth_repo = auth_repo

    async def _generate_unique_slug(self, base_name: str, preferred_slug: Optional[str] = None) -> str:
        candidate = slugify(preferred_slug) if preferred_slug else slugify(base_name)
        if len(candidate) < 3:
            candidate = f"cat-{candidate}"
        
        if await self.config_repo.is_slug_available(candidate):
            return candidate

        for _ in range(10):
            suffix = secrets.token_hex(2)
            trial = f"{candidate}-{suffix}"
            if await self.config_repo.is_slug_available(trial):
                return trial
        return f"{candidate}-{secrets.token_hex(4)}"

    async def register_merchant(self, req: CatalogoRegisterRequest) -> CatalogoAuthResponse:
        existing_user = await self.auth_repo.find_user_by_email(req.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya se encuentra registrado en la plataforma."
            )

        slug = await self._generate_unique_slug(req.company_name, req.slug)

        tenant = await self.auth_repo.create_tenant(name=req.company_name, slug=slug)
        tenant_id = tenant["id"]

        user_data = {
            "username": req.email.strip().lower(),
            "email": req.email.strip().lower(),
            "hashed_password": get_password_hash(req.password),
            "full_name": f"{req.first_name.strip()} {req.last_name.strip()}",
            "role": UserRole.CATALOGO_MERCHANT.value,
            "tenant_id": tenant_id,
        }
        user = await self.auth_repo.create_user(user_data)

        config_data = {
            "tenant_id": tenant_id,
            "business_name": req.company_name.strip(),
            "slug": slug,
            "whatsapp_number": normalize_catalog_phone(req.whatsapp),
            "primary_color": "#4f46e5",
            "secondary_color": "#06b6d4",
            "currency_symbol": "Bs.",
            "is_active": True,
        }
        await self.config_repo.create(config_data)

        expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={
                "sub": user["username"],
                "role": user["role"],
                "tenant_id": tenant_id,
                "sucursal_id": None
            },
            expires_delta=expires
        )

        return CatalogoAuthResponse(
            access_token=token,
            user_id=user["id"],
            full_name=user.get("full_name", req.company_name),
            email=user["email"],
            tenant_id=tenant_id,
            slug=slug,
            business_name=req.company_name
        )

    async def google_auth_merchant(self, req: CatalogoGoogleAuthRequest) -> CatalogoAuthResponse:
        try:
            google_client_id = getattr(settings, "GOOGLE_CLIENT_ID", None) or "32112312994-ddleo20g3kjtbrjo6s12uetv5iibujfn.apps.googleusercontent.com"
            id_info = id_token.verify_oauth2_token(
                req.credential,
                google_requests.Request(),
                google_client_id if google_client_id else None
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Token de Google inválido o expirado: {str(e)}"
            )

        email = id_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="El token de Google no contiene un correo válido.")

        given_name = id_info.get("given_name", "")
        family_name = id_info.get("family_name", "")
        full_name = id_info.get("name", f"{given_name} {family_name}").strip()
        picture = id_info.get("picture")

        existing_user = await self.auth_repo.find_user_by_email(email)
        if existing_user:
            tenant_id = existing_user.get("tenant_id")
            config = await self.config_repo.get_by_tenant_id(tenant_id) if tenant_id else None
            slug = config.get("slug", "") if config else ""
            b_name = config.get("business_name", full_name) if config else full_name

            expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            token = create_access_token(
                data={
                    "sub": existing_user["username"],
                    "role": existing_user.get("role", UserRole.CATALOGO_MERCHANT.value),
                    "tenant_id": tenant_id,
                    "sucursal_id": existing_user.get("sucursal_id")
                },
                expires_delta=expires
            )
            return CatalogoAuthResponse(
                access_token=token,
                user_id=existing_user["id"],
                full_name=existing_user.get("full_name", full_name),
                email=existing_user.get("email", email),
                tenant_id=tenant_id or "",
                slug=slug,
                business_name=b_name
            )

        company_name = req.company_name or f"Catálogo de {given_name or full_name}"
        slug = await self._generate_unique_slug(company_name)

        tenant = await self.auth_repo.create_tenant(name=company_name, slug=slug)
        tenant_id = tenant["id"]

        dummy_password = secrets.token_urlsafe(24)
        user_data = {
            "username": email.strip().lower(),
            "email": email.strip().lower(),
            "hashed_password": get_password_hash(dummy_password),
            "full_name": full_name,
            "role": UserRole.CATALOGO_MERCHANT.value,
            "tenant_id": tenant_id,
        }
        user = await self.auth_repo.create_user(user_data)

        config_data = {
            "tenant_id": tenant_id,
            "business_name": company_name.strip(),
            "slug": slug,
            "logo_url": picture,
            "whatsapp_number": req.whatsapp.strip() if req.whatsapp else "",
            "primary_color": "#4f46e5",
            "secondary_color": "#06b6d4",
            "currency_symbol": "Bs.",
            "is_active": True,
        }
        await self.config_repo.create(config_data)

        expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={
                "sub": user["username"],
                "role": user["role"],
                "tenant_id": tenant_id,
                "sucursal_id": None
            },
            expires_delta=expires
        )
        return CatalogoAuthResponse(
            access_token=token,
            user_id=user["id"],
            full_name=user.get("full_name", full_name),
            email=user["email"],
            tenant_id=tenant_id,
            slug=slug,
            business_name=company_name
        )

    async def get_tenant_config(self, tenant_id: str) -> CatalogoConfigOut:
        config = await self.config_repo.get_by_tenant_id(tenant_id)
        if not config:
            # Auto-inicializar configuración si el tenant aún no tiene
            config = await self.config_repo.create({
                "tenant_id": tenant_id,
                "business_name": "Mi Catálogo Digital",
                "slug": f"cat-{tenant_id[:6]}",
                "primary_color": "#4f46e5",
                "secondary_color": "#06b6d4",
                "currency_symbol": "Bs.",
                "is_active": True
            })
        return CatalogoConfigOut(**config)

    async def update_tenant_config(self, tenant_id: str, updates: CatalogoConfigUpdate) -> CatalogoConfigOut:
        dump = updates.model_dump(exclude_unset=True)
        if "whatsapp_number" in dump:
            dump["whatsapp_number"] = normalize_catalog_phone(dump["whatsapp_number"])
        
        # En la versión gratuita actual, el slug es inmutable (se habilitará en planes de pago)
        dump.pop("slug", None)
        if "slug" in dump and dump["slug"]:
            clean_slug = slugify(dump["slug"])
            is_avail = await self.config_repo.is_slug_available(clean_slug, exclude_tenant_id=tenant_id)
            if not is_avail:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El enlace personalizado '{clean_slug}' ya está en uso por otro negocio."
                )
            dump["slug"] = clean_slug

        updated = await self.config_repo.update(tenant_id, dump)
        if not updated:
            raise HTTPException(status_code=404, detail="Configuración no encontrada.")
        return CatalogoConfigOut(**updated)

    async def get_public_catalog(self, slug: str) -> PublicCatalogoResponse:
        config = await self.config_repo.get_by_slug(slug)
        if not config or not config.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El catálogo solicitado no existe o no está activo."
            )
        tenant_id = config["tenant_id"]
        products_raw = await self.producto_repo.list_by_tenant(tenant_id, only_available=True)
        products = [CatalogoProductoOut(**p) for p in products_raw]

        categories_set = {p.category for p in products if p.category}
        categories = sorted(list(categories_set))
        if "General" not in categories and categories:
            pass

        return PublicCatalogoResponse(
            config=CatalogoConfigOut(**config),
            products=products,
            categories=categories
        )

    async def list_products(self, tenant_id: str) -> List[CatalogoProductoOut]:
        raw = await self.producto_repo.list_by_tenant(tenant_id, only_available=False)
        return [CatalogoProductoOut(**p) for p in raw]

    async def create_product(self, tenant_id: str, data: CatalogoProductoCreate) -> CatalogoProductoOut:
        doc_data = data.model_dump()
        doc_data["tenant_id"] = tenant_id
        created = await self.producto_repo.create(doc_data)
        return CatalogoProductoOut(**created)

    async def update_product(self, tenant_id: str, product_id: str, data: CatalogoProductoUpdate) -> CatalogoProductoOut:
        updates = data.model_dump(exclude_unset=True)
        updated = await self.producto_repo.update(product_id, tenant_id, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Producto no encontrado o no pertenece al negocio.")
        return CatalogoProductoOut(**updated)

    async def delete_product(self, tenant_id: str, product_id: str) -> Dict[str, Any]:
        success = await self.producto_repo.delete(product_id, tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Producto no encontrado o no pertenece al negocio.")
        return {"success": True, "message": "Producto eliminado exitosamente del catálogo."}
