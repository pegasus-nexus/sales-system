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
    
    # Populate ingredients count or list if needed
    result = []
    for r in recipes:
        # Retrieve ingredients count or first few if required
        ings = await RecipeIngredient.find(RecipeIngredient.recipe_id == str(r.id)).to_list()
        r_dump = r.model_dump()
        r_dump["ingredientes"] = [ing.model_dump() for ing in ings]
        result.append(r_dump)
        
    return result

@router.get("/recipes/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    recipe_id: str,
    current_user: User = Depends(get_current_active_user)
):
    recipe = await Recipe.get(recipe_id)
    if not recipe or recipe.tenant_id != (current_user.tenant_id or "default"):
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    
    # Obtener ingredientes asociados
    ingredientes = await RecipeIngredient.find(RecipeIngredient.recipe_id == recipe_id).to_list()
    
    response_data = recipe.model_dump()
    response_data["ingredientes"] = [ing.model_dump() for ing in ingredientes]
    return response_data

@router.put("/recipes/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: str,
    data: RecipeUpdate,
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id or "default"
    recipe = await Recipe.get(recipe_id)
    if not recipe or recipe.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
        
    update_data = data.model_dump(exclude_unset=True)
    ingredientes = update_data.pop("ingredientes", None)
    
    for field, value in update_data.items():
        setattr(recipe, field, value)
        
    await recipe.save()
    
    # Si se pasaron ingredientes, actualizarlos
    if ingredientes is not None:
        # Eliminar ingredientes anteriores
        old_ingredients = await RecipeIngredient.find(RecipeIngredient.recipe_id == recipe_id).to_list()
        for old in old_ingredients:
            await old.delete()
            
        # Insertar nuevos ingredientes
        for ing in ingredientes:
            recipe_ing = RecipeIngredient(
                tenant_id=tenant_id,
                recipe_id=recipe_id,
                producto_id=ing["producto_id"],
                cantidad=ing["cantidad"],
                unidad_medida_receta=ing.get("unidad_medida_receta", "kg"),
                tipo_almacen_origen=ing.get("tipo_almacen_origen", "MATERIA_PRIMA"),
                es_opcional=ing.get("es_opcional", False),
                notas=ing.get("notas", "")
            )
            await recipe_ing.create()
            
    # Obtener la receta finalizada con ingredientes
    updated_ingredients = await RecipeIngredient.find(RecipeIngredient.recipe_id == recipe_id).to_list()
    response_data = recipe.model_dump()
    response_data["ingredientes"] = [ing.model_dump() for ing in updated_ingredients]
    return response_data

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(
    recipe_id: str,
    current_user: User = Depends(get_current_active_user)
):
    recipe = await Recipe.get(recipe_id)
    if not recipe or recipe.tenant_id != (current_user.tenant_id or "default"):
        raise HTTPException(status_code=404, detail="Receta no encontrada")
        
    recipe.is_active = False
    await recipe.save()
    return {"message": "Receta desactivada exitosamente"}
