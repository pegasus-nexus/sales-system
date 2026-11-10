from datetime import UTC, datetime

import pytest
from bson import ObjectId
from pydantic import BaseModel

from app.application.services.recordatorio_service import (
    RecordatorioService,
)
from app.domain.models.recordatorio import (
    AdjuntoRecordatorio,
    EstadoRecordatorio,
    PrioridadRecordatorio,
)
from app.domain.repositories.recordatorio_repository import RecordatorioRepository
from app.domain.schemas.recordatorio import (
    CategoriaRecordatorioCreate,
    RecordatorioCreate,
    RecordatorioEstadoUpdate,
)


class MockRecordatorioEntity(BaseModel):
    id: str
    tenant_id: str
    sucursal_id: str | None = None
    sucursal_nombre: str | None = None
    titulo: str
    categoria: str
    descripcion: str | None = None
    prioridad: PrioridadRecordatorio = PrioridadRecordatorio.MEDIA
    estado: EstadoRecordatorio = EstadoRecordatorio.PENDIENTE
    adjuntos: list[AdjuntoRecordatorio] = []
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
    activo: bool = True
    created_at: datetime
    updated_at: datetime


class MockCategoriaEntity(BaseModel):
    id: str
    tenant_id: str
    nombre: str
    color: str | None = None
    creado_por_nombre: str | None = None
    activo: bool = True
    created_at: datetime


class MockRecordatorioRepository(RecordatorioRepository):
    """Repositorio desacoplado en memoria para tests unitarios del servicio."""

    def __init__(self):
        self.recordatorios = []
        self.categorias = []

    async def get_by_id(self, recordatorio_id: str, tenant_id: str):
        for r in self.recordatorios:
            if str(r.id) == recordatorio_id and r.tenant_id == tenant_id and r.activo:
                return r
        return None

    async def list_by_filters(
        self,
        tenant_id: str,
        sucursal_id=None,
        categoria=None,
        prioridad=None,
        estado=None,
        search=None,
        limit=100,
        skip=0,
    ):
        results = [
            r for r in self.recordatorios if r.tenant_id == tenant_id and r.activo
        ]
        if sucursal_id:
            results = [r for r in results if r.sucursal_id == sucursal_id]
        if categoria and categoria.lower() not in ["todas", "all", ""]:
            results = [r for r in results if r.categoria.lower() == categoria.lower()]
        if prioridad:
            results = [r for r in results if r.prioridad == prioridad]
        if estado:
            results = [r for r in results if r.estado == estado]
        if search:
            q = search.lower()
            results = [
                r
                for r in results
                if q in r.titulo.lower()
                or (r.descripcion and q in r.descripcion.lower())
            ]
        return results[skip : skip + limit]

    async def count_kpis(self, tenant_id: str, sucursal_id=None):
        results = [
            r for r in self.recordatorios if r.tenant_id == tenant_id and r.activo
        ]
        if sucursal_id:
            results = [r for r in results if r.sucursal_id == sucursal_id]

        return {
            "total": len(results),
            "pendientes": sum(
                1 for r in results if r.estado == EstadoRecordatorio.PENDIENTE
            ),
            "en_seguimiento": sum(
                1 for r in results if r.estado == EstadoRecordatorio.EN_SEGUIMIENTO
            ),
            "resueltos": sum(
                1 for r in results if r.estado == EstadoRecordatorio.RESUELTO
            ),
        }

    async def create(
        self,
        tenant_id: str,
        data: RecordatorioCreate,
        usuario_id: str,
        usuario_nombre: str,
        usuario_rol: str | None = None,
    ):
        now = datetime.now(UTC)
        rec = MockRecordatorioEntity(
            id=str(ObjectId()),
            tenant_id=tenant_id,
            sucursal_id=data.sucursal_id,
            sucursal_nombre=data.sucursal_nombre,
            titulo=data.titulo,
            categoria=data.categoria,
            descripcion=data.descripcion,
            prioridad=data.prioridad,
            estado=data.estado,
            adjuntos=data.adjuntos,
            creado_por_id=usuario_id,
            creado_por_nombre=usuario_nombre,
            creado_por_rol=usuario_rol,
            asignado_a_id=data.asignado_a_id,
            asignado_a_nombre=data.asignado_a_nombre,
            fecha_limite=data.fecha_limite,
            resuelto_en=now if data.estado == EstadoRecordatorio.RESUELTO else None,
            resuelto_por_id=usuario_id
            if data.estado == EstadoRecordatorio.RESUELTO
            else None,
            resuelto_por_nombre=usuario_nombre
            if data.estado == EstadoRecordatorio.RESUELTO
            else None,
            activo=True,
            created_at=now,
            updated_at=now,
        )
        self.recordatorios.append(rec)
        return rec

    async def update(self, recordatorio):
        for idx, r in enumerate(self.recordatorios):
            if str(r.id) == str(recordatorio.id):
                self.recordatorios[idx] = recordatorio
                return recordatorio
        return recordatorio

    async def soft_delete(self, recordatorio_id: str, tenant_id: str):
        r = await self.get_by_id(recordatorio_id, tenant_id)
        if r:
            r.activo = False
            r.estado = EstadoRecordatorio.CANCELADO
            return True
        return False

    async def list_categorias(self, tenant_id: str):
        return [c for c in self.categorias if c.tenant_id == tenant_id and c.activo]

    async def get_categoria_by_nombre(self, tenant_id: str, nombre: str):
        for c in self.categorias:
            if (
                c.tenant_id == tenant_id
                and c.activo
                and c.nombre.lower() == nombre.lower()
            ):
                return c
        return None

    async def create_categoria(
        self,
        tenant_id: str,
        nombre: str,
        color: str | None = None,
        usuario_nombre: str | None = None,
    ):
        cat = MockCategoriaEntity(
            id=str(ObjectId()),
            tenant_id=tenant_id,
            nombre=nombre,
            color=color,
            creado_por_nombre=usuario_nombre,
            activo=True,
            created_at=datetime.now(UTC),
        )
        self.categorias.append(cat)
        return cat


