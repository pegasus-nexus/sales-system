import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db
from app.domain.models.tenant import Tenant
from app.domain.models.sucursal import Sucursal
from app.domain.models.sale import Sale
from app.application.services.reporting_service import ConsolidatedReportingService
from app.utils.date_utils import BOLIVIA_TZ

async def migrate_historical_summaries():
    print("Iniciando migración histórica de resúmenes diarios (Snapshots/BI)...")
    await init_db()
    
    # Obtener todas las sucursales
    sucursales = await Sucursal.find_all().to_list()
    
    total_processed = 0
    for sucursal in sucursales:
        tenant_id = sucursal.tenant_id
        sucursal_id = str(sucursal.id)
        
        print(f"\nProcesando Sucursal: {sucursal.nombre} ({sucursal_id})")
        
        # Encontrar la primera y última venta para establecer el rango de fechas
        primera_venta = await Sale.find(Sale.sucursal_id == sucursal_id).sort(+Sale.created_at).limit(1).to_list()
        ultima_venta = await Sale.find(Sale.sucursal_id == sucursal_id).sort(-Sale.created_at).limit(1).to_list()
        
        if not primera_venta or not ultima_venta:
            print("  No hay ventas, saltando.")
            continue
            
        start_date = primera_venta[0].created_at.astimezone(BOLIVIA_TZ).date()
        end_date = ultima_venta[0].created_at.astimezone(BOLIVIA_TZ).date()
        
        # Generar snapshot por cada día en el rango
        current_date = start_date
        while current_date <= end_date:
            fecha_str = current_date.strftime("%Y-%m-%d")
            
            # Chequear si hubo alguna venta ese día para no crear snapshots vacíos innecesarios
            # (Aunque crearlos igual está bien para tener el registro de días con 0 ventas)
            
            await ConsolidatedReportingService.generate_daily_snapshot(
                tenant_id=tenant_id,
                sucursal_id=sucursal_id,
                fecha=fecha_str,
                es_definitivo=True,
                generado_por_id="MIGRATION_SCRIPT"
            )
            print(f"  - Generado snapshot para {fecha_str}")
            total_processed += 1
            
            current_date += timedelta(days=1)
            
    print(f"\n¡Migración finalizada! Total días procesados: {total_processed}")

if __name__ == "__main__":
    asyncio.run(migrate_historical_summaries())
