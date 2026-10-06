import sys

file_path = "backend/app/api/v1/endpoints/inventario.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

endpoint_code = """
@router.get("/inventario/exportar-excel")
async def export_inventory_excel(
    current_user: User = Depends(get_current_active_user)
):
    import io
    import pandas as pd
    from fastapi.responses import StreamingResponse
    from app.domain.models.sucursal import Sucursal
    from app.domain.models.product import Product
    from datetime import datetime
    import pytz

    tenant_id = current_user.tenant_id or ""
    
    if current_user.role in [UserRole.CAJERO, UserRole.USER]:
        suc_id = current_user.sucursal_id or "CENTRAL"
        sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id, Sucursal.sucursal_id == suc_id).to_list()
    else:
        sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
        
    if not sucursales:
        sucursales = [Sucursal(tenant_id=tenant_id, sucursal_id="CENTRAL", name="Central")]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        for suc in sucursales:
            pipeline = [
                {"$match": {"tenant_id": tenant_id, "is_active": True}},
                {
                    "$lookup": {
                        "from": "Inventario",
                        "let": {"pid": "$_id"},
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {"$eq": ["$producto_id", {"$toString": "$$pid"}]},
                                    "sucursal_id": suc.sucursal_id,
                                    "tenant_id": tenant_id
                                }
                            }
                        ],
                        "as": "inv"
                    }
                },
                {
                    "$unwind": {
                        "path": "$inv",
                        "preserveNullAndEmptyArrays": True
                    }
                },
                {
                    "$project": {
                        "Codigo Corto": "$codigo_corto",
                        "Codigo Largo": "$codigo_largo",
                        "Producto": "$descripcion",
                        "Categoria": "$categoria_id",
                        "Precio Final": "$precio_final",
                        "Costo Unitario": "$costo_producto",
                        "Stock": {"$ifNull": ["$inv.cantidad", 0.0]},
                        "Costo Total Stock": {
                            "$multiply": [
                                {"$ifNull": ["$costo_producto", 0.0]},
                                {"$ifNull": ["$inv.cantidad", 0.0]}
                            ]
                        }
                    }
                },
                {"$sort": {"Producto": 1}}
            ]
            
            cursor = Product.get_pymongo_collection().aggregate(pipeline)
            docs = await cursor.to_list(length=None)
            
            if not docs:
                df = pd.DataFrame(columns=["Codigo Corto", "Codigo Largo", "Producto", "Categoria", "Precio Final", "Costo Unitario", "Stock", "Costo Total Stock"])
            else:
                for doc in docs:
                    doc.pop("_id", None)
                df = pd.DataFrame(docs)
                
            sheet_name = str(suc.name)[:31].replace("[", "").replace("]", "").replace("*", "").replace(":", "")
            if not sheet_name.strip():
                sheet_name = "Inventario"
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
    output.seek(0)
    
    bolivia_tz = pytz.timezone("America/La_Paz")
    now_str = datetime.now(bolivia_tz).strftime("%Y%m%d_%H%M")
    filename = f"inventario_todas_sucursales_{now_str}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
"""

if "/inventario/exportar-excel" not in content:
    content += endpoint_code
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added export endpoint")
else:
    print("Endpoint already exists")
