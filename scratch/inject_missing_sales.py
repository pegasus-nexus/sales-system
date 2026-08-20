import asyncio
import pandas as pd
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def inject_missing_sales():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64"
    
    # Load users to get cashier ID
    users = await db.users.find({"tenant_id": tenant_id}).to_list(None)
    user_map = {u['full_name'].lower(): str(u['_id']) for u in users if 'full_name' in u}
    
    # Load products to get product ID
    prods = await db.products.find({"tenant_id": tenant_id}).to_list(None)
    prod_map = {p['descripcion'].lower(): str(p['_id']) for p in prods if 'descripcion' in p}
    
    df = pd.read_csv(r'c:\Users\rodri\Desktop\sales-system\plan_implementations\INVENTARIO GENERAL - INVENTARIO AL 17-08.csv')
    df_ventas = df[df['TIPO MOVIMIENTO'] == 'VENTA'].copy()
    
    # Sort by FECHA just in case
    df_ventas = df_ventas.sort_values('FECHA')
    
    grouped = df_ventas.groupby(['FECHA', 'USUARIO'])
    
    sales_to_insert = []
    
    for (fecha_str, usuario), group in grouped:
        try:
            # Parse datetime
            sale_date = datetime.strptime(fecha_str, '%Y-%m-%d %H:%M:%S')
        except:
            continue
            
        cashier_id = user_map.get(str(usuario).lower(), "default_cashier")
        
        items = []
        total_sale = 0.0
        
        for _, row in group.iterrows():
            prod_name = str(row['PRODUCTO']).strip()
            prod_id = prod_map.get(prod_name.lower())
            
            if not prod_id:
                # Intento parcial
                for db_p_name, db_p_id in prod_map.items():
                    if db_p_name in prod_name.lower() or prod_name.lower() in db_p_name:
                        prod_id = db_p_id
                        break
                if not prod_id:
                    prod_id = "unknown_product"
            
            qty = abs(float(row['CANTIDAD']))
            precio_str = str(row['PRECIO VENTA UNIT.']).replace(',', '.') if pd.notna(row['PRECIO VENTA UNIT.']) else '0'
            costo_str = str(row['COSTO UNIT.']).replace(',', '.') if pd.notna(row['COSTO UNIT.']) else '0'
            
            try:
                precio = float(precio_str)
                costo = float(costo_str)
            except:
                precio = 0.0
                costo = 0.0
                
            subtotal = qty * precio
            total_sale += subtotal
            
            items.append({
                "producto_id": prod_id,
                "descripcion": prod_name,
                "cantidad": qty,
                "precio_unitario": precio,
                "costo_unitario": costo,
                "descuento_unitario": 0.0,
                "subtotal": subtotal,
                "almacen_id": "default"
            })
            
        sale_doc = {
            "tenant_id": tenant_id,
            "sucursal_id": sucursal_id,
            "almacen_id": "default",
            "items": items,
            "total": total_sale,
            "pagos": [{
                "metodo": "EFECTIVO", # asumimos efectivo ya que el CSV no dice
                "monto": total_sale,
                "fecha": sale_date
            }],
            "descuento": None,
            "cliente_id": None,
            "cliente": None,
            "cashier_id": cashier_id,
            "cashier_name": str(usuario),
            "anulada": False,
            "estado_pago": "PAGADO",
            "factura_emitida": False,
            "idempotency_key": f"recovered_csv_{fecha_str}_{usuario}",
            "created_at": sale_date
        }
        
        sales_to_insert.append(sale_doc)
        
    if sales_to_insert:
        # Borrar previas reconstruidas de esta forma para evitar dupes si se corre 2 veces
        await db.sales.delete_many({"idempotency_key": {"$regex": "^recovered_csv_"}})
        
        chunk_size = 1000
        for i in range(0, len(sales_to_insert), chunk_size):
            await db.sales.insert_many(sales_to_insert[i:i+chunk_size])
            
        print(f"Éxito! {len(sales_to_insert)} tickets de venta reconstruidos e inyectados.")

if __name__ == '__main__':
    asyncio.run(inject_missing_sales())
