from typing import List, Optional
import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr, field_validator
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import get_current_active_user, get_password_hash, require_roles
from datetime import datetime

router = APIRouter()

class SaasStaffCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(
        ...,
        min_length=8,
        description="Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    full_name: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[@$!%*?&#]", v):
            raise ValueError("Password must contain at least one special character (@$!%*?&#)")
        return v

class SaasStaffResponse(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True

def format_saas_staff(user: User) -> dict:
    return {
        "_id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": True,
        "created_at": user.created_at
    }

@router.get("/", response_model=List[SaasStaffResponse])
async def list_saas_staff(
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN]))
):
    """
    List all SUPERADMIN_STAFF users. Only the primary SUPERADMIN can access this.
    """
    staff = await User.find(User.role == UserRole.SUPERADMIN_STAFF).to_list()
    return [format_saas_staff(u) for u in staff]

@router.post("/", response_model=SaasStaffResponse, status_code=status.HTTP_201_CREATED)
async def create_saas_staff(
    staff_in: SaasStaffCreate,
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN]))
):
    """
    Create a new SUPERADMIN_STAFF user.
    """
    # Check if username or email already exists
    existing_user = await User.find_one({"$or": [{"username": staff_in.username}, {"email": staff_in.email}]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username or email already exists."
        )

    new_staff = User(
        username=staff_in.username,
        email=staff_in.email,
        full_name=staff_in.full_name,
        hashed_password=get_password_hash(staff_in.password),
        role=UserRole.SUPERADMIN_STAFF,
        tenant_id=None,
        sucursal_id=None
    )
    await new_staff.insert()
    return format_saas_staff(new_staff)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saas_staff(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN]))
):
    """
    Delete a SUPERADMIN_STAFF user.
    """
    from bson import ObjectId
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    staff = await User.get(ObjectId(user_id))
    if not staff or staff.role != UserRole.SUPERADMIN_STAFF:
        raise HTTPException(status_code=404, detail="SaaS Staff user not found")

    await staff.delete()