@pytest.fixture
def service():
    repo = MockRecordatorioRepository()
    return RecordatorioService(repository=repo)


@pytest.mark.asyncio
async def test_crear_recordatorio_y_kpis(service):
    # Crear 1er recordatorio (Caja - Pendiente)
    r1 = await service.crear_recordatorio(
        data=RecordatorioCreate(
            titulo="Revisar cierre de caja",
            categoria="Caja",
            descripcion="Diferencia de 10 Bs en turno tarde",
            prioridad=PrioridadRecordatorio.ALTA,
            estado=EstadoRecordatorio.PENDIENTE,
        ),
        tenant_id="tenant_alpha",
        usuario_id="user_1",
        usuario_nombre="Carlos Cajero",
    )
    assert r1.id is not None
    assert r1.titulo == "Revisar cierre de caja"
    assert r1.prioridad == PrioridadRecordatorio.ALTA

    # Crear 2do recordatorio (Inventario - En seguimiento)
    await service.crear_recordatorio(
        data=RecordatorioCreate(
            titulo="Verificar stock de cocoa",
            categoria="Inventario",
            prioridad=PrioridadRecordatorio.MEDIA,
            estado=EstadoRecordatorio.EN_SEGUIMIENTO,
        ),
        tenant_id="tenant_alpha",
        usuario_id="user_2",
        usuario_nombre="Ana Almacen",
    )

    # Verificar KPIs
    kpis = await service.get_kpis(tenant_id="tenant_alpha")
    assert kpis.total == 2
    assert kpis.pendientes == 1
    assert kpis.en_seguimiento == 1
    assert kpis.resueltos == 0


