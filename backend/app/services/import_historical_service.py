from typing import List
from datetime import datetime, timezone
import random
import uuid
from dateutil import parser
from app.db import get_raw_db
from app.schemas.analytics import HistoricalImportRequest

async def process_historical_import(tenant_id: str, import_data: HistoricalImportRequest) -> dict:
    """
    Motor masivo de importación paralela ciega para MongoDB.
    Detecta nombres de producto por texto, o crea subidas genéricas si no los halla.
    """
    db = await get_raw_db()
    
    if not import_data.rows:
        return {"imported": 0, "errors": "No rows provided"}

    # 1. Fetch all products for this tenant mapped by name (case insensitive) for quick lookup
    productos_cursor = db.products.find({"tenant_id": tenant_id})
    product_map = {}
    async for prod in productos_cursor:
        product_map[prod["descripcion"].strip().lower()] = {
            "id": str(prod["_id"]),
            "costo": float(str(prod.get("costo_producto", 0.0))),
            "nombre": prod["descripcion"],
            "categoria": prod.get("categoria_id", "Sin Categoria")
        }
    
    ventas_to_insert = []
    
    # 2. Iterate each row
    for row in import_data.rows:
        # Pestañar de fecha (fallback if parse fails)
        try:
            dt = parser.parse(row.fecha)
            # Asegurar zona horaria si no tiene:
            if not dt.tzinfo:
                dt = dt.replace(tzinfo=timezone.utc)
        except Exception:
            dt = datetime.now(timezone.utc)
        
        prod_key = row.producto_nombre.strip().lower()

        # Resuelve el producto
        if prod_key in product_map:
            p_data = product_map[prod_key]
            cost_u = p_data["costo"]
            p_id = p_data["id"]
            p_nom = p_data["nombre"]
        else:
            # Fallback - Producto no encontrado, registra como genérico
            cost_u = row.precio_unitario * 0.4 # Aproximado costo genérico del 40%
            p_id = f"imported_{uuid.uuid4().hex[:8]}"
            p_nom = f"IMPORTADO: {row.producto_nombre}"

        # Calculos
        subtotal = row.precio_unitario * row.cantidad
        item_data = {
            "producto_id": p_id,
            "nombre_producto": p_nom,
            "cantidad": row.cantidad,
            "precio_unitario": row.precio_unitario,
            "subtotal": subtotal,
            "costo_unitario": cost_u
        }

        # Generar "Ticket" Venta
        venta_doc = {
            "tenant_id": tenant_id,
            "sucursal_id": import_data.sucursal_id,
            "cajero_id": "imported_system",
            "cliente_id": None,
            "items": [item_data],
            "subtotal": subtotal,
            "descuento": 0.0,
            "total": subtotal,
            "metodo_pago": "EFECTIVO",
            "fecha": dt,
            "created_at": dt,
            "updated_at": dt,
            "estado": "COMPLETADA",
            "is_imported": True
        }
        ventas_to_insert.append(venta_doc)

    # 3. Batch Insert for massive speed
    if ventas_to_insert:
        await db.sales.insert_many(ventas_to_insert)

    return {"imported": len(ventas_to_insert), "errors": 0}
