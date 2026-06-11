from .base import DecimalMoney
from typing import Optional, List, Dict, Any
from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum

class TipoCliente(str, Enum):
    LEAD = "LEAD"
    PROSPECTO = "PROSPECTO"
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"

class Cliente(Document):
    tenant_id: str
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    lista_precio_id: Optional[str] = None
    
    # CRM & Dark Kitchen Fields
    tipo_cliente: TipoCliente = TipoCliente.ACTIVO
    preferencias_alimenticias: List[str] = Field(default_factory=list)
    datos_crm: Dict[str, Any] = Field(default_factory=dict)
    
    total_compras: DecimalMoney = DecimalMoney("0.0")
    cantidad_compras: int = 0
    ultima_compra_at: Optional[datetime] = None
    is_active: bool = True
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "clientes"
        indexes = [
            [("tenant_id", 1), ("telefono", 1)],
            [("tenant_id", 1), ("nit_ci", 1)],
            [("tenant_id", 1), ("is_active", 1)],
            [("tenant_id", 1), ("tipo_cliente", 1)],
        ]
