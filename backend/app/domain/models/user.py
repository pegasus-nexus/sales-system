from typing import Optional, List
from enum import Enum
from beanie import Document
from pydantic import Field, EmailStr
from datetime import datetime, timezone


from .base import SoftDeleteMixin
from pymongo import IndexModel


class UserRole(str, Enum):
    SUPERADMIN = "SUPERADMIN"       # SaaS Owner
    SUPERADMIN_STAFF = "SUPERADMIN_STAFF" # SaaS Collaborator
    ADMIN_MATRIZ = "ADMIN_MATRIZ"   # Tenant Matrix Admin (owns the business)
    ADMIN_SUCURSAL = "ADMIN_SUCURSAL"  # Branch Admin
    CAJERO = "CAJERO"               # POS Cashier
    SUPERVISOR = "SUPERVISOR"       # Fuerza de ventas - Supervisor
    VENDEDOR = "VENDEDOR"           # Fuerza de ventas - Vendedor en calle
    FACTURADOR = "FACTURADOR"       # Facturador (invoice manager)
    # Legacy aliases for backward compatibility
    ADMIN = "ADMIN_MATRIZ"
    USER = "CAJERO"


class User(Document, SoftDeleteMixin):
    username: str
    email: Optional[EmailStr] = None
    hashed_password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.CAJERO
    tenant_id: Optional[str] = None    # Links to Tenant (Empresa)
    sucursal_id: Optional[str] = None  # Links to Sucursal, None = Matriz level
    last_active_at: Optional[datetime] = None
    permisos_especiales: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("tenant_id", 1), ("username", 1)], unique=True),
            IndexModel(
                [("tenant_id", 1), ("email", 1)], 
                unique=True, 
                partialFilterExpression={"email": {"$type": "string"}}
            ),
            IndexModel([("sucursal_id", 1)]),
        ]
