from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from app.domain.models.recipe import Recipe
from app.domain.models.recipe_ingredient import RecipeIngredient
from app.domain.models.user import User
from app.infrastructure.auth import get_current_active_user
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeResponse, RecipeIngredientResponse

router = APIRouter()

@router.post("/recipes", response_model=RecipeResponse)
async def create_recipe(
    data: RecipeCreate,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    
    # Crear la receta principal
    recipe = Recipe(
        tenant_id=tenant_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        tipo=data.tipo,
        precio_extra=data.precio_extra
    )
    await recipe.create()
    
    # Crear los ingredientes si existen
    ingredientes_creados = []
    if data.ingredientes:
        for ing in data.ingredientes:
            recipe_ing = RecipeIngredient(
                tenant_id=tenant_id,
                recipe_id=str(recipe.id),
                producto_id=ing.producto_id,
                cantidad=ing.cantidad,
                unidad_medida_receta=ing.unidad_medida_receta,
                tipo_almacen_origen=ing.tipo_almacen_origen,
                es_opcional=ing.es_opcional,
                notas=ing.notas
            )
            await recipe_ing.create()
            ingredientes_creados.append(recipe_ing)
            
    # Podríamos poblar los ingredientes en la respuesta, pero para este endpoint
    # retornamos la receta base y dejamos que el cliente recargue si necesita la vista full.
    response_data = recipe.model_dump()
    response_data["ingredientes"] = [ing.model_dump() for ing in ingredientes_creados]
    
    return response_data

@router.get("/recipes", response_model=List[RecipeResponse])
async def list_recipes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    recipes = await Recipe.find(Recipe.tenant_id == tenant_id, Recipe.is_active == True).skip(skip).limit(limit).to_list()
    return recipes
