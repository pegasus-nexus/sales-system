import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime

async def inspect_patria():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    start_date = datetime(2025, 8, 6, 0, 0, 0)
    end_date = datetime(2025, 8, 6, 23, 59, 59)

    docs = await db.ventas_historicas_crudas.find({
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)

    print(f"Total documentos encontrados el 06/08/2025: {len(docs)}")
    total_bruto = sum(float(str(d.get("monto_total_bs", 0))) for d in docs)
    print(f"Suma de monto_total_bs: Bs. {total_bruto:,.2f}")

    # Verificar si hay campos de descuento, monto_neto, precio_neto, etc.
    sample_doc = docs[0] if docs else {}
    print("\nEjemplo de documento el 06/08/2025:")
    print(sample_doc)

    # Chequear si hay documentos anulados o con monto_neto
    fields = set()
    for d in docs:
        fields.update(d.keys())
    print("\nCampos únicos en 06/08/2025:", fields)

if __name__ == '__main__':
    asyncio.run(inspect_patria())
