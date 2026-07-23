from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.domain.models.cliente import Cliente, TipoCliente
from datetime import datetime

router = APIRouter()

class PublicClientRegister(BaseModel):
    nombre: str = Field(..., description="Nombre del usuario")
    apellido: str = Field(..., description="Apellido del usuario")
    telefono: str = Field(..., description="Número de teléfono celular")

@router.post("/register")
async def register_public_client(data: PublicClientRegister, tenant_id: str = "69cd7f0a8f3f6866d4cfbb62"):
    """
    Endpoint público para el registro de clientes desde la landing page.
    No requiere autenticación de empleado.
    Si el teléfono ya existe, devuelve el cliente (funciona como login passwordless).
    """
    telefono = data.telefono.strip()
    nombre_completo = f"{data.nombre.strip()} {data.apellido.strip()}".strip()
    
    if not telefono:
        raise HTTPException(status_code=400, detail="El teléfono es obligatorio")
        
    # Buscar si existe el cliente
    existing_cliente = await Cliente.find_one(
        Cliente.tenant_id == tenant_id,
        Cliente.telefono == telefono
    )
    
    if existing_cliente:
        # Ya existe, actúa como login
        return {
            "status": "success",
            "message": "Bienvenido de vuelta",
            "cliente_id": str(existing_cliente.id),
            "nombre": existing_cliente.nombre,
            "telefono": existing_cliente.telefono,
            "is_new": False
        }
        
    # Crear nuevo cliente
    nuevo_cliente = Cliente(
        tenant_id=tenant_id,
        nombre=nombre_completo,
        telefono=telefono,
        tipo_cliente=TipoCliente.ACTIVO,
        datos_crm={"origen": "landing_page_fidelizacion"}
    )
    await nuevo_cliente.create()
    
    return {
        "status": "success",
        "message": "Registro completado exitosamente",
        "cliente_id": str(nuevo_cliente.id),
        "nombre": nuevo_cliente.nombre,
        "telefono": nuevo_cliente.telefono,
        "is_new": True
    }
