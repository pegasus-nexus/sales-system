from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Annotated
from pydantic import BeforeValidator

# Helper to capture ObjectId and convert to string for the API response
PyObjectId = Annotated[str, BeforeValidator(str)]

from app.domain.models.proveedor import Proveedor
from app.domain.models.user import User
from app.infrastructure.auth import get_current_active_user

router = APIRouter()

class ProveedorCreate(BaseModel):
    nombre: str = Field(..., description="Nombre comercial o razón social del proveedor")
    contacto_nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None
    direccion: Optional[str] = None
    tipo_insumos: Optional[str] = None
    notas: Optional[str] = None

class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    contacto_nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None
    direccion: Optional[str] = None
    tipo_insumos: Optional[str] = None
    notas: Optional[str] = None
    is_active: Optional[bool] = None

class ProveedorResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    tenant_id: str
    nombre: str
    contacto_nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None
    direccion: Optional[str] = None
    tipo_insumos: Optional[str] = None
    notas: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(populate_by_name=True)

@router.get("/proveedores", response_model=List[ProveedorResponse])
async def listar_proveedores(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    q: Optional[str] = Query(None, description="Buscar por nombre, NIT o teléfono"),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    filters = [Proveedor.tenant_id == tenant_id, Proveedor.is_active == True]
    
    if q and q.strip():
        import re
        from beanie.operators import Or, RegEx
        
        safe_q = re.escape(q.strip())
        
        search_filter = Or(
            RegEx(Proveedor.nombre, safe_q, options="i"),
            RegEx(Proveedor.nit_ci, safe_q, options="i"),
            RegEx(Proveedor.telefono, safe_q, options="i")
        )
        filters.append(search_filter)
        
    proveedores = await Proveedor.find(*filters).skip(skip).limit(limit).sort("-created_at").to_list()
    return proveedores

@router.post("/proveedores", response_model=ProveedorResponse)
async def crear_proveedor(
    data: ProveedorCreate,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    
    proveedor = Proveedor(
        tenant_id=tenant_id,
        nombre=data.nombre,
        contacto_nombre=data.contacto_nombre,
        telefono=data.telefono,
        email=data.email,
        nit_ci=data.nit_ci,
        direccion=data.direccion,
        tipo_insumos=data.tipo_insumos,
        notas=data.notas
    )
    await proveedor.create()
    return proveedor

@router.get("/proveedores/{proveedor_id}", response_model=ProveedorResponse)
async def obtener_proveedor(
    proveedor_id: str,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    proveedor = await Proveedor.get(proveedor_id)
    
    if not proveedor or proveedor.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    return proveedor

@router.put("/proveedores/{proveedor_id}", response_model=ProveedorResponse)
async def actualizar_proveedor(
    proveedor_id: str,
    data: ProveedorUpdate,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    proveedor = await Proveedor.get(proveedor_id)
    
    if not proveedor or proveedor.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(proveedor, field, value)
        
    await proveedor.save()
    return proveedor

@router.delete("/proveedores/{proveedor_id}")
async def eliminar_proveedor(
    proveedor_id: str,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    proveedor = await Proveedor.get(proveedor_id)
    
    if not proveedor or proveedor.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    proveedor.is_active = False
    await proveedor.save()
    return {"message": "Proveedor desactivado exitosamente"}