@pytest.mark.asyncio
async def test_transicion_estado_resuelto_auditoria(service):
    rec = await service.crear_recordatorio(
        data=RecordatorioCreate(
            titulo="Validar impresora POS",
            categoria="Sistemas",
            prioridad=PrioridadRecordatorio.BAJA,
            estado=EstadoRecordatorio.PENDIENTE,
        ),
        tenant_id="tenant_alpha",
        usuario_id="user_1",
        usuario_nombre="Carlos Cajero",
    )

    # Transicionar a RESUELTO
    actualizado = await service.cambiar_estado(
        recordatorio_id=rec.id,
        data=RecordatorioEstadoUpdate(
            estado=EstadoRecordatorio.RESUELTO,
            notas_resolucion="Se cambió el rollo térmico y se limpió el cabezal.",
        ),
        tenant_id="tenant_alpha",
        usuario_id="admin_99",
        usuario_nombre="Supervisor Matriz",
    )

    assert actualizado.estado == EstadoRecordatorio.RESUELTO
    assert actualizado.resuelto_en is not None
    assert actualizado.resuelto_por_nombre == "Supervisor Matriz"
    assert (
        actualizado.notas_resolucion
        == "Se cambió el rollo térmico y se limpió el cabezal."
    )

    # KPIs reflejan 1 resuelto
    kpis = await service.get_kpis(tenant_id="tenant_alpha")
    assert kpis.resueltos == 1
    assert kpis.pendientes == 0


@pytest.mark.asyncio
async def test_reabrir_recordatorio(service):
    rec = await service.crear_recordatorio(
        data=RecordatorioCreate(
            titulo="Calibrar balanza",
            categoria="Sistemas",
            prioridad=PrioridadRecordatorio.MEDIA,
            estado=EstadoRecordatorio.RESUELTO,
        ),
        tenant_id="tenant_alpha",
        usuario_id="user_1",
        usuario_nombre="Carlos Cajero",
    )
    assert rec.estado == EstadoRecordatorio.RESUELTO

    # Reabrir a EN_SEGUIMIENTO
    reabierto = await service.cambiar_estado(
        recordatorio_id=rec.id,
        data=RecordatorioEstadoUpdate(estado=EstadoRecordatorio.EN_SEGUIMIENTO),
        tenant_id="tenant_alpha",
        usuario_id="admin_1",
        usuario_nombre="Admin",
    )
    assert reabierto.estado == EstadoRecordatorio.EN_SEGUIMIENTO
    assert reabierto.resuelto_en is None
    assert reabierto.resuelto_por_nombre is None


@pytest.mark.asyncio
async def test_soft_delete(service):
    rec = await service.crear_recordatorio(
        data=RecordatorioCreate(
            titulo="Recordatorio de prueba a borrar",
            categoria="General",
        ),
        tenant_id="tenant_alpha",
        usuario_id="user_1",
        usuario_nombre="User Test",
    )

    ok = await service.eliminar_recordatorio(rec.id, tenant_id="tenant_alpha")
    assert ok is True

    # Comprobar que ya no aparece en el listado activo
    lista = await service.list_recordatorios(tenant_id="tenant_alpha")
    assert len(lista) == 0


@pytest.mark.asyncio
async def test_aislamiento_multitenancy(service):
    # Crear recordatorio en Tenant A
    await service.crear_recordatorio(
        data=RecordatorioCreate(
            titulo="Incidencia Confidencial Empresa A",
            categoria="Caja",
        ),
        tenant_id="tenant_a",
        usuario_id="user_a",
        usuario_nombre="Alice",
    )

    # Consultar desde Tenant B -> No debe ver nada
    lista_b = await service.list_recordatorios(tenant_id="tenant_b")
    assert len(lista_b) == 0

    kpis_b = await service.get_kpis(tenant_id="tenant_b")
    assert kpis_b.total == 0


@pytest.mark.asyncio
async def test_categorias_default_y_personalizadas(service):
    cats = await service.listar_categorias(tenant_id="tenant_alpha")
    assert "Caja" in cats
    assert "Inventario" in cats
    assert "Sistemas" in cats

    # Crear categoría personalizada
    nueva = await service.crear_categoria(
        tenant_id="tenant_alpha",
        data=CategoriaRecordatorioCreate(nombre="Mantenimiento de Maquinaria"),
        usuario_nombre="Admin Matriz",
    )
    assert nueva.nombre == "Mantenimiento de Maquinaria"

    # Ahora debe figurar en la lista
    cats_actualizadas = await service.listar_categorias(tenant_id="tenant_alpha")
    assert "Mantenimiento de Maquinaria" in cats_actualizadas
