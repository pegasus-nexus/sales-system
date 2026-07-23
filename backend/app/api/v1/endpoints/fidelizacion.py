from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.domain.models.cliente import Cliente, TipoCliente
from datetime import datetime

router = APIRouter()

class PublicClientRegister(BaseModel):
    nombre: str = Field(..., description="Nombre del usuario")
    apellido: str = Field(..., description="Apellido del usuario")
    telefono: str = Field(..., description="Número de teléfono celular")

@router.post("/register")
async def register_public_client(data: PublicClientRegister, tenant_id: str = "69cd7f0a8f3f6866d4cfbb62"):
    """
    Endpoint público para el registro de clientes desde la landing page.
    No requiere autenticación de empleado.
    Si el teléfono ya existe, devuelve el cliente (funciona como login passwordless).
    """
    telefono = data.telefono.strip()
    nombre_completo = f"{data.nombre.strip()} {data.apellido.strip()}".strip()
    
    if not telefono:
        raise HTTPException(status_code=400, detail="El teléfono es obligatorio")
        
    # Buscar si existe el cliente
    existing_cliente = await Cliente.find_one(
        Cliente.tenant_id == tenant_id,
        Cliente.telefono == telefono
    )
    
    if existing_cliente:
        # Ya existe, actúa como login
        return {
            "status": "success",
            "message": "Bienvenido de vuelta",
            "cliente_id": str(existing_cliente.id),
            "nombre": existing_cliente.nombre,
            "telefono": existing_cliente.telefono,
            "is_new": False
        }
        
    # Crear nuevo cliente
    nuevo_cliente = Cliente(
        tenant_id=tenant_id,
        nombre=nombre_completo,
        telefono=telefono,
        tipo_cliente=TipoCliente.ACTIVO,
        datos_crm={"origen": "landing_page_fidelizacion"}
    )
    await nuevo_cliente.create()
    
    return {
        "status": "success",
        "message": "Registro completado exitosamente",
        "cliente_id": str(nuevo_cliente.id),
        "nombre": nuevo_cliente.nombre,
        "telefono": nuevo_cliente.telefono,
        "is_new": True
    }

from app.domain.models.product import Product
from app.domain.models.category import Category
from app.domain.models.inventario import Inventario

@router.get("/catalog")
async def get_public_catalog(tenant_id: str = "69cd7f0a8f3f6866d4cfbb62"):
    """
    Retorna el catálogo público:
    - Categorías activas
    - Productos con sus precios extraídos de Inventario
      (Cochabamba = Heroinas, La Paz = Calacoto)
    """
    # 1. Obtener categorías
    categories = await Category.find(
        Category.tenant_id == tenant_id,
        Category.is_active == True,
        Category.show_on_web != False
    ).to_list()
    
    cat_list = [{"id": str(c.id), "name": c.name} for c in categories]
    
    from beanie.operators import In
    
    # 2. Obtener productos que pertenezcan a las categorías visibles
    cat_ids = {str(c.id) for c in categories}
    all_products = await Product.find(
        Product.tenant_id == tenant_id,
        Product.is_active == True,
        Product.show_on_web != False
    ).to_list()
    
    # Filter in python to avoid MongoDB ObjectId vs str mismatch
    products = [p for p in all_products if str(p.categoria_id) in cat_ids]
    p_ids = [str(p.id) for p in products]
    
    # 3. Obtener precios (Inventario)
    from beanie.operators import In
    invs = await Inventario.find(In(Inventario.producto_id, p_ids)).to_list()
    
    # Mapeo de sucursales clave
    # Heroinas (Cochabamba) = 69cd80098f3f6866d4cfbb64
    # Calacoto (La Paz) = 69ce6b7e8a00124dac6ecc99
    SUCURSAL_CBA = "69cd80098f3f6866d4cfbb64"
    SUCURSAL_LPZ = "69ce6b7e8a00124dac6ecc99"
    
    # price_map[product_id] = {"cochabamba": price, "la_paz": price}
    price_map = {p_id: {} for p_id in p_ids}
    
    # Precompute product base prices
    prod_base_prices = {str(p.id): float(p.precio_venta) for p in products}
    
    for i in invs:
        # Determine the price to use: branch specific or product default
        precio = float(i.precio_sucursal) if i.precio_sucursal is not None else prod_base_prices.get(str(i.producto_id), 0.0)
        
        # Only include if price is > 0 and stock is > 0
        if precio > 0 and i.cantidad > 0:
            if str(i.sucursal_id) == SUCURSAL_CBA:
                price_map[str(i.producto_id)]["cochabamba"] = precio
            elif str(i.sucursal_id) == SUCURSAL_LPZ:
                price_map[str(i.producto_id)]["la_paz"] = precio
                
    prod_list = []
    for p in products:
        precios = price_map.get(str(p.id), {})
        # Solo enviar productos que tienen precio en al menos una ciudad
        if precios:
            prod_list.append({
                "id": str(p.id),
                "categoria_id": str(p.categoria_id) if p.categoria_id else None,
                "codigo_corto": p.codigo_corto,
                "nombre": p.descripcion,
                "imagen": p.image_url,
                "precios": precios,
                "is_destacado": getattr(p, "is_destacado", False)
            })
            
    return {
        "status": "success",
        "categorias": cat_list,
        "productos": prod_list
    }
