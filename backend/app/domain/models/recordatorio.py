from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document
from pydantic import BaseModel, Field


class PrioridadRecordatorio(StrEnum):
    BAJA = "BAJA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"


class EstadoRecordatorio(StrEnum):
    PENDIENTE = "PENDIENTE"
    EN_SEGUIMIENTO = "EN_SEGUIMIENTO"
    RESUELTO = "RESUELTO"
    CANCELADO = "CANCELADO"


class AdjuntoRecordatorio(BaseModel):
    url: str
    nombre_archivo: str | None = "archivo"
    tipo: str | None = "image/jpeg"


class Recordatorio(Document):
    tenant_id: str
    sucursal_id: str | None = None
    sucursal_nombre: str | None = None

    titulo: str
    categoria: str = "General"
    descripcion: str | None = None
    prioridad: PrioridadRecordatorio = PrioridadRecordatorio.MEDIA
    estado: EstadoRecordatorio = EstadoRecordatorio.PENDIENTE

    adjuntos: list[AdjuntoRecordatorio] = Field(default_factory=list)

    # Auditoría y Trazabilidad
    creado_por_id: str
    creado_por_nombre: str
    creado_por_rol: str | None = None

    asignado_a_id: str | None = None
    asignado_a_nombre: str | None = None

    # Ciclo de Vida y Resolución
    fecha_limite: datetime | None = None
    resuelto_en: datetime | None = None
    resuelto_por_id: str | None = None
    resuelto_por_nombre: str | None = None
    notas_resolucion: str | None = None

    # Soft Delete
    activo: bool = True

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "recordatorios"


class CategoriaRecordatorio(Document):
    tenant_id: str
    nombre: str
    color: str | None = None
    creado_por_nombre: str | None = None
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "categorias_recordatorios"
