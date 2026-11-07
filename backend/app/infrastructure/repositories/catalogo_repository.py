import re
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.domain.models.catalogo import CatalogoConfig, CatalogoProducto
from app.domain.models.tenant import Tenant, PlanType, RubroEmpresa
from app.domain.models.user import User, UserRole
from app.domain.repositories.catalogo_repository import (
    ICatalogoConfigRepository,
    ICatalogoProductoRepository,
    ICatalogoAuthRepository,
)


def _doc_to_dict(doc) -> Dict[str, Any]:
    if not doc:
        return {}
    data = doc.model_dump()
    data["id"] = str(doc.id)
    return data


class MongoCatalogoConfigRepository(ICatalogoConfigRepository):
    async def get_by_tenant_id(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        doc = await CatalogoConfig.find_one(
            {"tenant_id": tenant_id, "deleted": False}
        )
        return _doc_to_dict(doc) if doc else None

    async def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        doc = await CatalogoConfig.find_one(
            {"slug": slug.strip().lower(), "deleted": False, "is_active": True}
        )
        return _doc_to_dict(doc) if doc else None

    async def create(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        config = CatalogoConfig(**config_data)
        await config.insert()
        return _doc_to_dict(config)

    async def update(self, tenant_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = await CatalogoConfig.find_one({"tenant_id": tenant_id, "deleted": False})
        if not doc:
            return None
        
        for k, v in updates.items():
            if hasattr(doc, k) and v is not None:
                setattr(doc, k, v)
        doc.updated_at = datetime.now(timezone.utc)
        await doc.save()
        return _doc_to_dict(doc)

    async def is_slug_available(self, slug: str, exclude_tenant_id: Optional[str] = None) -> bool:
        clean_slug = slug.strip().lower()
        query: Dict[str, Any] = {"slug": clean_slug, "deleted": False}
        if exclude_tenant_id:
            query["tenant_id"] = {"$ne": exclude_tenant_id}
        existing = await CatalogoConfig.find_one(query)
        return existing is None


class MongoCatalogoProductoRepository(ICatalogoProductoRepository):
    async def get_by_id(self, product_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        if not ObjectId.is_valid(product_id):
            return None
        doc = await CatalogoProducto.find_one({
            "_id": ObjectId(product_id),
            "tenant_id": tenant_id,
            "deleted": False
        })
        return _doc_to_dict(doc) if doc else None

    async def list_by_tenant(self, tenant_id: str, only_available: bool = False) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"tenant_id": tenant_id, "deleted": False}
        if only_available:
            query["is_available"] = True
        docs = await CatalogoProducto.find(query).sort([("order", 1), ("created_at", -1)]).to_list()
        return [_doc_to_dict(d) for d in docs]

    async def create(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        product = CatalogoProducto(**product_data)
        await product.insert()
        return _doc_to_dict(product)

    async def update(self, product_id: str, tenant_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not ObjectId.is_valid(product_id):
            return None
        doc = await CatalogoProducto.find_one({
            "_id": ObjectId(product_id),
            "tenant_id": tenant_id,
            "deleted": False
        })
        if not doc:
            return None

        for k, v in updates.items():
            if hasattr(doc, k) and v is not None:
                setattr(doc, k, v)
        doc.updated_at = datetime.now(timezone.utc)
        await doc.save()
        return _doc_to_dict(doc)

    async def delete(self, product_id: str, tenant_id: str) -> bool:
        if not ObjectId.is_valid(product_id):
            return False
        doc = await CatalogoProducto.find_one({
            "_id": ObjectId(product_id),
            "tenant_id": tenant_id,
            "deleted": False
        })
        if not doc:
            return False
        
        doc.deleted = True
        doc.updated_at = datetime.now(timezone.utc)
        await doc.save()
        return True


class MongoCatalogoAuthRepository(ICatalogoAuthRepository):
    async def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip()
        user = await User.find_one({
            "$or": [
                {"email": re.compile(f"^{re.escape(clean_email)}$", re.IGNORECASE)},
                {"username": re.compile(f"^{re.escape(clean_email)}$", re.IGNORECASE)}
            ],
            "deleted": False
        })
        return _doc_to_dict(user) if user else None

    async def create_tenant(self, name: str, slug: str) -> Dict[str, Any]:
        tenant = Tenant(
            name=name.strip(),
            slug=slug.strip().lower(),
            plan=PlanType.FREE,
            rubro=RubroEmpresa.RETAIL,
            modulos_activos=["CATALOGO"],
            created_at=datetime.now(timezone.utc)
        )
        await tenant.insert()
        return _doc_to_dict(tenant)

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user = User(
            username=user_data["username"],
            email=user_data.get("email"),
            hashed_password=user_data["hashed_password"],
            full_name=user_data.get("full_name"),
            role=user_data.get("role", UserRole.ADMIN_MATRIZ),
            tenant_id=user_data.get("tenant_id"),
            created_at=datetime.now(timezone.utc)
        )
        await user.insert()
        return _doc_to_dict(user)
