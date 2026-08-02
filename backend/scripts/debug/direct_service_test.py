# -*- coding: utf-8 -*-
"""
Auditoría Estricta de Sucursales - Regla de Referencia Histórica (Heroínas 2024 para Recoleta y Calacoto en 2025)
Uso: python -X utf8 -m scripts.debug.direct_service_test
"""
import asyncio
import sys
from datetime import date

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

CASOS_AUDITORIA = [
    ("Heroinas", date(2026, 8, 1), 3407.50, 177.50, "Heroínas (Heroínas 2025 = 3,407.50 Bs, Heroínas 2024 = 177.50 Bs)"),
    ("Recoleta", date(2026, 8, 1),  177.50,   0.00, "Recoleta (2025 = Heroínas 2024 Ref: 177.50 Bs, 2024 = Sin registros: 0.00 Bs)"),
    ("Calacoto", date(2026, 8, 1),  177.50,   0.00, "Calacoto (2025 = Heroínas 2024 Ref: 177.50 Bs, 2024 = Sin registros: 0.00 Bs)"),
    (None,       date(2026, 8, 1), 3407.50, 177.50, "GLOBAL   (2025 = Heroínas 2025 = 3,407.50 Bs [1,066.50 artificial ignorado])"),
]

async def run():
    from app.db import init_db
    from app.services.hourly_multiyear_service import get_hourly_multiyear

    await init_db()

    print("=" * 85)
    print("AUDITORÍA DE REGLAS DE NEGOCIO (REFERENCIA HEROÍNAS 2024 PARA RECOLETA Y CALACOTO EN 2025)")
    print("=" * 85)

    all_passed = True

    for suc, f_ref, exp_a1, exp_a2, desc in CASOS_AUDITORIA:
        res = await get_hourly_multiyear(
            tenant_id=TENANT_ID,
            fecha_referencia=f_ref,
            sucursal=suc
        )

        meta = res.get("meta", {})
        suc_label = suc or "GLOBAL"

        total_real = meta.get("total_real", 0)
        total_a1   = meta.get("total_a1", 0)
        total_a2   = meta.get("total_a2", 0)
        is_ref     = meta.get("is_reference_a1", False)

        pass_a1 = abs(total_a1 - exp_a1) < 0.02
        pass_a2 = abs(total_a2 - exp_a2) < 0.02

        print(f"\n--- {desc} ---")
        print(f"  Sucursal:           {suc_label}")
        print(f"  Año 2026 (Real):     Total Backend: Bs. {total_real:>10.2f}")
        print(f"  Año 2025 (Año -1):   Total Backend: Bs. {total_a1:>10.2f} | Esperado: Bs. {exp_a1:>10.2f} | Ref: {is_ref} | {'PASS' if pass_a1 else 'FAIL'}")
        print(f"  Año 2024 (Año -2):   Total Backend: Bs. {total_a2:>10.2f} | Esperado: Bs. {exp_a2:>10.2f} | {'PASS' if pass_a2 else 'FAIL'}")

        if not (pass_a1 and pass_a2):
            all_passed = False

    print("\n" + "=" * 85)
    print(f"RESULTADO AUDITORÍA REGLAS DEFINITIVAS: {'✅ TODOS LOS CASOS PASAN 100%' if all_passed else '❌ FALLA EN AUDITORÍA'}")
    print("=" * 85)

if __name__ == "__main__":
    asyncio.run(run())
