import asyncio
import os
import sys
import time

from app.db import init_db
from scripts.debug.verify_security_eje1_suite import run_security_eje1_suite
from scripts.debug.verify_backup_restore_suite import run_backup_restore_eje2_suite
from scripts.debug.verify_mongodb_explain_eje3_suite import run_explain_eje3_suite
from scripts.debug.verify_observability_eje4_suite import run_observability_eje4_suite
from scripts.debug.verify_stress_eje5_suite import run_stress_eje5_suite
from scripts.debug.run_full_bi_regression_suite import run_full_bi_regression_suite


async def run_master_ci_cd_pipeline_gate():
    await init_db()

    print("=" * 100)
    print("🚀 MASTER PIPELINE GATE CI/CD — AUDITORÍA UNIFICADA DE HARDENING & SALIDA A PRODUCCIÓN")
    print("PEGASUS SALES SYSTEM — BASELINE FINAL CONGELADO PARA PRODUCCIÓN")
    print("=" * 100)

    t0_master = time.time()
    pipeline_summary = {}

    # -------------------------------------------------------------------------
    # GATE 1: SEGURIDAD, RBAC & TENANT ISOLATION (EJE 1)
    # -------------------------------------------------------------------------
    print("\n>>> EJECUTANDO GATE 1: AUDITORÍA DE SEGURIDAD & TENANT (EJE 1) <<<")
    try:
        await run_security_eje1_suite()
        pipeline_summary["Eje 1 - Seguridad & Tenant Isolation"] = "PASS 🏆"
    except Exception as e:
        pipeline_summary["Eje 1 - Seguridad & Tenant Isolation"] = f"FAIL ❌ ({str(e)})"

    # -------------------------------------------------------------------------
    # GATE 2: BACKUPS, RESTORE & ROLLBACK (EJE 2)
    # -------------------------------------------------------------------------
    print("\n>>> EJECUTANDO GATE 2: AUDITORÍA DE BACKUPS & RECUPERACIÓN DE DESASTRES (EJE 2) <<<")
    try:
        await run_backup_restore_eje2_suite()
        pipeline_summary["Eje 2 - Backups, Restore & Rollback"] = "PASS 🏆"
    except Exception as e:
        pipeline_summary["Eje 2 - Backups, Restore & Rollback"] = f"FAIL ❌ ({str(e)})"

    # -------------------------------------------------------------------------
    # GATE 3: EXPLAIN() MONGODB & ÍNDICES (EJE 3)
    # -------------------------------------------------------------------------
    print("\n>>> EJECUTANDO GATE 3: AUDITORÍA DE EXPLAIN() & ÍNDICES MONGODB (EJE 3) <<<")
    try:
        await run_explain_eje3_suite()
        pipeline_summary["Eje 3 - explain() & Índices MongoDB"] = "PASS 🏆"
    except Exception as e:
        pipeline_summary["Eje 3 - explain() & Índices MongoDB"] = f"FAIL ❌ ({str(e)})"

    # -------------------------------------------------------------------------
    # GATE 4: OBSERVABILIDAD & HEALTH CHECKS (EJE 4)
    # -------------------------------------------------------------------------
    print("\n>>> EJECUTANDO GATE 4: AUDITORÍA DE OBSERVABILIDAD & HEALTH (EJE 4) <<<")
    try:
        await run_observability_eje4_suite()
        pipeline_summary["Eje 4 - Observabilidad & Health Checks"] = "PASS 🏆"
    except Exception as e:
        pipeline_summary["Eje 4 - Observabilidad & Health Checks"] = f"FAIL ❌ ({str(e)})"

    # -------------------------------------------------------------------------
    # GATE 5: PRUEBAS ADVERSARIALES & ESTRÉS DE RED (EJE 5)
    # -------------------------------------------------------------------------
    print("\n>>> EJECUTANDO GATE 5: PRUEBAS ADVERSARIALES & ESTRÉS (EJE 5) <<<")
    try:
        await run_stress_eje5_suite()
        pipeline_summary["Eje 5 - Estrés & Pruebas Adversariales"] = "PASS 🏆"
    except Exception as e:
        pipeline_summary["Eje 5 - Estrés & Pruebas Adversariales"] = f"FAIL ❌ ({str(e)})"

    # -------------------------------------------------------------------------
    # GATE 6: BATERÍA DE REGRESIÓN DE LAS 10 FASES BI
    # -------------------------------------------------------------------------
    print("\n>>> EJECUTANDO GATE 6: REGRESIÓN BATERÍA 10/10 FASES BI <<<")
    try:
        await run_full_bi_regression_suite()
        pipeline_summary["Eje 6 - Regresión 10 Fases BI"] = "PASS 🏆"
    except Exception as e:
        pipeline_summary["Eje 6 - Regresión 10 Fases BI"] = f"FAIL ❌ ({str(e)})"

    elapsed_master_sec = round(time.time() - t0_master, 2)

    # -------------------------------------------------------------------------
    # INFORME FINAL Y VERDICTO DE SALIDA A PRODUCCIÓN (GO / NO-GO)
    # -------------------------------------------------------------------------
    all_passed = all("PASS" in status for status in pipeline_summary.values())

    print("\n" + "=" * 100)
    print("MATRIZ DE DEPLOYMENT Y PIPELINE UNIFICADO CI/CD — RESULTADO FINAL")
    print("=" * 100)
    for gate, res in pipeline_summary.items():
        print(f"  {gate:<48}: {res}")
    print("=" * 100)
    print(f"  Tiempo Total de Pipeline Gate: {elapsed_master_sec:.2f} segundos")
    print("=" * 100)

    if all_passed:
        print("\n🟢 VERDICTO FINAL: GO — EL SISTEMA CUMPLE CON EL 100% DE LOS CRITERIOS PARA SALIR A PRODUCCIÓN")
        sys.exit(0)
    else:
        print("\n🔴 VERDICTO FINAL: NO-GO — SE DETECTÓ AL MENOS UN FALLO EN EL PIPELINE DE DESPLIEGUE")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_master_ci_cd_pipeline_gate())
