import asyncio
import os
import sys
from collections import defaultdict

# Asegurar backend en path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.infrastructure.db import init_db
from app.domain.models.product import Product
from app.domain.models.inventario import Inventario
from app.domain.models.sale import Sale
from app.domain.models.tenant import Tenant

async def analyze_duplicates():
    print("=" * 75)
    print("🔍 ANÁLISIS EXHAUSTIVO DE DUPLICADOS EN PRODUCTOS E INVENTARIO")
    print("=" * 75)

    await init_db()

    tenants = await Tenant.find().to_list()
    print(f"Empresas / Tenants encontrados: {len(tenants)}\n")

    for t in tenants:
        tid = str(t.id)
        tname = t.name
        print("-" * 75)
        print(f"🏢 TENANT: {tname} (ID: {tid})")
        print("-" * 75)

        # 1. Analizar Productos
        products = await Product.find(Product.tenant_id == tid).to_list()
        print(f"📦 Total de productos registrados: {len(products)}")

        # Agrupar por descripción normalizada
        by_desc = defaultdict(list)
        by_code_corto = defaultdict(list)
        by_code_largo = defaultdict(list)

        for p in products:
            clean_desc = (p.descripcion or "").strip().lower()
            if clean_desc:
                by_desc[clean_desc].append(p)
            
            if p.codigo_corto:
                clean_cc = p.codigo_corto.strip().lower()
                by_code_corto[clean_cc].append(p)
                
            if p.codigo_largo:
                clean_cl = p.codigo_largo.strip().lower()
                by_code_largo[clean_cl].append(p)

        dup_desc = {k: v for k, v in by_desc.items() if len(v) > 1}
        dup_cc = {k: v for k, v in by_code_corto.items() if len(v) > 1}
        dup_cl = {k: v for k, v in by_code_largo.items() if len(v) > 1}

        print(f"   • Nombres/Descripciones duplicadas: {len(dup_desc)}")
        print(f"   • Códigos cortos duplicados: {len(dup_cc)}")
        if dup_cl:
            print("\n   ⚠️ DETALLE DE CÓDIGOS DE BARRA DUPLICADOS:")
            for cl, plist in dup_cl.items():
                print(f"   👉 Código de Barra: '{cl}' -> Usado en {len(plist)} productos:")
                for p in plist:
                    status = "ACTIVO" if getattr(p, 'is_active', True) else "INACTIVO"
                    print(f"      - {p.descripcion} (ID: {p.id}, Estado: {status})")

        if dup_desc:
            print("\n   ⚠️ DETALLE DE PRODUCTOS CON MISMO NOMBRE:")
            for desc, plist in dup_desc.items():
                print(f"\n   👉 Nombre: '{plist[0].descripcion}' ({len(plist)} registros):")
                for p in plist:
                    # Chequear inventario asociado
                    inv_items = await Inventario.find(
                        Inventario.tenant_id == tid,
                        Inventario.producto_id == str(p.id)
                    ).to_list()
                    total_stock = sum(i.cantidad for i in inv_items)

                    # Chequear si tiene ventas
                    sales_count = await Sale.find(
                        Sale.tenant_id == tid,
                        {"items.producto_id": str(p.id)}
                    ).count()

                    status = "ACTIVO" if getattr(p, 'is_active', True) else "INACTIVO"
                    print(f"      - ID: {p.id} | Código: {p.codigo_corto or 'N/A'} | Precio: Bs. {p.precio_venta} | Stock: {total_stock} u. en {len(inv_items)} almacenes | Ventas históricas: {sales_count} | Estado: {status}")

        if dup_cc:
            print("\n   ⚠️ DETALLE DE CÓDIGOS CORTOS DUPLICADOS:")
            for cc, plist in dup_cc.items():
                print(f"   👉 Código Corto: '{cc}' -> Usado en {len(plist)} productos: {[p.descripcion for p in plist]}")

        # 2. Analizar Inventario (Inconsistencias por Almacén)
        inventarios = await Inventario.find(Inventario.tenant_id == tid).to_list()
        print(f"\n📊 Registros de Inventario (Kardex por Almacén): {len(inventarios)}")

        # Detectar duplicados en la tupla (sucursal_id, almacen_id, producto_id)
        by_location_prod = defaultdict(list)
        for inv in inventarios:
            key = (inv.sucursal_id, getattr(inv, 'almacen_id', 'default'), inv.producto_id)
            by_location_prod[key].append(inv)

        dup_inv_rows = {k: v for k, v in by_location_prod.items() if len(v) > 1}
        print(f"   • Registros duplicados en el MISMO almacén para un mismo producto: {len(dup_inv_rows)}")

        if dup_inv_rows:
            print("   ⚠️ ATENCIÓN: Se encontraron filas duplicadas en inventario para la misma ubicación:")
            for (suc_id, alm_id, prod_id), rows in dup_inv_rows.items():
                prod = next((p for p in products if str(p.id) == prod_id), None)
                pname = prod.descripcion if prod else f"ID: {prod_id}"
                quantities = [r.cantidad for r in rows]
                print(f"      - Producto: {pname} | Sucursal: {suc_id} | Almacén: {alm_id} | {len(rows)} filas con cantidades: {quantities}")

        # Detectar registros huérfanos en inventario
        prod_ids = {str(p.id) for p in products}
        orphans = [inv for inv in inventarios if inv.producto_id not in prod_ids]
        print(f"   • Registros de inventario huérfanos (producto eliminado de base de datos): {len(orphans)}")
        if orphans:
            for o in orphans[:5]:
                print(f"      - Inventario ID: {o.id} | Producto ID inexistente: {o.producto_id} | Cantidad: {o.cantidad}")
            if len(orphans) > 5:
                print(f"      ... y {len(orphans) - 5} más.")

        print("\n")

if __name__ == "__main__":
    asyncio.run(analyze_duplicates())
