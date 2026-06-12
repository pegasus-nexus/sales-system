from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

class Proveedor(Document):
    tenant_id: str
    nombre: str  # Nombre de la empresa o proveedor
    contacto_nombre: Optional[str] = None  # Persona de contacto
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit_ci: Optional[str] = None  # Número de identificación tributaria o CI
    direccion: Optional[str] = None
    tipo_insumos: Optional[str] = None  # Ej: "Materia Prima", "Embalajes", "Servicios"
    notas: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "proveedores"
        indexes = [
            [("tenant_id", 1), ("is_active", 1)],
            [("tenant_id", 1), ("nombre", 1)],
            [("tenant_id", 1), ("nit_ci", 1)],
        ]
