from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status

from app.domain.models.recordatorio import (
    EstadoRecordatorio,
    PrioridadRecordatorio,
)
from app.domain.repositories.recordatorio_repository import RecordatorioRepository
from app.domain.schemas.recordatorio import (
    CategoriaRecordatorioCreate,
    CategoriaRecordatorioResponse,
    RecordatorioCreate,
    RecordatorioEstadoUpdate,
    RecordatorioKPIsResponse,
    RecordatorioResponse,
    RecordatorioUpdate,
)

DEFAULT_CATEGORIAS = ["Caja", "Inventario", "Sistemas", "Ventas", "Mantenimiento"]


class RecordatorioService:
    """
    Servicio de Dominio / Aplicación para la gestión de Recordatorios e Incidencias.
    Implementa la lógica de negocio pura desacoplada del motor de base de datos.
    """

    def __init__(self, repository: RecordatorioRepository):
        self.repository = repository

    def _to_response(self, doc: Any) -> RecordatorioResponse:
        return RecordatorioResponse(
            id=str(getattr(doc, "id", "")),
            tenant_id=getattr(doc, "tenant_id", ""),
            sucursal_id=getattr(doc, "sucursal_id", None),
            sucursal_nombre=getattr(doc, "sucursal_nombre", None),
            titulo=getattr(doc, "titulo", ""),
            categoria=getattr(doc, "categoria", ""),
            descripcion=getattr(doc, "descripcion", None),
            prioridad=getattr(doc, "prioridad", PrioridadRecordatorio.MEDIA),
            estado=getattr(doc, "estado", EstadoRecordatorio.PENDIENTE),
            adjuntos=getattr(doc, "adjuntos", []) or [],
            creado_por_id=getattr(doc, "creado_por_id", ""),
            creado_por_nombre=getattr(doc, "creado_por_nombre", ""),
            creado_por_rol=getattr(doc, "creado_por_rol", None),
            asignado_a_id=getattr(doc, "asignado_a_id", None),
            asignado_a_nombre=getattr(doc, "asignado_a_nombre", None),
            fecha_limite=getattr(doc, "fecha_limite", None),
            resuelto_en=getattr(doc, "resuelto_en", None),
            resuelto_por_id=getattr(doc, "resuelto_por_id", None),
            resuelto_por_nombre=getattr(doc, "resuelto_por_nombre", None),
            notas_resolucion=getattr(doc, "notas_resolucion", None),
            created_at=getattr(doc, "created_at", datetime.now(UTC)),
            updated_at=getattr(doc, "updated_at", datetime.now(UTC)),
        )

    async def list_recordatorios(
        self,
        tenant_id: str,
        sucursal_id: str | None = None,
        categoria: str | None = None,
        prioridad: str | None = None,
        estado: str | None = None,
        search: str | None = None,
        limit: int = 100,
        skip: int = 0,
    ) -> list[RecordatorioResponse]:
        docs = await self.repository.list_by_filters(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            categoria=categoria,
            prioridad=prioridad,
            estado=estado,
            search=search,
            limit=limit,
            skip=skip,
        )
        return [self._to_response(doc) for doc in docs]

    async def get_kpis(
        self,
        tenant_id: str,
        sucursal_id: str | None = None,
    ) -> RecordatorioKPIsResponse:
        kpis = await self.repository.count_kpis(
            tenant_id=tenant_id, sucursal_id=sucursal_id
        )
        return RecordatorioKPIsResponse(
            total=kpis.get("total", 0),
            pendientes=kpis.get("pendientes", 0),
            en_seguimiento=kpis.get("en_seguimiento", 0),
            resueltos=kpis.get("resueltos", 0),
        )

    async def get_recordatorio_by_id(
        self,
        recordatorio_id: str,
        tenant_id: str,
    ) -> RecordatorioResponse:
        doc = await self.repository.get_by_id(recordatorio_id, tenant_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El recordatorio solicitado no existe o fue desactivado.",
            )
        return self._to_response(doc)

    async def crear_recordatorio(
        self,
        data: RecordatorioCreate,
        tenant_id: str,
        usuario_id: str,
        usuario_nombre: str,
        usuario_rol: str | None = None,
    ) -> RecordatorioResponse:
        creado = await self.repository.create(
            tenant_id=tenant_id,
            data=data,
            usuario_id=usuario_id,
            usuario_nombre=usuario_nombre,
            usuario_rol=usuario_rol,
        )
        return self._to_response(creado)

    async def actualizar_recordatorio(
        self,
        recordatorio_id: str,
        data: RecordatorioUpdate,
        tenant_id: str,
    ) -> RecordatorioResponse:
        doc = await self.repository.get_by_id(recordatorio_id, tenant_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recordatorio no encontrado.",
            )

        if data.titulo is not None:
            doc.titulo = data.titulo.strip()
        if data.categoria is not None:
            doc.categoria = data.categoria.strip()
        if data.descripcion is not None:
            doc.descripcion = data.descripcion.strip()
        if data.prioridad is not None:
            doc.prioridad = data.prioridad
        if data.sucursal_id is not None:
            doc.sucursal_id = data.sucursal_id
        if data.sucursal_nombre is not None:
            doc.sucursal_nombre = data.sucursal_nombre
        if data.asignado_a_id is not None:
            doc.asignado_a_id = data.asignado_a_id
        if data.asignado_a_nombre is not None:
            doc.asignado_a_nombre = data.asignado_a_nombre
        if data.fecha_limite is not None:
            doc.fecha_limite = data.fecha_limite
        if data.adjuntos is not None:
            doc.adjuntos = data.adjuntos
        if data.notas_resolucion is not None:
            doc.notas_resolucion = data.notas_resolucion

        doc.updated_at = datetime.now(UTC)
        guardado = await self.repository.update(doc)
        return self._to_response(guardado)

    async def cambiar_estado(
        self,
        recordatorio_id: str,
        data: RecordatorioEstadoUpdate,
        tenant_id: str,
        usuario_id: str,
        usuario_nombre: str,
    ) -> RecordatorioResponse:
        doc = await self.repository.get_by_id(recordatorio_id, tenant_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recordatorio no encontrado.",
            )

        ahora = datetime.now(UTC)
        doc.estado = data.estado
        doc.updated_at = ahora

        if data.notas_resolucion:
            doc.notas_resolucion = data.notas_resolucion

        if data.estado == EstadoRecordatorio.RESUELTO:
            doc.resuelto_en = ahora
            doc.resuelto_por_id = usuario_id
            doc.resuelto_por_nombre = usuario_nombre
        else:
            doc.resuelto_en = None
            doc.resuelto_por_id = None
            doc.resuelto_por_nombre = None

        guardado = await self.repository.update(doc)
        return self._to_response(guardado)

    async def eliminar_recordatorio(
        self,
        recordatorio_id: str,
        tenant_id: str,
    ) -> bool:
        ok = await self.repository.soft_delete(recordatorio_id, tenant_id)
        if not ok:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recordatorio no encontrado para eliminar.",
            )
        return True

    async def listar_categorias(self, tenant_id: str) -> list[str]:
        custom_docs = await self.repository.list_categorias(tenant_id)
        custom_nombres = [getattr(c, "nombre", str(c)) for c in custom_docs]

        combinadas = list(DEFAULT_CATEGORIAS)
        for c in custom_nombres:
            if not any(c.lower() == item.lower() for item in combinadas):
                combinadas.append(c)
        return combinadas

    async def crear_categoria(
        self,
        tenant_id: str,
        data: CategoriaRecordatorioCreate,
        usuario_nombre: str,
    ) -> CategoriaRecordatorioResponse:
        nombre_limpio = data.nombre.strip()
        existente = await self.repository.get_categoria_by_nombre(
            tenant_id, nombre_limpio
        )
        if existente or any(
            nombre_limpio.lower() == d.lower() for d in DEFAULT_CATEGORIAS
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría '{nombre_limpio}' ya existe en el sistema.",
            )

        guardada = await self.repository.create_categoria(
            tenant_id=tenant_id,
            nombre=nombre_limpio,
            color=data.color,
            usuario_nombre=usuario_nombre,
        )
        return CategoriaRecordatorioResponse(
            id=str(getattr(guardada, "id", "")),
            nombre=getattr(guardada, "nombre", nombre_limpio),
            color=getattr(guardada, "color", None),
            creado_por_nombre=getattr(guardada, "creado_por_nombre", usuario_nombre),
            created_at=getattr(guardada, "created_at", datetime.now(UTC)),
        )
