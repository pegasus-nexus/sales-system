import os

path = "backend/app/api/v1/endpoints/inventario.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

endpoint = """
@router.post("/inventario/corregir-kardex/{producto_id}")
async def corregir_kardex(
    producto_id: str,
    sucursal_id: str = "CENTRAL",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL, UserRole.SUPERADMIN]))
):
    \"\"\"Recalcula secuencialmente el Kárdex y alinea el Inventario actual con el resultado matemático.\"\"\"
    tenant_id = current_user.tenant_id or "default"
    
    from app.domain.models.inventario import InventoryLog, Inventario
    from decimal import Decimal
    
    query_prod = {"tenant_id": tenant_id, "sucursal_id": sucursal_id}
    if producto_id != "ALL":
        query_prod["producto_id"] = producto_id
        
    almacenes_distinct = await InventoryLog.distinct("almacen_id", query_prod)
    productos_distinct = await InventoryLog.distinct("producto_id", query_prod) if producto_id == "ALL" else [producto_id]
    
    resultados = {"corregidos": 0, "logs_modificados": 0, "inventarios_modificados": 0}
    
    for pid in productos_distinct:
        for almacen_id in almacenes_distinct:
            logs = await InventoryLog.find(
                InventoryLog.tenant_id == tenant_id,
                InventoryLog.sucursal_id == sucursal_id,
                InventoryLog.almacen_id == almacen_id,
                InventoryLog.producto_id == pid
            ).sort(+InventoryLog.created_at).to_list()
            
            if not logs: continue
            
            stock_actual = 0.0
            for log in logs:
                stock_actual += float(str(log.cantidad_movida))
                if float(str(log.stock_resultante)) != stock_actual:
                    log.stock_resultante = Decimal(str(stock_actual))
                    await log.save()
                    resultados["logs_modificados"] += 1
                    
            inv_query = {
                "tenant_id": tenant_id,
                "sucursal_id": sucursal_id,
                "almacen_id": almacen_id,
                "producto_id": pid
            }
            inventario = await Inventario.find_one(inv_query)
            if inventario:
                if float(str(inventario.cantidad)) != stock_actual:
                    inventario.cantidad = stock_actual
                    await inventario.save()
                    resultados["inventarios_modificados"] += 1
            else:
                if stock_actual != 0:
                    inventario = Inventario(**inv_query, cantidad=stock_actual)
                    await inventario.insert()
                    resultados["inventarios_modificados"] += 1
                    
            resultados["corregidos"] += 1
            
    return {"message": "Kárdex recalculado exitosamente", "data": resultados}
"""

data = data + endpoint

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Endpoint corregir-kardex añadido a inventario.py")
