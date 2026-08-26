import asyncio
import json
from bson import Decimal128, ObjectId
from app.db import init_db, get_raw_db

def bson_default(obj):
    if isinstance(obj, Decimal128):
        return float(obj.to_decimal())
    if isinstance(obj, ObjectId):
        return str(obj)
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)

async def audit_mongodb_products_structure():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("PASO 3 DEL PROTOCOLO — AUDITORÍA FORENSE EN MONGODB REAL")
    print("SECCIÓN BI N.º 3: RENDIMIENTO DE PRODUCTOS Y CATEGORÍAS")
    print("=" * 90)

    # 1. LISTAR TODAS LAS COLECCIONES EXISTENTES EN LA BASE DE DATOS
    collections = await db.list_collection_names()
    print(f"\n1. COLECCIONES EXISTENTES EN MONGODB ({len(collections)}):")
    for c in sorted(collections):
        print(f"  - {c}")

    # 2. AUDITORÍA DE ESTRUCTURA DE ITEMS EN MONGODB SALES (25/08/2026)
    # Rango UTC semiabierto para 2026-08-25 en America/La_Paz: [2026-08-25 04:00:00Z, 2026-08-26 04:00:00Z)
    from datetime import datetime, timezone
    start_utc = datetime(2026, 8, 25, 4, 0, 0, tzinfo=timezone.utc)
    end_utc = datetime(2026, 8, 26, 4, 0, 0, tzinfo=timezone.utc)

    query = {
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "anulada": {"$ne": True}
    }

    cursor = db.sales.find(query)
    sales_docs = await cursor.to_list(length=1000)

    total_tickets = len(sales_docs)
    total_sales_sum = sum(
        float(doc["total"].to_decimal()) if isinstance(doc.get("total"), Decimal128)
        else float(doc.get("total") or 0.0)
        for doc in sales_docs
    )

    print("\n2. CONFIRMACIÓN DE SALES PARA 25/08/2026:")
    print(f"  - Conteo de Tickets Válidos: {total_tickets} (Esperado: 67)")
    print(f"  - Suma Total de Ventas: Bs. {total_sales_sum:,.2f} (Esperado: Bs. 2,653.00)")

    if sales_docs:
        sample_doc = sales_docs[0]
        items = sample_doc.get("items", [])
        print("\n3. MUESTRA REAL DE UN DOCUMENTO SALES.ITEMS[]:")
        print(f"  - Ticket ID: {sample_doc.get('_id')}")
        print(f"  - Conteo de ítems en este ticket: {len(items)}")
        if items:
            print("  - Estructura del primer item:")
            print(json.dumps(items[0], indent=4, default=bson_default))

    # 4. AUDITORÍA DE CAMPOS REALES Y SUMATORIA DE ITEMS
    all_item_fields = set()
    total_items_count = 0
    total_subtotal_sum = 0.0
    items_with_product_id = 0
    items_without_product_id = 0
    product_ids_set = set()

    for s in sales_docs:
        s_items = s.get("items", [])
        for item in s_items:
            total_items_count += 1
            all_item_fields.update(item.keys())

            pid = item.get("product_id") or item.get("producto_id") or item.get("id")
            if pid:
                items_with_product_id += 1
                product_ids_set.add(str(pid))
            else:
                items_without_product_id += 1

            # Subtotal real del item
            subt = item.get("subtotal") or item.get("total")
            if isinstance(subt, Decimal128):
                subt_val = float(subt.to_decimal())
            else:
                subt_val = float(subt or 0.0)
            total_subtotal_sum += subt_val

    print("\n4. ANÁLISIS FORENSE DE SALES.ITEMS[]:")
    print(f"  - Nombres exactos de campos en items[]: {sorted(list(all_item_fields))}")
    print(f"  - Total de ítems individuales procesados: {total_items_count}")
    print(f"  - Ítems con product_id identificable: {items_with_product_id}")
    print(f"  - Ítems sin product_id: {items_without_product_id}")
    print(f"  - SUM(FACT_SALES_ITEMS.subtotal): Bs. {total_subtotal_sum:,.2f}")
    print(f"  - SUM(sales.total): Bs. {total_sales_sum:,.2f}")
    print(f"  - Diferencia (SUM sales.total - SUM items.subtotal): Bs. {total_sales_sum - total_subtotal_sum:,.2f}")

    # 5. AUDITORÍA DE LA COLECCIÓN VERDADERA DE PRODUCTOS Y CATEGORÍAS
    prob_cols = [c for c in collections if "product" in c or "cat" in c or "item" in c]
    print(f"\n5. INVESTIGACIÓN DE COLECCIONES RELACIONADAS ({prob_cols}):")

    for col_name in prob_cols:
        count = await db[col_name].count_documents({})
        sample = await db[col_name].find_one()
        print(f"\n  📁 Colección '{col_name}' (Total Documentos: {count}):")
        if sample:
            print("    - Claves disponibles:", list(sample.keys()))
            print("    - Muestra documento:", json.dumps(sample, indent=6, default=bson_default)[:400] + "...")

    # 6. INTEGRIDAD REFERENCIAL ENTRE PRODUCT_IDS DE SALES Y COLECCIÓN PRODUCTOS
    target_prod_col = "products" if "products" in collections else ("productos" if "productos" in collections else None)
    target_cat_col = "categories" if "categories" in collections else ("categorias" if "categorias" in collections else None)

    print(f"\n6. INTEGRIDAD REFERENCIAL DE PRODUCT_IDS:")
    print(f"  - Colección Productos Detectada: '{target_prod_col}'")
    print(f"  - Colección Categorías Detectada: '{target_cat_col}'")

    if target_prod_col:
        matched_products = 0
        unmatched_products = 0
        category_ids_found = set()

        for pid_str in product_ids_set:
            p_doc = None
            try:
                p_doc = await db[target_prod_col].find_one({"_id": ObjectId(pid_str)})
            except Exception:
                pass
            if not p_doc:
                p_doc = await db[target_prod_col].find_one({"_id": pid_str})

            if p_doc:
                matched_products += 1
                cat_id = p_doc.get("category_id") or p_doc.get("categoria_id")
                if cat_id:
                    category_ids_found.add(str(cat_id))
            else:
                unmatched_products += 1

        print(f"  - Product IDs únicos en ventas: {len(product_ids_set)}")
        print(f"  - Product IDs encontrados en '{target_prod_col}': {matched_products}")
        print(f"  - Product IDs huérfanos (no en '{target_prod_col}'): {unmatched_products}")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA DE MONGODB DE LA FASE 3")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_mongodb_products_structure())
