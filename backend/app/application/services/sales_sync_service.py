import asyncio
import logging

from app.domain.models.sale import Sale
from app.domain.models.sucursal import Sucursal
from app.infrastructure.core.config import settings
from app.infrastructure.db import get_client

logger = logging.getLogger("SalesSyncService")


class SalesSyncService:
    @staticmethod
    def sync_sale_to_historical_background(sale: Sale):
        """
        Sincronización automática en segundo plano con ventas_historicas_crudas (BI).
        """
        async def _sync():
            try:
                sucursal_name = "Central"
                if sale.sucursal_id and sale.sucursal_id != "CENTRAL":
                    try:
                        from beanie import PydanticObjectId
                        sucursal_obj = await Sucursal.get(PydanticObjectId(sale.sucursal_id))
                        if sucursal_obj:
                            sucursal_name = sucursal_obj.nombre
                    except Exception:
                        sucursal_name = sale.sucursal_id

                name_lower = sucursal_name.lower()
                if 'heroinas' in name_lower or 'heroína' in name_lower or 'hero' in name_lower:
                    sucursal_name_mapped = 'Heroínas'
                elif 'recoleta' in name_lower:
                    sucursal_name_mapped = 'Recoleta'
                elif 'calacoto' in name_lower:
                    sucursal_name_mapped = 'Calacoto'
                else:
                    sucursal_name_mapped = sucursal_name

                db_raw = get_client()[settings.MONGODB_DB_NAME]
                new_historical_records = []
                for item in sale.items:
                    new_historical_records.append({
                        "fecha_transaccion": sale.created_at,
                        "nombre_producto": item.descripcion.upper().strip(),
                        "cantidad_vendida": float(str(item.cantidad)),
                        "sucursal": sucursal_name_mapped,
                        "monto_total_bs": float(str(item.subtotal)),
                        "tenant_id": sale.tenant_id,
                        "original_sale_id": sale.id
                    })

                if new_historical_records:
                    await db_raw.ventas_historicas_crudas.insert_many(new_historical_records)
            except Exception as e:
                logger.error(f"Error en segundo plano sincronizando venta a ventas_historicas_crudas: {e}", exc_info=True)

        asyncio.create_task(_sync())
