import pytest
from app.domain.models.recipe import Recipe, RecipeType
from app.domain.models.meal_plan_template import MealPlanTemplate
from app.domain.models.base import DecimalMoney

@pytest.mark.asyncio
async def test_create_recipe_model():
    """
    Verifica que el modelo de Receta de la Dark Kitchen
    puede ser instanciado y validado correctamente por Pydantic/Beanie.
    """
    try:
        recipe = Recipe(
            tenant_id="test_tenant",
            nombre="Bowl de Prueba",
            descripcion="Bowl saludable con pollo",
            tipo=RecipeType.PLATO_FINAL,
            precio_extra=0.0
        )
        assert recipe.nombre == "Bowl de Prueba"
        assert recipe.tipo == RecipeType.PLATO_FINAL
    except Exception as e:
        pytest.fail(f"Fallo al instanciar modelo Recipe: {e}")

@pytest.mark.asyncio
async def test_create_meal_plan_template_model():
    """
    Verifica que el modelo MealPlanTemplate maneja correctamente
    la inicialización de campos y validación de tipos, especialmente DecimalMoney.
    """
    try:
        plan = MealPlanTemplate(
            tenant_id="test_tenant",
            nombre="Plan 5 Días",
            cantidad_comidas=5,
            dias_vigencia=7,
            precio_sugerido=DecimalMoney("100.00"),
            es_flexible=True
        )
        assert plan.cantidad_comidas == 5
        assert plan.dias_vigencia == 7
        assert str(plan.precio_sugerido) == "100.00"
    except Exception as e:
        pytest.fail(f"Fallo al instanciar modelo MealPlanTemplate: {e}")
