import math
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId

from app.domain.models.lote import LoteInventario
from app.domain.models.product import Product
from app.domain.models.user import User, UserRole
from app.domain.schemas.lote import LoteResponse, LotesPaginated, LotesResumen
from app.infrastructure.auth import get_current_active_user

router = APIRouter()

def _calcular_estado_vencimiento(fecha_vencimiento: Optional[datetime], now: datetime):
    if not fecha_vencimiento:
        return None, "SIN_FECHA"
    
    # Asegurar que ambas fechas sean timezone-aware o timezone-naive
    if fecha_vencimiento.tzinfo is None:
        fecha_venc = fecha_vencimiento.replace(tzinfo=timezone.utc)
    else:
        fecha_venc = fecha_vencimiento

    dias_restantes = (fecha_venc - now).days
    if dias_restantes < 0:
        return dias_restantes, "VENCIDO"
    elif dias_restantes <= 30:
        return dias_restantes, "POR_VENCER"
    else:
        return dias_restantes, "VIGENTE"


@router.get("", response_model=LotesPaginated)
async def list_lotes(
    sucursal_id: Optional[str] = Query(None),
    almacen_id: Optional[str] = Query(None),
    producto_id: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    solo_vencidos: bool = Query(False),
    por_vencer_dias: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    now = datetime.now(timezone.utc)
    
    # Control de roles
    if current_user.role in [UserRole.CAJERO, UserRole.USER]:
        sucursal_id = current_user.sucursal_id or "CENTRAL"

    query = {"tenant_id": tenant_id, "is_active": True}
    if sucursal_id and sucursal_id != "TODAS":
        query["sucursal_id"] = sucursal_id
    if almacen_id and almacen_id != "TODOS":
        query["almacen_id"] = almacen_id
    if producto_id:
        query["producto_id"] = producto_id
    if estado:
        query["estado"] = estado

    if solo_vencidos:
        query["fecha_vencimiento"] = {"$lt": now}
    elif por_vencer_dias is not None:
        limite = now + timedelta(days=por_vencer_dias)
        query["fecha_vencimiento"] = {"$gte": now, "$lte": limite}

    if search and search.strip():
        # Puede buscar por código de lote o por nombre de producto
        import re
        safe_term = re.escape(search.strip())
        query["lote_codigo"] = {"$regex": safe_term, "$options": "i"}

    skip = (page - 1) * limit
    col = LoteInventario.get_pymongo_collection()
    total = await col.count_documents(query)
    
    cursor = col.find(query).sort([("fecha_vencimiento", 1), ("created_at", -1)]).skip(skip).limit(limit)
    raw_lotes = await cursor.to_list(length=limit)

    # Enriquecer con nombres de producto
    prod_ids = list({l.get("producto_id") for l in raw_lotes if l.get("producto_id")})
    prod_map = {}
    if prod_ids:
        # Resolver ObjectIds
        obj_ids = []
        for pid in prod_ids:
            try:
                obj_ids.append(ObjectId(pid))
            except Exception:
                pass
        
        prod_cursor = Product.get_pymongo_collection().find(
            {"tenant_id": tenant_id, "$or": [{"_id": {"$in": obj_ids}}, {"_id": {"$in": prod_ids}}]}
        )
        for p in await prod_cursor.to_list(length=len(prod_ids)):
            prod_map[str(p["_id"])] = {
                "nombre": p.get("descripcion", ""),
                "codigo": p.get("codigo_corto") or p.get("codigo_sistema") or ""
            }

    items: List[LoteResponse] = []
    for raw in raw_lotes:
        pid = raw.get("producto_id", "")
        pinfo = prod_map.get(pid, {"nombre": None, "codigo": None})
        fv = raw.get("fecha_vencimiento")
        dias_rest, estado_venc = _calcular_estado_vencimiento(fv, now)

        # Si el lote expiró físicamente pero su estado no es VENCIDO, marcar estado_vencimiento
        items.append(LoteResponse(
            id=str(raw["_id"]),
            tenant_id=raw["tenant_id"],
            sucursal_id=raw.get("sucursal_id", "CENTRAL"),
            almacen_id=raw.get("almacen_id", "default"),
            producto_id=pid,
            producto_nombre=pinfo["nombre"],
            producto_codigo=pinfo["codigo"],
            lote_codigo=raw["lote_codigo"],
            fecha_vencimiento=fv,
            cantidad_inicial=raw.get("cantidad_inicial", 0.0),
            cantidad_actual=raw.get("cantidad_actual", 0.0),
            costo_unitario=raw.get("costo_unitario", 0.0),
            estado=raw.get("estado", "ACTIVO"),
            dias_restantes=dias_rest,
            estado_vencimiento=estado_venc,
            proveedor_nombre=raw.get("proveedor_nombre"),
            created_at=raw.get("created_at", now),
            updated_at=raw.get("updated_at", now),
        ))

    pages = math.ceil(total / limit) if limit > 0 else 1
    return LotesPaginated(
        items=items,
        total=total,
        page=page,
        pages=pages
    )


@router.get("/resumen", response_model=LotesResumen)
async def get_resumen_lotes(
    sucursal_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    now = datetime.now(timezone.utc)
    limite_30d = now + timedelta(days=30)
    
    match_q = {"tenant_id": tenant_id, "is_active": True}
    if sucursal_id and sucursal_id != "TODAS":
        match_q["sucursal_id"] = sucursal_id

    col = LoteInventario.get_pymongo_collection()
    
    # Contadores
    total_activos = await col.count_documents({**match_q, "estado": "ACTIVO", "cantidad_actual": {"$gt": 0}})
    vencidos = await col.count_documents({
        **match_q,
        "cantidad_actual": {"$gt": 0},
        "fecha_vencimiento": {"$lt": now}
    })
    por_vencer_30d = await col.count_documents({
        **match_q,
        "cantidad_actual": {"$gt": 0},
        "fecha_vencimiento": {"$gte": now, "$lte": limite_30d}
    })

    # Total unidades agregadas
    pipeline = [
        {"$match": {**match_q, "estado": "ACTIVO"}},
        {"$group": {"_id": None, "total_unidades": {"$sum": "$cantidad_actual"}}}
    ]
    agg_res = await col.aggregate(pipeline).to_list(length=1)
    total_unidades = agg_res[0]["total_unidades"] if agg_res else 0.0

    return LotesResumen(
        total_lotes_activos=total_activos,
        total_unidades=float(total_unidades),
        por_vencer_30d=por_vencer_30d,
        vencidos=vencidos
    )


@router.put("/{lote_id}/estado")
async def cambiar_estado_lote(
    lote_id: str,
    nuevo_estado: str = Query(..., pattern="^(ACTIVO|BLOQUEADO|AGOTADO|VENCIDO)$"),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar el estado de lotes")
    
    tenant_id = current_user.tenant_id or "default"
    try:
        obj_id = ObjectId(lote_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de lote inválido")

    col = LoteInventario.get_pymongo_collection()
    res = await col.update_one(
        {"_id": obj_id, "tenant_id": tenant_id},
        {"$set": {"estado": nuevo_estado, "updated_at": datetime.now(timezone.utc)}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    return {"message": f"Estado del lote actualizado a {nuevo_estado}", "lote_id": lote_id}
