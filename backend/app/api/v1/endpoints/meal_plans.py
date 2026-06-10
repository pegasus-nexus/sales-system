from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from app.domain.models.meal_plan_template import MealPlanTemplate
from app.domain.models.user import User
from app.infrastructure.auth import get_current_active_user
from app.schemas.meal_plan import MealPlanTemplateCreate, MealPlanTemplateUpdate, MealPlanTemplateResponse

router = APIRouter()

@router.post("/meal-plans/templates", response_model=MealPlanTemplateResponse)
async def create_meal_plan_template(
    data: MealPlanTemplateCreate,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    from app.domain.models.base import DecimalMoney
    
    template = MealPlanTemplate(
        tenant_id=tenant_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        cantidad_comidas=data.cantidad_comidas,
        dias_vigencia=data.dias_vigencia,
        precio_sugerido=DecimalMoney(str(data.precio_sugerido)),
        es_flexible=data.es_flexible
    )
    await template.create()
    return template

@router.get("/meal-plans/templates", response_model=List[MealPlanTemplateResponse])
async def list_meal_plan_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    templates = await MealPlanTemplate.find(
        MealPlanTemplate.tenant_id == tenant_id, 
        MealPlanTemplate.is_active == True
    ).skip(skip).limit(limit).to_list()
    return templates
