import asyncio
from app.infrastructure.db import init_db
from app.domain.models.conteo_fisico import ConteoFisico

async def test():
    await init_db()
    conteo = await ConteoFisico.find_all().sort("-fecha_inicio").first_or_none()
    if not conteo:
        print("No conteo found")
        return
    
    print(f"Latest conteo: {conteo.id} created at {conteo.fecha_inicio}")
    if not conteo.items:
        print("No items")
        return
        
    sample = conteo.items[0]
    print(f"Sample item: {sample.producto_id} - {sample.descripcion}")
    print(f"Categoria ID: {sample.categoria_id}")
    print(f"Categoria Nombre: {sample.categoria_nombre}")
    print(f"Proveedores: {sample.proveedores}")

asyncio.run(test())
