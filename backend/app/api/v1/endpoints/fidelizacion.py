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
from app.domain.models.web_collection import WebCollection
from app.domain.models.web_config import WebConfig

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
    
    # 3. Obtener precios (Inventario) optimizado sin sobrecarga de Pydantic
    invs_cursor = Inventario.get_motor_collection().find(
        {"producto_id": {"$in": p_ids}},
        {"producto_id": 1, "sucursal_id": 1, "precio_sucursal": 1, "cantidad": 1}
    )
    invs = await invs_cursor.to_list(length=None)
    
    # Mapeo de sucursales clave
    # Heroinas (Cochabamba) = 69cd80098f3f6866d4cfbb64
    # Calacoto (La Paz) = 69ce6b7e8a00124dac6ecc99
    SUCURSAL_CBA = "69cd80098f3f6866d4cfbb64"
    SUCURSAL_LPZ = "69ce6b7e8a00124dac6ecc99"
    
    price_map = {p_id: {} for p_id in p_ids}
    
    # Precompute product base prices
    prod_base_prices = {str(p.id): float(p.precio_venta) for p in products}
    
    for i in invs:
        p_suc = i.get("precio_sucursal")
        p_id = str(i.get("producto_id", ""))
        suc_id = str(i.get("sucursal_id", ""))
        cantidad = float(str(i.get("cantidad") or 0))
        
        precio = float(str(p_suc)) if p_suc is not None else prod_base_prices.get(p_id, 0.0)
        
        if precio > 0 and cantidad > 0:
            if suc_id == SUCURSAL_CBA:
                price_map[p_id]["cochabamba"] = precio
            elif suc_id == SUCURSAL_LPZ:
                price_map[p_id]["la_paz"] = precio
                
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
            
    # 4. Obtener colecciones activas
    collections = await WebCollection.find(
        WebCollection.tenant_id == tenant_id,
        WebCollection.is_active == True
    ).to_list()
    
    col_list = [{
        "id": str(c.id),
        "name": c.name,
        "categories_ids": c.categories_ids,
        "image_url": c.image_url
    } for c in collections]

    # 5. Obtener configuración web
    web_config = await WebConfig.find_one(WebConfig.tenant_id == tenant_id)
    if not web_config:
        web_config = WebConfig(tenant_id=tenant_id)

    return {
        "status": "success",
        "web_config": {
            "hero_subtitle": web_config.hero_subtitle,
            "hero_title": web_config.hero_title,
            "hero_description": web_config.hero_description,
            "hero_bg_cba": web_config.hero_bg_cba,
            "hero_bg_lpz": web_config.hero_bg_lpz,
        },
        "colecciones": col_list,
        "categorias": cat_list,
        "productos": prod_list
    }
