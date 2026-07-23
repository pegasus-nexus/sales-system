from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, tenants, users, products, sales,
    caja, categories, upload, analytics,
    sucursales, inventario, pedidos, descuentos,
    price_requests, clientes, price_lists, reports, creditos, b2b,
    comunidad, traslados, audit, almacenes, recipes, meal_plans, production, proveedores, fidelizacion
    # chat,  # DESACTIVADO: Chatbot IA consume demasiada memoria (46K+ registros). Reactivar cuando se optimice.
)

api_router = APIRouter()

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(tenants.router, tags=["tenants"])
api_router.include_router(sucursales.router, tags=["sucursales"])
api_router.include_router(almacenes.router, prefix="/almacenes", tags=["almacenes"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(products.router, tags=["products"])
api_router.include_router(inventario.router, tags=["inventario"])
api_router.include_router(pedidos.router, tags=["pedidos"])
api_router.include_router(sales.router, tags=["sales"])
api_router.include_router(creditos.router, tags=["creditos"])
api_router.include_router(caja.router, prefix="/caja", tags=["caja"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(upload.router, tags=["upload"])
api_router.include_router(descuentos.router, prefix="/descuentos", tags=["descuentos"])
api_router.include_router(price_requests.router, tags=["price_requests"])
api_router.include_router(clientes.router, tags=["clientes"])
api_router.include_router(proveedores.router, tags=["proveedores"])
api_router.include_router(price_lists.router, prefix="/listas-precios", tags=["price_lists"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
# DESACTIVADO: Chatbot IA consume demasiada memoria (46K+ registros). Reactivar cuando se optimice.
# api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(b2b.router, prefix="/b2b", tags=["b2b"])
api_router.include_router(comunidad.router, prefix="/comunidad", tags=["comunidad"])
api_router.include_router(traslados.router, prefix="/traslados", tags=["traslados"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["audit"])
api_router.include_router(recipes.router, tags=["recipes"])
api_router.include_router(meal_plans.router, tags=["meal_plans"])
api_router.include_router(production.router, tags=["production"])
api_router.include_router(fidelizacion.router, prefix="/fidelizacion", tags=["fidelizacion"])
