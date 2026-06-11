from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.domain.models.etiqueta import Etiqueta
from app.domain.models.user import User
from app.infrastructure.auth import get_current_active_user

router = APIRouter()

class EtiquetaCreate(BaseModel):
    nombre: str
    color: str

class EtiquetaUpdate(BaseModel):
    nombre: str = None
    color: str = None
    is_active: bool = None

@router.get("/etiquetas", response_model=List[Etiqueta])
async def listar_etiquetas(current_user: User = Depends(get_current_active_user)):
    tenant_id = current_user.tenant_id or ""
    return await Etiqueta.find(Etiqueta.tenant_id == tenant_id, Etiqueta.is_active == True).to_list()

@router.post("/etiquetas", response_model=Etiqueta)
async def crear_etiqueta(data: EtiquetaCreate, current_user: User = Depends(get_current_active_user)):
    tenant_id = current_user.tenant_id or ""
    nueva = Etiqueta(tenant_id=tenant_id, nombre=data.nombre, color=data.color)
    await nueva.create()
    return nueva

@router.put("/etiquetas/{etiqueta_id}", response_model=Etiqueta)
async def actualizar_etiqueta(etiqueta_id: str, data: EtiquetaUpdate, current_user: User = Depends(get_current_active_user)):
    tenant_id = current_user.tenant_id or ""
    etiqueta = await Etiqueta.get(etiqueta_id)
    if not etiqueta or etiqueta.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Etiqueta no encontrada")
    
    if data.nombre is not None:
        etiqueta.nombre = data.nombre
    if data.color is not None:
        etiqueta.color = data.color
    if data.is_active is not None:
        etiqueta.is_active = data.is_active
        
    await etiqueta.save()
    return etiqueta
