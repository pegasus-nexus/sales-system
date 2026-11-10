from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.models.recordatorio import (
    AdjuntoRecordatorio,
    EstadoRecordatorio,
    PrioridadRecordatorio,
)


class RecordatorioCreate(BaseModel):
    titulo: str = Field(..., min_length=2, max_length=150)
    categoria: str = Field(..., min_length=2, max_length=50)
    descripcion: str | None = None
    prioridad: PrioridadRecordatorio = PrioridadRecordatorio.MEDIA
    estado: EstadoRecordatorio = EstadoRecordatorio.PENDIENTE
    sucursal_id: str | None = None
    sucursal_nombre: str | None = None
    asignado_a_id: str | None = None
    asignado_a_nombre: str | None = None
    fecha_limite: datetime | None = None
    adjuntos: list[AdjuntoRecordatorio] = Field(default_factory=list)


class RecordatorioUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=2, max_length=150)
    categoria: str | None = Field(None, min_length=2, max_length=50)
    descripcion: str | None = None
    prioridad: PrioridadRecordatorio | None = None
    estado: EstadoRecordatorio | None = None
    sucursal_id: str | None = None
    sucursal_nombre: str | None = None
    asignado_a_id: str | None = None
    asignado_a_nombre: str | None = None
    fecha_limite: datetime | None = None
    adjuntos: list[AdjuntoRecordatorio] | None = None
    notas_resolucion: str | None = None


class RecordatorioEstadoUpdate(BaseModel):
    estado: EstadoRecordatorio
    notas_resolucion: str | None = None


class RecordatorioResponse(BaseModel):
    id: str
    tenant_id: str
    sucursal_id: str | None = None
    sucursal_nombre: str | None = None
    titulo: str
    categoria: str
    descripcion: str | None = None
    prioridad: PrioridadRecordatorio
    estado: EstadoRecordatorio
    adjuntos: list[AdjuntoRecordatorio] = Field(default_factory=list)
    creado_por_id: str
    creado_por_nombre: str
    creado_por_rol: str | None = None
    asignado_a_id: str | None = None
    asignado_a_nombre: str | None = None
    fecha_limite: datetime | None = None
    resuelto_en: datetime | None = None
    resuelto_por_id: str | None = None
    resuelto_por_nombre: str | None = None
    notas_resolucion: str | None = None
    created_at: datetime
    updated_at: datetime


class RecordatorioKPIsResponse(BaseModel):
    total: int = 0
    pendientes: int = 0
    en_seguimiento: int = 0
    resueltos: int = 0


class CategoriaRecordatorioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)
    color: str | None = None


class CategoriaRecordatorioResponse(BaseModel):
    id: str
    nombre: str
    color: str | None = None
    creado_por_nombre: str | None = None
    created_at: datetime
