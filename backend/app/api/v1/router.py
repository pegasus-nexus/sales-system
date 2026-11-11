from fastapi import APIRouter

from app.api.v1.endpoints import (
    almacenes,
    analytics,
    audit,
    auth,
    b2b,
    bi,
    bi_ai,
    bi_clientes,
    bi_descuentos,
    bi_ejecutivo,
    bi_inventario,
    bi_productividad,
    bi_productos,
    bi_rentabilidad,
    bi_sucursales,
    caja,
    catalogo,
    # chat,  # DESACTIVADO: Chatbot IA consume demasiada memoria (46K+ registros). Reactivar cuando se optimice.
    categories,
    clientes,
    compras,
    comunidad,
    contabilidad,
    conteos_fisicos,
    cotizaciones,
    creditos,
    dashboard_matriz,
    descuentos,
    fidelizacion,
    inventario,
    lotes,
    meal_plans,
    momentos_taboada,
    momentos_taboada_wallet,
    operating_hours,
    pedidos,
    price_lists,
    price_requests,
    production,
    products,
    proveedores,
    recipes,
    recordatorio,
    reports,
    saas_staff,
    sales,
    sucursales,
    system_monitor,
    tenants,
    traslados,
    upload,
    users,
    web_collections,
    web_config,
    whatsapp,
)

api_router = APIRouter()

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(bi.router, prefix="/bi", tags=["bi"])
api_router.include_router(operating_hours.router, prefix="/bi", tags=["operating_hours"])
api_router.include_router(bi_productos.router, prefix="/bi-productos", tags=["bi_productos"])
api_router.include_router(bi_clientes.router, prefix="/bi-clientes", tags=["bi_clientes"])
api_router.include_router(bi_sucursales.router, prefix="/bi-sucursales", tags=["bi_sucursales"])
api_router.include_router(bi_inventario.router, prefix="/bi-inventario", tags=["bi_inventario"])
api_router.include_router(bi_rentabilidad.router, prefix="/bi-rentabilidad", tags=["bi_rentabilidad"])
api_router.include_router(bi_descuentos.router, prefix="/bi-descuentos", tags=["bi_descuentos"])
api_router.include_router(bi_productividad.router, prefix="/bi-productividad", tags=["bi_productividad"])
api_router.include_router(bi_ejecutivo.router, prefix="/bi-ejecutivo", tags=["bi_ejecutivo"])
api_router.include_router(bi_ai.router, prefix="/bi-ai", tags=["bi_ai"])
api_router.include_router(saas_staff.router, prefix="/saas-staff", tags=["saas_staff"])
api_router.include_router(tenants.router, tags=["tenants"])
api_router.include_router(sucursales.router, tags=["sucursales"])
api_router.include_router(almacenes.router, prefix="/almacenes", tags=["almacenes"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(products.router, tags=["products"])
api_router.include_router(inventario.router, tags=["inventario"])
api_router.include_router(pedidos.router, tags=["pedidos"])
api_router.include_router(sales.router, tags=["sales"])
api_router.include_router(cotizaciones.router, tags=["cotizaciones"])
api_router.include_router(creditos.router, tags=["creditos"])
api_router.include_router(caja.router, prefix="/caja", tags=["caja"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(web_collections.router, tags=["web_collections"])
api_router.include_router(web_config.router, tags=["web_config"])
api_router.include_router(upload.router, tags=["upload"])
api_router.include_router(descuentos.router, prefix="/descuentos", tags=["descuentos"])
api_router.include_router(price_requests.router, tags=["price_requests"])
api_router.include_router(clientes.router, tags=["clientes"])
api_router.include_router(proveedores.router, tags=["proveedores"])
api_router.include_router(price_lists.router, prefix="/listas-precios", tags=["price_lists"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(contabilidad.router, prefix="/contabilidad", tags=["contabilidad"])
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
api_router.include_router(compras.router, prefix="/compras", tags=["compras"])
api_router.include_router(conteos_fisicos.router, prefix="/conteos-fisicos", tags=["conteos_fisicos"])
api_router.include_router(lotes.router, prefix="/lotes", tags=["lotes"])
api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["whatsapp"])
api_router.include_router(momentos_taboada.router, prefix="/momentos-taboada", tags=["momentos-taboada"])
api_router.include_router(momentos_taboada_wallet.router, prefix="/momentos-taboada/google-wallet", tags=["momentos-taboada-wallet"])
api_router.include_router(recordatorio.router, prefix="/recordatorios", tags=["recordatorios"])

api_router.include_router(dashboard_matriz.router, prefix="/dashboard-matriz", tags=["dashboard-matriz"])
api_router.include_router(catalogo.router)
api_router.include_router(system_monitor.router)
