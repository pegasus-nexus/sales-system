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

async def audit_phase6_inventory_sources():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE FUENTES Y CONCILIACIÓN MATEMÁTICA EN MONGODB — FASE 6")
    print("SECCIÓN BI N.º 6: INVENTARIO, VALORIZACIÓN Y CONTROL DE STOCK")
    print("=" * 90)

    # 1. AUDITORÍA EN MONGODB INVENTARIO
    total_inv_docs = await db.inventario.count_documents({})
    inv_docs = await db.inventario.find({}).to_list(length=10000)

    print(f"\n1. RESUMEN DE LA COLECCIÓN db.inventario ({total_inv_docs} documentos):")

    total_unidades_stock = 0.0
    skus_con_stock_set = set()
    skus_agotados_set = set()
    skus_stock_bajo_set = set() # cantidad <= 5 y > 0
    unidades_negativas_cnt = 0

    sucursales_stock_map = {} # sucursal_id -> {unidades, skus_set, agotados_cnt, bajo_cnt}
    product_stock_map = {}    # producto_id -> total_unidades

    for doc in inv_docs:
        pid = str(doc.get("producto_id", ""))
        suc_id = str(doc.get("sucursal_id", ""))
        qty = safe_float_audit(doc.get("cantidad"))

        if qty < 0:
            unidades_negativas_cnt += 1

        total_unidades_stock += qty
        product_stock_map[pid] = product_stock_map.get(pid, 0.0) + qty

        if qty > 0:
            skus_con_stock_set.add(pid)
        if qty <= 0:
            skus_agotados_set.add(pid)
        if 0 < qty <= 5:
            skus_stock_bajo_set.add(pid)

        if suc_id not in sucursales_stock_map:
            sucursales_stock_map[suc_id] = {
                "unidades": 0.0,
                "skus": set(),
                "agotados": 0,
                "stock_bajo": 0
            }

        sucursales_stock_map[suc_id]["unidades"] += qty
        sucursales_stock_map[suc_id]["skus"].add(pid)
        if qty <= 0:
            sucursales_stock_map[suc_id]["agotados"] += 1
        if 0 < qty <= 5:
            sucursales_stock_map[suc_id]["stock_bajo"] += 1

    print(f"   - Total Unidades de Stock Registradas: {total_unidades_stock:,.2f} un.")
    print(f"   - Productos Únicos con Registro de Inventario: {len(product_stock_map)} SKUs")
    print(f"   - SKUs con Stock Positivo (> 0): {len(skus_con_stock_set)} SKUs")
    print(f"   - SKUs Agotados (<= 0): {len(skus_agotados_set)} SKUs")
    print(f"   - SKUs con Stock Bajo (1 a 5 un.): {len(skus_stock_bajo_set)} SKUs")
    print(f"   - Registros de Inventario con Unidades Negativas: {unidades_negativas_cnt}")

    # 2. AUDITORÍA Y VALORIZACIÓN CON LA COLECCIÓN DB.PRODUCTS
    products_docs = await db.products.find({}).to_list(length=1000)
    print(f"\n2. AUDITORÍA DE PRODUCTOS Y VALORIZACIÓN DE INVENTARIO ({len(products_docs)} SKUs en db.products):")

    products_dict = {}
    for p in products_docs:
        p_id = str(p.get("_id"))
        costo = safe_float_audit(p.get("costo_producto"))
        precio = safe_float_audit(p.get("precio_venta"))
        desc = p.get("descripcion", "Sin nombre")
        cat_nom = p.get("categoria_nombre", "Sin Categoría")
        products_dict[p_id] = {
            "nombre": desc,
            "costo": costo,
            "precio": precio,
            "categoria": cat_nom
        }

    valorizacion_costo_total = 0.0
    valorizacion_precio_total = 0.0
    huerfanos_inv_cnt = 0

    for pid, qty in product_stock_map.items():
        p_info = products_dict.get(pid)
        if p_info:
            c_val = qty * p_info["costo"]
            p_val = qty * p_info["precio"]
            valorizacion_costo_total += c_val
            valorizacion_precio_total += p_val
        else:
            huerfanos_inv_cnt += 1

    print(f"   - Valorización del Inventario a PRECIO DE COSTO: Bs. {valorizacion_costo_total:,.2f}")
    print(f"   - Valorización del Inventario a PRECIO DE VENTA: Bs. {valorizacion_precio_total:,.2f}")
    print(f"   - Registros de Inventario Huérfanos (sin producto en db.products): {huerfanos_inv_cnt}")

    # 3. VALORIZACIÓN Y STOCK POR SUCURSAL
    sucursales_docs = await db.sucursales.find({}).to_list(length=100)
    sucursales_dict = {str(s["_id"]): s.get("nombre", "Sin Nombre") for s in sucursales_docs}

    print("\n3. DESGLOSE DE INVENTARIO Y VALORIZACIÓN POR SUCURSAL:")
    print(f"   {'sucursal_id':<26} | {'Nombre Sucursal':<25} | {'Unidades Stock':<15} | {'SKUs':<8} | {'Agotados':<8}")
    print("   " + "-" * 90)

    for suc_id, data in sucursales_stock_map.items():
        nom = sucursales_dict.get(suc_id, "NO ENCONTRADA EN DB")
        print(f"   {suc_id:<26} | {nom:<25} | {data['unidades']:>13,.2f} un | {len(data['skus']):<8} | {data['agotados']:<8}")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA FORENSE FASE 6")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase6_inventory_sources())
