from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class CatalogoRegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    company_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    whatsapp: Optional[str] = Field(default=None, max_length=30)
    slug: Optional[str] = Field(default=None, max_length=60)


class CatalogoGoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID Token JWT")
    company_name: Optional[str] = Field(default=None, max_length=100)
    whatsapp: Optional[str] = Field(default=None, max_length=30)


class CatalogoAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    email: str
    tenant_id: str
    slug: str
    business_name: str


class CatalogoConfigUpdate(BaseModel):
    business_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    slug: Optional[str] = Field(default=None, min_length=3, max_length=60)
    description: Optional[str] = Field(default=None, max_length=500)
    primary_color: Optional[str] = Field(default=None, max_length=30)
    secondary_color: Optional[str] = Field(default=None, max_length=30)
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp_number: Optional[str] = Field(default=None, max_length=30)
    whatsapp_message_template: Optional[str] = Field(default=None, max_length=500)
    currency_symbol: Optional[str] = Field(default=None, max_length=10)
    is_active: Optional[bool] = None


class CatalogoConfigOut(BaseModel):
    id: str
    tenant_id: str
    business_name: str
    slug: str
    description: Optional[str] = None
    primary_color: str
    secondary_color: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp_number: str
    whatsapp_message_template: Optional[str] = None
    currency_symbol: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CatalogoProductoCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=1000)
    price: float = Field(default=0.0, ge=0.0)
    currency_symbol: Optional[str] = Field(default="Bs.", max_length=10)
    images: List[str] = Field(default_factory=list)
    category: Optional[str] = Field(default="General", max_length=60)
    is_available: bool = True
    is_featured: bool = False
    order: int = 0


class CatalogoProductoUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=1000)
    price: Optional[float] = Field(default=None, ge=0.0)
    currency_symbol: Optional[str] = Field(default=None, max_length=10)
    images: Optional[List[str]] = None
    category: Optional[str] = Field(default=None, max_length=60)
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    order: Optional[int] = None


class CatalogoProductoOut(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: Optional[str] = None
    price: float
    currency_symbol: str
    images: List[str]
    category: str
    is_available: bool
    is_featured: bool
    order: int
    created_at: datetime
    updated_at: datetime


class PublicCatalogoResponse(BaseModel):
    config: CatalogoConfigOut
    products: List[CatalogoProductoOut]
    categories: List[str]
