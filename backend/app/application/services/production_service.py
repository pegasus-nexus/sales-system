import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

from app.domain.uow.base_uow import BaseUnitOfWork
from app.domain.repositories.production_repositories import IMealScheduleRepository, IRecipeIngredientRepository
from app.domain.repositories.inventory_repositories import IAlmacenRepository, IInventoryRepository
from app.domain.repositories.base_repository import BaseRepository
from app.domain.repositories.client_meal_plan_repositories import IClientMealPlanRepository

from app.domain.models.meal_schedule import MealSchedule, MealScheduleStatus
from app.domain.models.client_meal_plan import ClientMealPlanStatus
from app.domain.models.inventario import InventoryLog, TipoMovimiento
from app.domain.models.product import Product
from app.domain.models.user import User

logger = logging.getLogger("ProductionService")

class ProductionService:
    def __init__(
        self,
        uow: BaseUnitOfWork,
        schedule_repo: IMealScheduleRepository,
        ingredient_repo: IRecipeIngredientRepository,
        almacen_repo: IAlmacenRepository,
        inventory_repo: IInventoryRepository,
        inventory_log_repo: BaseRepository[InventoryLog],
        client_plan_repo: IClientMealPlanRepository,
        product_repo: BaseRepository[Product]
    ):
        self.uow = uow
        self.schedule_repo = schedule_repo
        self.ingredient_repo = ingredient_repo
        self.almacen_repo = almacen_repo
        self.inventory_repo = inventory_repo
        self.inventory_log_repo = inventory_log_repo
        self.client_plan_repo = client_plan_repo
        self.product_repo = product_repo

    async def get_daily_production_report(self, tenant_id: str, sucursal_id: str, fecha_programada: str) -> Dict[str, Any]:
        """
        Retorna el listado de ingredientes requeridos agrupados por almacén/tipo para un día.
        """
        schedules = await self.schedule_repo.get_by_date_and_status(tenant_id, fecha_programada, MealScheduleStatus.PROGRAMADO)

        recipe_ids = []
        for s in schedules:
            recipe_ids.extend(s.recetas_ids)
        
        if not recipe_ids:
            return {"schedules_count": 0, "ingredients": []}

        ingredients = await self.ingredient_repo.get_by_recipe_ids(tenant_id, recipe_ids)

        report = {}
        # We need products to get descriptions
        # Note: Since BaseRepository only has get_all and get_by_id, we might need a custom method for get_by_ids.
        # But for now, we can fetch all or just use the model directly to not break the app while refactoring.
        # For true decoupling, we should add get_by_ids to BaseRepository.
        # I'll use the Mongo model directly just for this query to keep it simple, or iterate.
        prod_ids = list(set([str(i.producto_id) for i in ingredients]))
        
        prods = []
        for pid in prod_ids:
            p = await self.product_repo.get_by_id(pid)
            if p: prods.append(p)
            
        prod_map = {str(p.id): p.descripcion for p in prods}

        recipe_counts = {}
        for rid in recipe_ids:
            recipe_counts[rid] = recipe_counts.get(rid, 0) + 1

        for ing in ingredients:
            key = f"{ing.producto_id}_{ing.tipo_almacen_origen}"
            qty_needed = ing.cantidad * recipe_counts[ing.recipe_id]
            if key not in report:
                report[key] = {
                    "producto_id": ing.producto_id,
                    "descripcion": prod_map.get(str(ing.producto_id), "Desconocido"),
                    "tipo_almacen_origen": ing.tipo_almacen_origen,
                    "cantidad_total": 0.0,
                    "unidad": ing.unidad_medida_receta
                }
            report[key]["cantidad_total"] += qty_needed

        return {
            "schedules_count": len(schedules),
            "ingredients": list(report.values())
        }

    async def mark_as_delivered(self, tenant_id: str, sucursal_id: str, schedule_id: str, current_user: User) -> MealSchedule:
        """
        Marca un MealSchedule como ENTREGADO y hace la deducción atómica de inventario.
        """
        async with self.uow:
            schedule = await self.schedule_repo.get_by_id(schedule_id)
            if not schedule or schedule.tenant_id != tenant_id:
                raise HTTPException(status_code=404, detail="MealSchedule no encontrado")

            if schedule.estado != MealScheduleStatus.PROGRAMADO:
                raise HTTPException(status_code=400, detail=f"No se puede entregar un bowl que está {schedule.estado}")

            if not schedule.recetas_ids:
                schedule.estado = MealScheduleStatus.ENTREGADO
                schedule.entregado_at = datetime.utcnow()
                await self.schedule_repo.update(schedule)
                return schedule

            ingredients = await self.ingredient_repo.get_by_recipe_ids(tenant_id, schedule.recetas_ids, session=self.uow.session)

            almacenes_sucursal = await self.almacen_repo.get_by_sucursal(tenant_id, sucursal_id, session=self.uow.session)
            almacen_map = {a.tipo: str(a.id) for a in almacenes_sucursal}

            for ing in ingredients:
                almacen_id = almacen_map.get(ing.tipo_almacen_origen, "default")
                
                updated_inv = await self.inventory_repo.deduct_inventory_atomic(
                    tenant_id=tenant_id,
                    sucursal_id=sucursal_id,
                    almacen_id=almacen_id,
                    producto_id=ing.producto_id,
                    cantidad=ing.cantidad,
                    session=self.uow.session
                )

                log = InventoryLog(
                    tenant_id=tenant_id,
                    sucursal_id=sucursal_id,
                    almacen_id=almacen_id,
                    producto_id=ing.producto_id,
                    descripcion=f"Ingrediente descontado para receta {ing.recipe_id}",
                    tipo_movimiento=TipoMovimiento.SALIDA_MANUAL,
                    cantidad_movida=-ing.cantidad,
                    stock_resultante=updated_inv.get("cantidad", -ing.cantidad) if updated_inv else -ing.cantidad,
                    usuario_id=str(current_user.id),
                    usuario_nombre=current_user.full_name or current_user.username,
                    notas=f"Bowl entregado. Schedule: {schedule_id}",
                    referencia_id=schedule_id
                )
                await self.inventory_log_repo.add(log) # Esto internamente no pasa la sesion, habra que arreglarlo en MongoBaseRepository

            schedule.estado = MealScheduleStatus.ENTREGADO
            schedule.entregado_at = datetime.utcnow()
            await self.schedule_repo.update(schedule)

            plan = await self.client_plan_repo.get_by_id(schedule.client_meal_plan_id)
            if plan:
                plan.comidas_consumidas += 1
                if plan.comidas_consumidas >= plan.comidas_totales:
                    plan.estado = ClientMealPlanStatus.FINALIZADO
                await self.client_plan_repo.update(plan)

            return schedule

    async def update_meal_schedule(self, tenant_id: str, schedule_id: str, recetas_ids: List[str] = None, estado: MealScheduleStatus = None, motivo_postergacion: str = None) -> MealSchedule:
        schedule = await self.schedule_repo.get_by_id(schedule_id)
        if not schedule or schedule.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="MealSchedule no encontrado")

        if schedule.estado == MealScheduleStatus.ENTREGADO:
            raise HTTPException(status_code=400, detail="No se puede editar un bowl que ya fue entregado")

        if recetas_ids is not None:
            schedule.recetas_ids = recetas_ids
        
        if estado is not None:
            schedule.estado = estado
            if estado == MealScheduleStatus.POSTPERGADO:
                schedule.motivo_postergacion = motivo_postergacion
        
        await self.schedule_repo.update(schedule)
        return schedule
