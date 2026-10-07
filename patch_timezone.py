import os

path = "backend/app/application/services/sales_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """                        from app.domain.models.client_meal_plan import ClientMealPlan
                        from datetime import timedelta, timezone"""
replacement = """                        from app.domain.models.client_meal_plan import ClientMealPlan"""
data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("sales_service.py timezone local import patched")
