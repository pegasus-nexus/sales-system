from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from beanie import PydanticObjectId

from app.domain.models.cotizacion import Cotizacion, EstadoCotizacion
from app.domain.models.user import User
from app.infrastructure.auth import get_current_active_user
from app.application.services.cotizacion_service import CotizacionService

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones B2B"])

class CotizacionCreateRequest(BaseModel):
    sucursal_id: str = "CENTRAL"
    almacen_id: str = "default"
    cliente: dict
    items: list
    validez_dias: int = 15
    notas: Optional[str] = None
    condiciones_comerciales: Optional[str] = None

class ConvertirVentaRequest(BaseModel):
    metodo_pago: str = "EFECTIVO" # EFECTIVO, QR, TARJETA, CREDITO

@router.get("")
async def listar_cotizaciones(
    sucursal_id: Optional[str] = None,
    estado: Optional[EstadoCotizacion] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    query = {"tenant_id": tenant_id}
    
    if sucursal_id and sucursal_id != "ALL":
        query["sucursal_id"] = sucursal_id
    if estado:
        query["estado"] = estado
    if search:
        query["$or"] = [
            {"numero_cotizacion": {"$regex": search, "$options": "i"}},
            {"cliente.nombre_razon_social": {"$regex": search, "$options": "i"}},
            {"cliente.nit_ci": {"$regex": search, "$options": "i"}},
        ]

    coll = Cotizacion.get_motor_collection()
    docs = await coll.find(query).sort("created_at", -1).limit(limit).to_list(length=None)
    for d in docs:
        d["id"] = str(d["_id"])
    return docs

@router.get("/{cotizacion_id}")
async def obtener_cotizacion(
    cotizacion_id: str,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    cot = await Cotizacion.find_one(Cotizacion.id == PydanticObjectId(cotizacion_id), Cotizacion.tenant_id == tenant_id)
    if not cot:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return cot

@router.post("")
async def crear_cotizacion(
    req: CotizacionCreateRequest,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    return await CotizacionService.crear_cotizacion(
        tenant_id=tenant_id,
        sucursal_id=req.sucursal_id,
        almacen_id=req.almacen_id,
        cliente_data=req.cliente,
        items_data=req.items,
        validez_dias=req.validez_dias,
        notas=req.notas,
        condiciones_comerciales=req.condiciones_comerciales,
        current_user=current_user
    )

@router.put("/{cotizacion_id}/estado")
async def cambiar_estado_cotizacion(
    cotizacion_id: str,
    nuevo_estado: EstadoCotizacion,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    return await CotizacionService.cambiar_estado(
        cotizacion_id=cotizacion_id,
        nuevo_estado=nuevo_estado,
        tenant_id=tenant_id
    )

@router.post("/{cotizacion_id}/convertir-a-venta")
async def convertir_a_venta(
    cotizacion_id: str,
    req: ConvertirVentaRequest,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    return await CotizacionService.convertir_en_venta(
        cotizacion_id=cotizacion_id,
        metodo_pago=req.metodo_pago,
        tenant_id=tenant_id,
        current_user=current_user
    )
