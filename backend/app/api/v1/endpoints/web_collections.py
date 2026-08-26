from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.domain.models.web_collection import WebCollection
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import get_current_active_user

router = APIRouter()

class WebCollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    categories_ids: List[str] = []

class WebCollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    categories_ids: Optional[List[str]] = None
    is_active: Optional[bool] = None

@router.get("/web-collections", response_model=List[WebCollection])
async def get_web_collections(current_user: User = Depends(get_current_active_user)):
    return await WebCollection.find(
        WebCollection.tenant_id == current_user.tenant_id,
        WebCollection.is_active == True
    ).to_list()

@router.post("/web-collections", response_model=WebCollection)
async def create_web_collection(collection_in: WebCollectionCreate, current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    collection = WebCollection(
        **collection_in.dict(),
        tenant_id=current_user.tenant_id
    )
    await collection.create()
    return collection

@router.patch("/web-collections/{collection_id}", response_model=WebCollection)
async def update_web_collection(collection_id: str, collection_in: WebCollectionUpdate, current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    collection = await WebCollection.get(collection_id)
    if not collection or collection.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    update_data = collection_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(collection, key, value)
        
    await collection.save()
    return collection

@router.delete("/web-collections/{collection_id}")
async def delete_web_collection(collection_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    collection = await WebCollection.get(collection_id)
    if not collection or collection.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    collection.is_active = False
    await collection.save()
    return {"message": "Collection soft-deleted"}
