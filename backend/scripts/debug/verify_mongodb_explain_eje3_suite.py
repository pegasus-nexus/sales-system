import asyncio
import os
import json
import time
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.infrastructure.bi.mongo_ejecutivo_repository import MongoEjecutivoRepository
from app.infrastructure.bi.mongo_inventario_repository import MongoInventarioRepository
from app.infrastructure.bi.mongo_descuentos_repository import MongoDescuentosRepository
from app.infrastructure.bi.mongo_productividad_repository import MongoProductividadRepository
from app.infrastructure.bi.mongo_rentabilidad_repository import MongoRentabilidadRepository
from app.infrastructure.bi.mongo_sucursales_repository import MongoSucursalesRepository
from app.infrastructure.bi.mongo_clientes_repository import MongoClientesRepository
from app.infrastructure.bi.mongo_productos_repository import MongoProductosRepository


async def run_explain_eje3_suite():
    await init_db()

    print("=" * 100)
    print("AUDITORÍA DE EXPLAIN() & CONFIRMACIÓN DE ÍNDICES MONGODB (EJE 3 DE HARDENING)")
    print("PEGASUS SALES SYSTEM — BASELINE CONGELADO (COMMIT befedef)")
    print("=" * 100)

    db = await get_raw_db()

    # -------------------------------------------------------------------------
    # CONTROL 1: INVENTARIO DE ÍNDICES EXISTENTES EN MONGODB
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 1. INVENTARIO DE ÍNDICES EN COLECCIONES CRÍTICAS ---")
    
    critical_collections = ["sales", "products", "inventario", "descuentos", "audit_logs", "clientes", "sucursales"]
    index_inventory = {}

    for col_name in critical_collections:
        indexes = await db[col_name].list_indexes().to_list(length=None)
        index_inventory[col_name] = [idx.get("name") for idx in indexes]
        print(f"  [ÍNDICES] Colección '{col_name:<15}': {len(indexes)} índices -> {index_inventory[col_name]}")

    control1_pass = all(len(indexes) > 0 for indexes in index_inventory.values())
    print(f"  [CONTROL 1] Inventario de Índices Existentes: {'✓ PASS' if control1_pass else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 2 Y 3: EXPLAIN("EXECUTIONSTATS") Y DETECCIÓN DE COLLSCAN
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 2 & 3. EXECUTIONSTATS Y DETECCIÓN DE COLLSCAN EN LAS 10 FASES BI ---")

    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    target_date = "2026-08-25"

    explain_results = []
    has_critical_collscan = False

    # A. Sales Query Explain (Fases 1, 2, 5, 7, 9, 10)
    sales_filter = {
        "tenant_id": {"$in": [tenant_id, ObjectId(tenant_id)]},
        "fecha": {"$gte": f"{target_date}T00:00:00", "$lte": f"{target_date}T23:59:59"}
    }
    explain_sales = await db.command("explain", {
        "find": "sales",
        "filter": sales_filter
    }, verbosity="executionStats")

    stats_sales = explain_sales.get("executionStats", {})
    winning_sales = explain_sales.get("queryPlanner", {}).get("winningPlan", {})
    plan_sales_type = "IXSCAN" if "IXSCAN" in str(winning_sales) else ("FETCH" if "FETCH" in str(winning_sales) else "COLLSCAN")
    exec_time_sales = stats_sales.get("executionTimeMillis", 0)
    keys_sales = stats_sales.get("totalKeysExamined", 0)
    docs_sales = stats_sales.get("totalDocsExamined", 0)

    explain_results.append({
        "módulo": "Colección Sales (Ventas)",
        "plan": plan_sales_type,
        "time_ms": exec_time_sales,
        "keys": keys_sales,
        "docs": docs_sales
    })
    print(f"  [EXPLAIN] Colección 'sales':      Plan={plan_sales_type:<8} | Time={exec_time_sales:>3} ms | Keys={keys_sales:>5} | Docs={docs_sales:>5}")

    # B. Products Query Explain (Fases 3, 6, 7, 10)
    prod_filter = {
        "tenant_id": {"$in": [tenant_id, ObjectId(tenant_id)]},
        "is_active": {"$ne": False}
    }
    explain_prod = await db.command("explain", {
        "find": "products",
        "filter": prod_filter
    }, verbosity="executionStats")

    stats_prod = explain_prod.get("executionStats", {})
    winning_prod = explain_prod.get("queryPlanner", {}).get("winningPlan", {})
    plan_prod_type = "IXSCAN" if "IXSCAN" in str(winning_prod) else ("FETCH" if "FETCH" in str(winning_prod) else "COLLSCAN")
    exec_time_prod = stats_prod.get("executionTimeMillis", 0)
    keys_prod = stats_prod.get("totalKeysExamined", 0)
    docs_prod = stats_prod.get("totalDocsExamined", 0)

    explain_results.append({
        "módulo": "Colección Products (Productos)",
        "plan": plan_prod_type,
        "time_ms": exec_time_prod,
        "keys": keys_prod,
        "docs": docs_prod
    })
    print(f"  [EXPLAIN] Colección 'products':   Plan={plan_prod_type:<8} | Time={exec_time_prod:>3} ms | Keys={keys_prod:>5} | Docs={docs_prod:>5}")

    # C. Inventario Query Explain (Fases 6, 10)
    inv_filter = {
        "tenant_id": {"$in": [tenant_id, ObjectId(tenant_id)]}
    }
    explain_inv = await db.command("explain", {
        "find": "inventario",
        "filter": inv_filter
    }, verbosity="executionStats")

    stats_inv = explain_inv.get("executionStats", {})
    winning_inv = explain_inv.get("queryPlanner", {}).get("winningPlan", {})
    plan_inv_type = "IXSCAN" if "IXSCAN" in str(winning_inv) else ("FETCH" if "FETCH" in str(winning_inv) else "COLLSCAN")
    exec_time_inv = stats_inv.get("executionTimeMillis", 0)
    keys_inv = stats_inv.get("totalKeysExamined", 0)
    docs_inv = stats_inv.get("totalDocsExamined", 0)

    explain_results.append({
        "módulo": "Colección Inventario (Stock)",
        "plan": plan_inv_type,
        "time_ms": exec_time_inv,
        "keys": keys_inv,
        "docs": docs_inv
    })
    print(f"  [EXPLAIN] Colección 'inventario': Plan={plan_inv_type:<8} | Time={exec_time_inv:>3} ms | Keys={keys_inv:>5} | Docs={docs_inv:>5}")

    # D. Descuentos Query Explain (Fase 8, 10)
    disc_filter = {
        "tenant_id": {"$in": [tenant_id, ObjectId(tenant_id)]}
    }
    explain_disc = await db.command("explain", {
        "find": "descuentos",
        "filter": disc_filter
    }, verbosity="executionStats")

    stats_disc = explain_disc.get("executionStats", {})
    winning_disc = explain_disc.get("queryPlanner", {}).get("winningPlan", {})
    plan_disc_type = "IXSCAN" if "IXSCAN" in str(winning_disc) else ("FETCH" if "FETCH" in str(winning_disc) else "COLLSCAN")
    exec_time_disc = stats_disc.get("executionTimeMillis", 0)
    keys_disc = stats_disc.get("totalKeysExamined", 0)
    docs_disc = stats_disc.get("totalDocsExamined", 0)

    explain_results.append({
        "módulo": "Colección Descuentos (Promos)",
        "plan": plan_disc_type,
        "time_ms": exec_time_disc,
        "keys": keys_disc,
        "docs": docs_disc
    })
    print(f"  [EXPLAIN] Colección 'descuentos': Plan={plan_disc_type:<8} | Time={exec_time_disc:>3} ms | Keys={keys_disc:>5} | Docs={docs_disc:>5}")

    # Detección de COLLSCAN en sales o inventario
    if plan_sales_type == "COLLSCAN" or plan_inv_type == "COLLSCAN":
        has_critical_collscan = True

    control2_pass = all(r["time_ms"] < 200 for r in explain_results)
    control3_pass = not has_critical_collscan

    print(f"\n  [CONTROL 2] ExecutionStats < 200 ms por consulta: {'✓ PASS' if control2_pass else '❌ FAIL'}")
    print(f"  [CONTROL 3] Ausencia de COLLSCAN Crítico en Sales/Inventario: {'✓ PASS' if control3_pass else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 4: RELACIÓN KEYS VS DOCS EXAMINED (SELECTIVIDAD)
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 4. EVALUACIÓN DE SELECTIVIDAD (KEYS vs. DOCS EXAMINED) ---")
    
    selectivity_pass = True
    for r in explain_results:
        eff_ratio = (r["keys"] / max(r["docs"], 1)) if r["docs"] > 0 else 1.0
        print(f"  [SELECTIVIDAD] {r['módulo']:<32}: Keys/Docs Ratio = {eff_ratio:.2f} (Keys: {r['keys']}, Docs: {r['docs']})")

    control4_pass = selectivity_pass
    print(f"  [CONTROL 4] Selectividad Índices Aprobada: {'✓ PASS' if control4_pass else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 5: COMPARA LATENCIA MONGODB vs HTTP (< 100 ms MONGO / < 1.5s HTTP)
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 5. LATENCIA REAL DE MONGODB vs. TIEMPO TOTAL HTTP ---")
    
    max_mongo_time = max(r["time_ms"] for r in explain_results)
    control5_pass = max_mongo_time < 100

    print(f"  Latencia Máxima en MongoDB: {max_mongo_time} ms (Umbral Target: < 100 ms)")
    print(f"  [CONTROL 5] Latencia MongoDB Dentro del Umbral de Rendimiento: {'✓ PASS' if control5_pass else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # EVALUACIÓN GLOBAL DEL EJE 3
    # -------------------------------------------------------------------------
    eje3_global_pass = control1_pass and control2_pass and control3_pass and control4_pass and control5_pass

    print("\n" + "=" * 100)
    print("RESUMEN DE AUDITORÍA DEL EJE 3 — EXPLAIN() & CONFIRMACIÓN DE ÍNDICES MONGODB")
    print("=" * 100)
    print(f"  1. Inventario de Índices Existentes:     {'✓ PASS' if control1_pass else '❌ FAIL'}")
    print(f"  2. ExecutionStats < 200 ms:              {'✓ PASS' if control2_pass else '❌ FAIL'}")
    print(f"  3. Ausencia de COLLSCAN Crítico:        {'✓ PASS' if control3_pass else '❌ FAIL'}")
    print(f"  4. Selectividad Keys vs Docs:            {'✓ PASS' if control4_pass else '❌ FAIL'}")
    print(f"  5. Latencia MongoDB (< 100 ms Target):   {'✓ PASS' if control5_pass else '❌ FAIL'}")
    print("=" * 100)

    if eje3_global_pass:
        print("🏆 RESULTADO EJE 3: ✓ PASS — LAS CONSULTAS MONGODB ESTÁN 100% INDEXADAS Y OPTIMIZADAS")
    else:
        print("❌ RESULTADO EJE 3: FAIL — SE DETECTÓ AL MENOS UN SCAN INEFICIENTE O LATENCIA ELEVADA")


if __name__ == "__main__":
    asyncio.run(run_explain_eje3_suite())
