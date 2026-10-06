import asyncio
from app.infrastructure.db import init_db
from app.domain.models.conteo_fisico import ConteoFisico
from app.application.services.conteo_fisico_service import ConteoFisicoService
from app.infrastructure.repositories.mongo_conteo_fisico_repository import MongoConteoFisicoRepository

async def test():
    await init_db()
    conteo = await ConteoFisico.find_all().sort("-fecha_inicio").first_or_none()
    print("DB:", conteo.items[0].categoria_nombre)
    
    repo = MongoConteoFisicoRepository()
    svc = ConteoFisicoService(repo)
    res = await svc.get_conteo(str(conteo.id), conteo.tenant_id)
    print("API:", res.items[0].categoria_nombre)

asyncio.run(test())
