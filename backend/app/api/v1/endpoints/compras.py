from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.infrastructure.auth import get_current_active_user as get_current_user, require_roles
from app.domain.models.user import User, UserRole
from app.application.services.compra_service import CompraService
from app.domain.models.compra import PurchaseOrder, PurchaseOrderItem, PurchaseReception, PurchaseReceptionItem
from app.domain.schemas.compra import PurchaseOrderCreate, PurchaseOrderUpdateStatus, PurchaseReceptionCreate

router = APIRouter()

def get_compra_service():
    return CompraService()

@router.post("/orders", response_model=PurchaseOrder, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    order_in: PurchaseOrderCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    service: CompraService = Depends(get_compra_service)
):
    """
    Crea un nuevo Pedido de Compra al proveedor.
    """
    tenant_id = current_user.tenant_id or "default"
    
    detalles = [
        PurchaseOrderItem(
            producto_id=item.producto_id,
            nombre_producto=item.nombre_producto,
            codigo_producto=item.codigo_producto,
            cantidad_pedida=item.cantidad_pedida,
            costo_unitario_estimado=item.costo_unitario_estimado,
            subtotal=item.subtotal
        )
        for item in order_in.detalles
    ]

    order = PurchaseOrder(
        tenant_id=tenant_id,
        sucursal_id=order_in.sucursal_id,
        proveedor_id=order_in.proveedor_id,
        proveedor_nombre=order_in.proveedor_nombre,
        numero_pedido=order_in.numero_pedido,
        fecha_esperada=order_in.fecha_esperada,
        detalles=detalles,
        total_estimado=order_in.total_estimado,
        notas=order_in.notas,
        creado_por=str(current_user.id)
    )

    return await service.create_purchase_order(order)

@router.get("/orders/{sucursal_id}", response_model=List[PurchaseOrder])
async def list_purchase_orders(
    sucursal_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.CAJERO])),
    service: CompraService = Depends(get_compra_service)
):
    """
    Lista todos los pedidos de compra para una sucursal específica.
    """
    tenant_id = current_user.tenant_id or "default"
    return await service.list_purchase_orders(tenant_id, sucursal_id)

@router.get("/orders/detail/{sucursal_id}/{order_id}", response_model=PurchaseOrder)
async def get_purchase_order(
    sucursal_id: str,
    order_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.CAJERO])),
    service: CompraService = Depends(get_compra_service)
):
    """
    Obtiene el detalle de un pedido de compra.
    """
    tenant_id = current_user.tenant_id or "default"
    order = await service.get_purchase_order(tenant_id, sucursal_id, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order

@router.put("/orders/{sucursal_id}/{order_id}/status", response_model=PurchaseOrder)
async def update_purchase_order_status(
    sucursal_id: str,
    order_id: str,
    status_in: PurchaseOrderUpdateStatus,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    service: CompraService = Depends(get_compra_service)
):
    """
    Actualiza el estado de un pedido de compra de forma manual (ej. CANCELADO).
    """
    tenant_id = current_user.tenant_id or "default"
    try:
        return await service.update_purchase_order_status(tenant_id, sucursal_id, order_id, status_in.estado)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/receptions", response_model=PurchaseReception, status_code=status.HTTP_201_CREATED)
async def create_purchase_reception(
    reception_in: PurchaseReceptionCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.CAJERO])),
    service: CompraService = Depends(get_compra_service)
):
    """
    Confirma el Ingreso Físico de Mercadería (Recepciones).
    Impacta inventario, crea kárdex y recalcula precios automáticamente si hubo cambios en los costos.
    """
    tenant_id = current_user.tenant_id or "default"
    
    detalles = [
        PurchaseReceptionItem(
            producto_id=item.producto_id,
            nombre_producto=item.nombre_producto,
            codigo_producto=item.codigo_producto,
            cantidad_recibida=item.cantidad_recibida,
            costo_unitario_real=item.costo_unitario_real,
            subtotal=item.subtotal
        )
        for item in reception_in.detalles
    ]

    reception = PurchaseReception(
        tenant_id=tenant_id,
        sucursal_id=reception_in.sucursal_id,
        proveedor_id=reception_in.proveedor_id,
        proveedor_nombre=reception_in.proveedor_nombre,
        purchase_order_id=reception_in.purchase_order_id,
        numero_documento=reception_in.numero_documento,
        detalles=detalles,
        total_real=reception_in.total_real,
        notas=reception_in.notas,
        creado_por="" # será asignado en el servicio
    )

    try:
        return await service.confirm_purchase_reception(
            reception,
            usuario_id=str(current_user.id),
            usuario_nombre=current_user.full_name
        )
    except Exception as e:
        # En producción se debe usar log.error
        raise HTTPException(status_code=500, detail=f"Error confirmando ingreso: {str(e)}")

@router.get("/receptions/{sucursal_id}", response_model=List[PurchaseReception])
async def list_purchase_receptions(
    sucursal_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.CAJERO])),
    service: CompraService = Depends(get_compra_service)
):
    """
    Lista todos los ingresos de mercadería para una sucursal específica.
    """
    tenant_id = current_user.tenant_id or "default"
    return await service.list_purchase_receptions(tenant_id, sucursal_id)
