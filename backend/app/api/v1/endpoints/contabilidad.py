from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User, UserRole
from app.application.services.contabilidad_service import ContabilidadService
from app.application.services.contabilidad_reportes_service import ContabilidadReportesService

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="No permissions for accounting module")
    return current_user

class CuentaCreate(BaseModel):
    codigo: str
    nombre: str
    tipo: str
    naturaleza: str
    padre_id: Optional[str] = None
    nivel: int = 1
    es_cuenta_de_detalle: bool = True
    descripcion: Optional[str] = None

class CuentaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    es_cuenta_de_detalle: Optional[bool] = None

@router.get("/plan-cuentas")
async def get_plan_cuentas(current_user: User = Depends(require_admin)):
    cuentas = await ContabilidadService.get_plan_cuentas(current_user.tenant_id)
    return cuentas

@router.post("/plan-cuentas/seed")
async def seed_plan_cuentas(current_user: User = Depends(require_admin)):
    cuentas = await ContabilidadService.seed_plan_cuentas(current_user.tenant_id, str(current_user.id))
    return cuentas

@router.post("/cuentas")
async def create_cuenta(data: CuentaCreate, current_user: User = Depends(require_admin)):
    cuenta = await ContabilidadService.create_cuenta(current_user.tenant_id, data.model_dump(), str(current_user.id))
    return cuenta

@router.put("/cuentas/{cuenta_id}")
async def update_cuenta(cuenta_id: str, data: CuentaUpdate, current_user: User = Depends(require_admin)):
    cuenta = await ContabilidadService.update_cuenta(current_user.tenant_id, cuenta_id, data.model_dump(exclude_unset=True), str(current_user.id))
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta not found")
    return cuenta

@router.get("/estado-resultados")
async def get_estado_resultados(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    resultado = await ContabilidadReportesService.get_estado_resultados(
        current_user.tenant_id, fecha_inicio, fecha_fin, sucursal_id
    )
    return resultado

@router.get("/balance-general")
async def get_balance_general(
    fecha_corte: datetime,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    resultado = await ContabilidadReportesService.get_balance_general(
        current_user.tenant_id, fecha_corte, sucursal_id
    )
    return resultado

@router.get("/flujo-efectivo")
async def get_flujo_efectivo(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    resultado = await ContabilidadReportesService.get_flujo_efectivo(
        current_user.tenant_id, fecha_inicio, fecha_fin, sucursal_id
    )
    return resultado

@router.get("/asientos")
async def get_asientos(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    referencia_tipo: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_admin)
):
    from app.domain.models.contabilidad import AsientoContable
    import math

    tenant_id = current_user.tenant_id
    query = {"tenant_id": tenant_id}
    
    if fecha_inicio and fecha_fin:
        query["fecha"] = {"$gte": fecha_inicio, "$lte": fecha_fin}
    elif fecha_inicio:
        query["fecha"] = {"$gte": fecha_inicio}
    elif fecha_fin:
        query["fecha"] = {"$lte": fecha_fin}

    if referencia_tipo:
        query["referencia_tipo"] = referencia_tipo

    skip = (page - 1) * limit
    col = AsientoContable.get_pymongo_collection()
    total = await col.count_documents(query)
    cursor = col.find(query).sort([("fecha", -1), ("numero", -1)]).skip(skip).limit(limit)
    raw_asientos = await cursor.to_list(length=limit)

    items = []
    for a in raw_asientos:
        items.append({
            "id": str(a["_id"]),
            "numero": a.get("numero", 0),
            "fecha": a.get("fecha"),
            "descripcion": a.get("descripcion", ""),
            "lineas": a.get("lineas", []),
            "total_debe": float(a.get("total_debe", 0.0)),
            "total_haber": float(a.get("total_haber", 0.0)),
            "referencia_tipo": a.get("referencia_tipo"),
            "referencia_id": a.get("referencia_id"),
            "es_automatico": a.get("es_automatico", False),
            "anulado": a.get("anulado", False),
            "creado_por": a.get("creado_por"),
            "created_at": a.get("created_at")
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if limit > 0 else 1
    }

