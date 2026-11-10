import re
from datetime import UTC, datetime

from bson import ObjectId

from app.domain.models.recordatorio import (
    CategoriaRecordatorio,
    EstadoRecordatorio,
    Recordatorio,
)
from app.domain.repositories.recordatorio_repository import RecordatorioRepository
from app.domain.schemas.recordatorio import RecordatorioCreate


class MongoRecordatorioRepository(RecordatorioRepository):
    """
    Implementación en MongoDB con Beanie del Repositorio de Recordatorios.
    Garantiza aislamiento estricto por tenant_id en todas las consultas y mutaciones.
    """

    async def get_by_id(
        self, recordatorio_id: str, tenant_id: str
    ) -> Recordatorio | None:
        try:
            oid = ObjectId(recordatorio_id)
        except Exception:
            return None

        return await Recordatorio.find_one(
            Recordatorio.id == oid,
            Recordatorio.tenant_id == tenant_id,
            Recordatorio.activo,
        )

    async def list_by_filters(
        self,
        tenant_id: str,
        sucursal_id: str | None = None,
        categoria: str | None = None,
        prioridad: str | None = None,
        estado: str | None = None,
        search: str | None = None,
        limit: int = 100,
        skip: int = 0,
    ) -> list[Recordatorio]:
        filters: dict = {"tenant_id": tenant_id, "activo": True}

        if sucursal_id:
            filters["sucursal_id"] = sucursal_id

        if categoria and categoria.strip().lower() not in ["todas", "all", ""]:
            filters["categoria"] = categoria.strip()

        if prioridad:
            filters["prioridad"] = prioridad

        if estado:
            filters["estado"] = estado

        if search and search.strip():
            safe_search = re.escape(search.strip())
            filters["$or"] = [
                {"titulo": {"$regex": safe_search, "$options": "i"}},
                {"descripcion": {"$regex": safe_search, "$options": "i"}},
                {"categoria": {"$regex": safe_search, "$options": "i"}},
                {"creado_por_nombre": {"$regex": safe_search, "$options": "i"}},
            ]

        cursor = (
            Recordatorio.find(filters)
            .sort([("created_at", -1)])
            .skip(skip)
            .limit(limit)
        )
        return await cursor.to_list()

    async def count_kpis(
        self, tenant_id: str, sucursal_id: str | None = None
    ) -> dict[str, int]:
        base_filter: dict = {"tenant_id": tenant_id, "activo": True}
        if sucursal_id:
            base_filter["sucursal_id"] = sucursal_id

        total = await Recordatorio.find(base_filter).count()

        pendientes_filter = {
            **base_filter,
            "estado": EstadoRecordatorio.PENDIENTE.value,
        }
        pendientes = await Recordatorio.find(pendientes_filter).count()

        en_seguimiento_filter = {
            **base_filter,
            "estado": EstadoRecordatorio.EN_SEGUIMIENTO.value,
        }
        en_seguimiento = await Recordatorio.find(en_seguimiento_filter).count()

        resueltos_filter = {**base_filter, "estado": EstadoRecordatorio.RESUELTO.value}
        resueltos = await Recordatorio.find(resueltos_filter).count()

        return {
            "total": total,
            "pendientes": pendientes,
            "en_seguimiento": en_seguimiento,
            "resueltos": resueltos,
        }

    async def create(
        self,
        tenant_id: str,
        data: RecordatorioCreate,
        usuario_id: str,
        usuario_nombre: str,
        usuario_rol: str | None = None,
    ) -> Recordatorio:
        now = datetime.now(UTC)
        recordatorio = Recordatorio(
            tenant_id=tenant_id,
            sucursal_id=data.sucursal_id,
            sucursal_nombre=data.sucursal_nombre,
            titulo=data.titulo.strip(),
            categoria=data.categoria.strip(),
            descripcion=data.descripcion.strip() if data.descripcion else None,
            prioridad=data.prioridad,
            estado=data.estado,
            adjuntos=data.adjuntos,
            creado_por_id=usuario_id,
            creado_por_nombre=usuario_nombre,
            creado_por_rol=usuario_rol,
            asignado_a_id=data.asignado_a_id,
            asignado_a_nombre=data.asignado_a_nombre,
            fecha_limite=data.fecha_limite,
            activo=True,
            created_at=now,
            updated_at=now,
        )

        if data.estado == EstadoRecordatorio.RESUELTO:
            recordatorio.resuelto_en = now
            recordatorio.resuelto_por_id = usuario_id
            recordatorio.resuelto_por_nombre = usuario_nombre

        await recordatorio.insert()
        return recordatorio

    async def update(self, recordatorio: Recordatorio) -> Recordatorio:
        await recordatorio.save()
        return recordatorio

    async def soft_delete(self, recordatorio_id: str, tenant_id: str) -> bool:
        recordatorio = await self.get_by_id(recordatorio_id, tenant_id)
        if not recordatorio:
            return False

        recordatorio.activo = False
        recordatorio.estado = EstadoRecordatorio.CANCELADO
        await recordatorio.save()
        return True

    async def list_categorias(self, tenant_id: str) -> list[CategoriaRecordatorio]:
        return (
            await CategoriaRecordatorio.find(
                CategoriaRecordatorio.tenant_id == tenant_id,
                CategoriaRecordatorio.activo,
            )
            .sort([("nombre", 1)])
            .to_list()
        )

    async def get_categoria_by_nombre(
        self, tenant_id: str, nombre: str
    ) -> CategoriaRecordatorio | None:
        safe_regex = f"^{re.escape(nombre.strip())}$"
        return await CategoriaRecordatorio.find_one(
            CategoriaRecordatorio.tenant_id == tenant_id,
            {"nombre": {"$regex": safe_regex, "$options": "i"}},
            CategoriaRecordatorio.activo,
        )

    async def create_categoria(
        self,
        tenant_id: str,
        nombre: str,
        color: str | None = None,
        usuario_nombre: str | None = None,
    ) -> CategoriaRecordatorio:
        cat = CategoriaRecordatorio(
            tenant_id=tenant_id,
            nombre=nombre.strip(),
            color=color,
            creado_por_nombre=usuario_nombre,
            activo=True,
            created_at=datetime.now(UTC),
        )
        await cat.insert()
        return cat
