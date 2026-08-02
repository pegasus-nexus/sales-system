import asyncio
import logging
from datetime import datetime, timedelta
from app.db import get_raw_db
from app.domain.models.sucursal import Sucursal
from app.domain.models.daily_summary import DailySalesSummary
from app.application.services.reporting_service import ConsolidatedReportingService
from app.utils.date_utils import BOLIVIA_TZ, get_day_range_bolivia

logger = logging.getLogger(__name__)

async def run_nightly_seal():
    """
    Se ejecuta de madrugada (ej. 00:15) y verifica el día de ayer.
    Para cada sucursal, si no existe el DailySalesSummary (porque no cerraron caja),
    lo genera automáticamente para asegurar que el BI esté al 100%.
    """
    logger.info("=== Iniciando Job de Auto-Sellado Nocturno (Nightly Seal) ===")
    
    # "Ayer" en Bolivia
    now_bo = datetime.now(BOLIVIA_TZ)
    ayer_bo = now_bo - timedelta(days=1)
    fecha_ayer_str = ayer_bo.strftime("%Y-%m-%d")
    
    start_dt, end_dt = get_day_range_bolivia(fecha_ayer_str)
    
    db = await get_raw_db()
    
    sucursales = await Sucursal.find_all().to_list()
    
    procesados = 0
    omitidos = 0
    
    for suc in sucursales:
        suc_id = str(suc.id)
        tenant_id = suc.tenant_id
        
        # Verificar si existe el snapshot
        snapshot = await DailySalesSummary.find_one(
            DailySalesSummary.tenant_id == tenant_id,
            DailySalesSummary.sucursal_id == suc_id,
            DailySalesSummary.fecha == fecha_ayer_str
        )
        
        if snapshot and snapshot.es_definitivo:
            omitidos += 1
            continue
            
        # Si no existe, revisar si hubo ventas
        # (Para no crear snapshots vacíos si la sucursal no operó)
        ventas_count = await db.sales.count_documents({
            "tenant_id": tenant_id,
            "sucursal_id": suc_id,
            "created_at": {"$gte": start_dt, "$lte": end_dt}
        })
        
        if ventas_count > 0:
            logger.info(f"Generando snapshot atrasado para sucursal {suc.nombre} ({fecha_ayer_str})")
            await ConsolidatedReportingService.generate_daily_snapshot(
                tenant_id=tenant_id,
                sucursal_id=suc_id,
                fecha=fecha_ayer_str,
                es_definitivo=True,
                generado_por_id="SYSTEM_CRON"
            )
            procesados += 1
        else:
            # No hubo ventas, si había un snapshot precario (es_definitivo=False), lo pasamos a True
            if snapshot:
                snapshot.es_definitivo = True
                await snapshot.save()
            omitidos += 1
            
    logger.info(f"=== Auto-Sellado Finalizado. Procesados: {procesados}, Omitidos: {omitidos} ===")
