import asyncio
import json
from bson import Decimal128, ObjectId
from app.db import init_db, get_raw_db

def safe_float_audit(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, Decimal128):
        return float(val.to_decimal())
    if hasattr(val, "to_decimal"):
        try:
            return float(val.to_decimal())
        except Exception:
            pass
    try:
        return float(val)
    except Exception:
        return 0.0

async def audit_phase7_profitability():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE FUENTES REALES Y CONCILIACIÓN MATEMÁTICA EN MONGODB — FASE 7")
    print("SECCIÓN BI N.º 7: RENTABILIDAD TEÓRICA & MARGEN BRUTO")
    print("=" * 90)

    # 1. INSPECCIÓN DE VENTAS DEL 25/08/2026
    from datetime import datetime, timezone
    start_utc = datetime(2026, 8, 25, 4, 0, 0, tzinfo=timezone.utc)
    end_utc = datetime(2026, 8, 26, 4, 0, 0, tzinfo=timezone.utc)

    query = {
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "anulada": {"$ne": True}
    }

    cursor = db.sales.find(query)
    sales_docs = await cursor.to_list(length=1000)

    total_sales_sum = sum(safe_float_audit(doc.get("total")) for doc in sales_docs)
    total_tickets_cnt = len(sales_docs)

    print(f"\n1. RESUMEN BASE DE VENTAS DEL 25/08/2026:")
    print(f"   - Total Tickets Válidos: {total_tickets_cnt}")
    print(f"   - Suma SUM(sales.total): Bs. {total_sales_sum:,.2f}")

    # 2. AUDITORÍA DE PRODUCTOS Y COSTOS MAESTRO EN db.products
    products_docs = await db.products.find({}).to_list(length=1000)
    products_cost_map = {}
    for p in products_docs:
        p_id = str(p.get("_id"))
        c_val = safe_float_audit(p.get("costo_producto"))
        desc = p.get("descripcion", "Sin nombre")
        cat_nom = p.get("categoria_nombre", "Sin Categoría")
        products_cost_map[p_id] = {
            "costo": c_val,
            "nombre": desc,
            "categoria": cat_nom
        }

    # 3. DESGLOSE LÍNEA POR LÍNEA EN sales.items[]
    total_ingresos_items = 0.0
    total_costo_items = 0.0
    total_lineas_cnt = 0
    items_sin_costo_cnt = 0

    profit_by_product = {}
    profit_by_category = {}

    for s in sales_docs:
        items = s.get("items") or []
        for item in items:
            total_lineas_cnt += 1
            pid = str(item.get("producto_id") or item.get("product_id") or "")
            qty = safe_float_audit(item.get("cantidad") or item.get("quantity"))
            price = safe_float_audit(item.get("precio_unitario") or item.get("price"))
            subt = safe_float_audit(item.get("subtotal") or (qty * price))

            # Obtener costo unitario: primero del item si existe, si no del mapa maestro db.products
            costo_u = safe_float_audit(item.get("costo_unitario") or item.get("costo"))
            p_master = products_cost_map.get(pid)

            if costo_u <= 0 and p_master:
                costo_u = p_master["costo"]

            if costo_u <= 0:
                items_sin_costo_cnt += 1

            costo_linea = qty * costo_u
            margen_linea = subt - costo_linea

            total_ingresos_items += subt
            total_costo_items += costo_linea

            # Agrupación por producto
            prod_nombre = p_master["nombre"] if p_master else item.get("descripcion", "Producto Sin Nombre")
            cat_nombre = p_master["categoria"] if p_master else "Sin Categoría"

            if pid not in profit_by_product:
                profit_by_product[pid] = {
                    "nombre": prod_nombre,
                    "categoria": cat_nombre,
                    "unidades": 0.0,
                    "ingresos": 0.0,
                    "costos": 0.0,
                    "margen_bs": 0.0
                }

            profit_by_product[pid]["unidades"] += qty
            profit_by_product[pid]["ingresos"] += subt
            profit_by_product[pid]["costos"] += costo_linea
            profit_by_product[pid]["margen_bs"] += margen_linea

            # Agrupación por categoría
            if cat_nombre not in profit_by_category:
                profit_by_category[cat_nombre] = {
                    "ingresos": 0.0,
                    "costos": 0.0,
                    "margen_bs": 0.0
                }

            profit_by_category[cat_nombre]["ingresos"] += subt
            profit_by_category[cat_nombre]["costos"] += costo_linea
            profit_by_category[cat_nombre]["margen_bs"] += margen_linea

    margen_bruto_global_bs = round(total_ingresos_items - total_costo_items, 2)
    margen_bruto_global_pct = round((margen_bruto_global_bs / total_ingresos_items * 100.0), 2) if total_ingresos_items > 0 else 0.0

    print("\n2. CONCILIACIÓN MATEMÁTICA DE RENTABILIDAD TEÓRICA Y MARGEN BRUTO (25/08/2026):")
    print(f"   - Total Líneas de Ítems Procesadas: {total_lineas_cnt}")
    print(f"   - Ítems sin Costo Registrado: {items_sin_costo_cnt}")
    print(f"   - Ingresos Totales (SUM subtotal): Bs. {total_ingresos_items:,.2f}")
    print(f"   - Costo Total de Ventas:           Bs. {total_costo_items:,.2f}")
    print(f"   - MARGEN BRUTO TEÓRICO GLOBAL (Bs.): Bs. {margen_bruto_global_bs:,.2f}")
    print(f"   - MARGEN BRUTO TEÓRICO GLOBAL (%):   {margen_bruto_global_pct}%")

    print("\n3. DESGLOSE DE RENTABILIDAD POR CATEGORÍA:")
    print(f"   {'Categoría':<22} | {'Ingresos (Bs.)':<15} | {'Costos (Bs.)':<15} | {'Margen Bruto (Bs.)':<18} | {'Margen %':<10}")
    print("   " + "-" * 88)

    for cat_name, c_data in sorted(profit_by_category.items(), key=lambda x: x[1]["margen_bs"], reverse=True):
        m_bs = round(c_data["margen_bs"], 2)
        m_pct = round((m_bs / c_data["ingresos"] * 100.0), 2) if c_data["ingresos"] > 0 else 0.0
        c_name_str = str(cat_name or "Sin Categoría")
        print(f"   {c_name_str:<22} | Bs. {c_data['ingresos']:>11,.2f} | Bs. {c_data['costos']:>11,.2f} | Bs. {m_bs:>14,.2f} | {m_pct:>7.2f}%")

    print("\n" + "=" * 90)
    print("EVALUACIÓN DE LA CONCILIACIÓN MATEMÁTICA CON sales.total")
    print("=" * 90)
    print(f"  SUM(sales.items[].subtotal) == SUM(sales.total) : Bs. {total_ingresos_items:,.2f} == Bs. {total_sales_sum:,.2f} -> {'✓ PASÓ' if total_ingresos_items == total_sales_sum else '❌ FALLÓ'}")
    print(f"  Diferencia Exacta: Bs. {total_sales_sum - total_ingresos_items:,.2f}")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA FORENSE FASE 7")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase7_profitability())
