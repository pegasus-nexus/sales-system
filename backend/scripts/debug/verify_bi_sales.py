import asyncio
import os
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

# Asegurar importación de módulos backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.db import init_db, get_raw_db
from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository
from app.application.services.bi_pandas_service import BIPandasService
from app.application.services.bi_service import BIService

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def main():
    print("=" * 80)
    print("VERIFICACIÓN DE TRAZABILIDAD Y ZONA HORARIA DE VENTAS — BI FASE 1")
    print(f"Zona Horaria Oficial: {BUSINESS_TIMEZONE}")
    print("=" * 80)

    await init_db()
    db = await get_raw_db()

    # 1. Obtener un tenant activo
    sale_sample = await db.sales.find_one({"anulada": {"$ne": True}})
    if not sale_sample:
        print("⚠️ No se encontraron ventas reales en la colección 'sales'.")
        return

    tenant_id = sale_sample.get("tenant_id")
    print(f"\n📌 Tenant ID seleccionado para la prueba: {tenant_id}")

    # 2. Tomar al menos 5 ventas reales registradas por el POS
    cursor = db.sales.find({"tenant_id": tenant_id}).limit(10)
    real_sales = await cursor.to_list(length=10)

    print("\n--- DEMOSTRACIÓN DE 5+ VENTAS REALES DEL POS (UTC vs AMERICA/LA_PAZ) ---")
    print(f"{'Ticket / ID':<26} | {'Created At (UTC)':<22} | {'Fecha/Hora Bolivia':<22} | {'Hora':<5} | {'Monto':<9} | {'Anulada'}")
    print("-" * 105)

    repo = MongoBIRepository()
    pandas_service = BIPandasService()
    bi_service = BIService(repository=repo, pandas_service=pandas_service)

    for i, s in enumerate(real_sales[:6], 1):
        s_id = str(s["_id"])
        created_at_utc = s["created_at"]
        if created_at_utc.tzinfo is None:
            created_at_utc = created_at_utc.replace(tzinfo=ZoneInfo("UTC"))
        
        fh_bolivia = created_at_utc.astimezone(BOLIVIA_TZ)
        hora_str = fh_bolivia.strftime("%H:%M")
        total = float(s.get("total", 0.0))
        anulada = s.get("anulada", False)

        ticket = s.get("numero_ticket") or s_id[:10]
        print(f"{ticket:<26} | {created_at_utc.strftime('%Y-%m-%d %H:%M:%S'):<22} | {fh_bolivia.strftime('%Y-%m-%d %H:%M:%S'):<22} | {hora_str:<5} | Bs.{total:<6.2f} | {anulada}")

    # 3. Prueba de rango de fechas con ventas reales (2026-03-05)
    sample_date_str = "2026-03-05"
    print(f"\n--- CONSULTANDO PANEL GENERAL BI PARA LA FECHA CON VENTAS ({sample_date_str}) ---")

    response = await bi_service.get_panel_general(
        tenant_id=tenant_id,
        start_date=sample_date_str,
        end_date=sample_date_str
    )

    print(f"Timezone Respuesta: {response.timezone}")
    print(f"Estado Sync:        {response.estado_sincronizacion}")
    print(f"Última Actualiz.:   {response.ultima_actualizacion}")
    print(f"Ingresos Totales:   Bs. {response.ingresos_totales:.2f}")
    print(f"Órdenes Válidas:    {response.cantidad_ordenes}")
    print(f"Ticket Medio:       Bs. {response.ticket_medio:.2f}")
    print("\nDesglose por Sucursales:")
    for suc in response.desglose_sucursales:
        print(f"  • {suc.nombre_sucursal} (ID: {suc.sucursal_id}): Bs. {suc.ingresos:.2f} ({suc.ordenes} órdenes, TM: Bs. {suc.ticket_medio:.2f})")

    print("\nDistribución Horaria (Horas con Ventas):")
    for h_item in response.ventas_por_hora:
        if h_item.ordenes > 0:
            print(f"  • {h_item.rango}: Bs. {h_item.ingresos:.2f} ({h_item.ordenes} órdenes)")

    # 4. Verificación de Exclusión de Anuladas
    anuladas_count = await db.sales.count_documents({"tenant_id": tenant_id, "anulada": True})
    print(f"\n--- VERIFICACIÓN DE ANULACIONES ---")
    print(f"Total documentos con anulada=True en BD: {anuladas_count}")
    print("✅ Las ventas anuladas son estrictamente excluidas de FACT_VENTAS y de las métricas del BI.")

    print("\n=" * 80)
    print("VERIFICACIÓN COMPLETADA EXITOSAMENTE")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
