import asyncio
import pandas as pd
from zoneinfo import ZoneInfo
from app.db import init_db, get_raw_db
from app.domain.models.user import User
from app.application.services.sales_read_service import SalesReadService, safe_float
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def test_financial_margin():
    await init_db()
    db = await get_raw_db()
    
    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not admin_user:
        print("User admin not found")
        return

    # Probar para el día anterior (2026-08-26)
    sales = await SalesReadService.get_raw_sales_for_user(
        user=admin_user,
        start_date_str="2026-08-26",
        end_date_str="2026-08-26",
        sucursal_id="all"
    )

    products_cursor = db.products.find({})
    products = await products_cursor.to_list(length=None)
    prod_map = {str(p["_id"]): p for p in products}

    total_publico = 0.0
    comision_matriz_total = 0.0
    margen_retail_total = 0.0
    costos_directos_otros = 0.0

    for s in sales:
        items = s.get("items", [])
        for item in items:
            pid = str(item.get("producto_id") or item.get("product_id") or "")
            qty = safe_float(item.get("cantidad") or item.get("quantity"))
            price = safe_float(item.get("precio_unitario") or item.get("price"))
            subtotal = safe_float(item.get("subtotal") or (qty * price))
            costo_u_item = safe_float(item.get("costo_unitario") or item.get("costo"))

            prod_doc = prod_map.get(pid, {})
            nombre_prod = str(prod_doc.get("nombre") or item.get("descripcion") or "").upper()
            proveedor = str(prod_doc.get("proveedor") or "").upper()
            costo_base_prod = safe_float(prod_doc.get("costo_base") or prod_doc.get("costo") or costo_u_item)

            total_publico += subtotal

            is_taboada = ("TABOADA" in nombre_prod) or ("TABOADA" in proveedor)

            if is_taboada:
                comision = subtotal * 0.15
                costo_fabrica = subtotal * 0.85
                margen_retail = subtotal - costo_fabrica
                
                comision_matriz_total += comision
                margen_retail_total += margen_retail
            else:
                costo_linea = qty * costo_base_prod
                costos_directos_otros += costo_linea
                margen_retail = subtotal - costo_linea
                margen_retail_total += margen_retail

    margen_liquido_total = comision_matriz_total + margen_retail_total - costos_directos_otros
    rentabilidad_pct = (margen_liquido_total / total_publico * 100.0) if total_publico > 0 else 0.0

    print("=" * 80)
    print(f"FECHA CONSULTADA              : 2026-08-26 (Ayer)")
    print(f"VENTAS PÚBLICAS TOTALES      : Bs. {total_publico:,.2f}")
    print(f"COMISIÓN MATRIZ (15% TABOADA): Bs. {comision_matriz_total:,.2f}")
    print(f"MARGEN RETAIL                : Bs. {margen_retail_total:,.2f}")
    print(f"MARGEN LÍQUIDO TOTAL         : Bs. {margen_liquido_total:,.2f}")
    print(f"RENTABILIDAD CONTABLE (%)    : {rentabilidad_pct:.2f}%")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_financial_margin())
