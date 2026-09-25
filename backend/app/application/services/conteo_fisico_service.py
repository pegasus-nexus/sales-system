from typing import List, Optional
from datetime import datetime
import pytz
from fastapi import HTTPException
from app.domain.models.conteo_fisico import ConteoFisico, ConteoItem, EstadoConteo
from app.domain.models.inventario import Inventario
from app.domain.models.product import Product
from app.domain.repositories.conteo_fisico_repository import ConteoFisicoRepository
from app.domain.schemas.conteo_fisico import (
    ConteoFisicoResponse, 
    ConteoFisicoListResponse, 
    IniciarConteoRequest,
    GuardarConteoRequest,
    ConteoItemSchema
)

class ConteoFisicoService:
    def __init__(self, repository: ConteoFisicoRepository):
        self.repository = repository

    async def list_conteos(self, tenant_id: str, sucursal_id: Optional[str] = None) -> List[ConteoFisicoListResponse]:
        conteos = await self.repository.list_by_tenant_and_sucursal(tenant_id, sucursal_id)
        result = []
        for c in conteos:
            total_items = len(c.items)
            diff_items = sum(i.diferencia for i in c.items)
            diff_money = sum(i.valor_diferencia for i in c.items)
            result.append(ConteoFisicoListResponse(
                id=str(c.id),
                tenant_id=c.tenant_id,
                sucursal_id=c.sucursal_id,
                estado=c.estado,
                fecha_inicio=c.fecha_inicio,
                fecha_cierre=c.fecha_cierre,
                creado_por_nombre=c.creado_por_nombre,
                notas=c.notas,
                total_items=total_items,
                total_diferencia_items=diff_items,
                total_diferencia_monetaria=diff_money
            ))
        return result

    async def get_conteo(self, conteo_id: str, tenant_id: str) -> ConteoFisicoResponse:
        conteo = await self.repository.get_by_id(conteo_id, tenant_id)
        if not conteo:
            raise HTTPException(status_code=404, detail="Conteo no encontrado")
        
        items_schema = [
            ConteoItemSchema(
                producto_id=i.producto_id,
                codigo_corto=i.codigo_corto,
                descripcion=i.descripcion,
                stock_sistema=i.stock_sistema,
                stock_fisico=i.stock_fisico,
                diferencia=i.diferencia,
                costo_unitario=i.costo_unitario,
                valor_diferencia=i.valor_diferencia
            ) for i in conteo.items
        ]
        
        return ConteoFisicoResponse(
            id=str(conteo.id),
            tenant_id=conteo.tenant_id,
            sucursal_id=conteo.sucursal_id,
            estado=conteo.estado,
            fecha_inicio=conteo.fecha_inicio,
            fecha_cierre=conteo.fecha_cierre,
            creado_por=conteo.creado_por,
            creado_por_nombre=conteo.creado_por_nombre,
            notas=conteo.notas,
            items=items_schema
        )

    async def iniciar_conteo(self, req: IniciarConteoRequest, tenant_id: str, user_id: str, user_name: str) -> ConteoFisicoResponse:
        # Prevent starting if there is already an active draft for this branch
        active_conteos = await ConteoFisico.find(
            ConteoFisico.tenant_id == tenant_id,
            ConteoFisico.sucursal_id == req.sucursal_id,
            ConteoFisico.estado == EstadoConteo.BORRADOR
        ).to_list()
        
        if active_conteos:
            raise HTTPException(status_code=400, detail="Ya existe un conteo en borrador para esta sucursal. Ciérralo o elimínalo primero.")

        # Snapshot current system stock
        productos = await Product.find(Product.tenant_id == tenant_id, Product.is_active == True).to_list()
        
        # Load inventory for this branch
        inventarios = await Inventario.find(
            Inventario.tenant_id == tenant_id,
            Inventario.sucursal_id == req.sucursal_id
        ).to_list()
        
        inv_map = {str(i.producto_id): i.cantidad for i in inventarios}
        
        conteo_items = []
        for p in productos:
            qty = inv_map.get(str(p.id), 0.0)
            costo = float(p.costo_producto) if p.costo_producto else 0.0
            
            conteo_items.append(ConteoItem(
                producto_id=str(p.id),
                codigo_corto=p.codigo_corto,
                descripcion=p.descripcion,
                stock_sistema=qty,
                stock_fisico=None,
                diferencia=0.0,
                costo_unitario=costo,
                valor_diferencia=0.0
            ))
            
        nuevo_conteo = ConteoFisico(
            tenant_id=tenant_id,
            sucursal_id=req.sucursal_id,
            estado=EstadoConteo.BORRADOR,
            creado_por=user_id,
            creado_por_nombre=user_name,
            notas=req.notas,
            items=conteo_items
        )
        
        conteo_db = await self.repository.create(nuevo_conteo)
        return await self.get_conteo(str(conteo_db.id), tenant_id)

    async def guardar_progreso(self, conteo_id: str, req: GuardarConteoRequest, tenant_id: str) -> ConteoFisicoResponse:
        conteo = await self.repository.get_by_id(conteo_id, tenant_id)
        if not conteo:
            raise HTTPException(status_code=404, detail="Conteo no encontrado")
        
        if conteo.estado == EstadoConteo.FINALIZADO:
            raise HTTPException(status_code=400, detail="El conteo ya está finalizado y no se puede modificar")
            
        if req.notas is not None:
            conteo.notas = req.notas
            
        # Update items
        new_items = []
        for item_req in req.items:
            diff = 0.0
            val_diff = 0.0
            if item_req.stock_fisico is not None:
                diff = float(item_req.stock_fisico) - float(item_req.stock_sistema)
                val_diff = diff * float(item_req.costo_unitario)
                
            new_items.append(ConteoItem(
                producto_id=item_req.producto_id,
                codigo_corto=item_req.codigo_corto,
                descripcion=item_req.descripcion,
                stock_sistema=item_req.stock_sistema,
                stock_fisico=item_req.stock_fisico,
                diferencia=diff,
                costo_unitario=item_req.costo_unitario,
                valor_diferencia=val_diff
            ))
            
        conteo.items = new_items
        await self.repository.update(conteo)
        return await self.get_conteo(conteo_id, tenant_id)

    async def finalizar_conteo(self, conteo_id: str, tenant_id: str) -> ConteoFisicoResponse:
        conteo = await self.repository.get_by_id(conteo_id, tenant_id)
        if not conteo:
            raise HTTPException(status_code=404, detail="Conteo no encontrado")
            
        if conteo.estado == EstadoConteo.FINALIZADO:
            raise HTTPException(status_code=400, detail="El conteo ya está finalizado")
            
        conteo.estado = EstadoConteo.FINALIZADO
        conteo.fecha_cierre = datetime.utcnow()
        await self.repository.update(conteo)
        return await self.get_conteo(conteo_id, tenant_id)
        
    async def eliminar_conteo(self, conteo_id: str, tenant_id: str) -> bool:
        conteo = await self.repository.get_by_id(conteo_id, tenant_id)
        if not conteo:
            raise HTTPException(status_code=404, detail="Conteo no encontrado")
            
        # Soft delete
        conteo.is_active = False
        conteo.deleted_at = datetime.utcnow()
        await self.repository.update(conteo)
        return True
