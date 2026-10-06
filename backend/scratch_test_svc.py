import asyncio
from app.infrastructure.db import init_db
from app.application.services.conteo_fisico_service import ConteoFisicoService
from app.infrastructure.repositories.mongo_conteo_fisico_repository import MongoConteoFisicoRepository

async def test():
    await init_db()
    repo = MongoConteoFisicoRepository()
    svc = ConteoFisicoService(repo)
    
    res = await svc.get_conteo("6ab7cf3ffb7c9c6b1ecdddb0", "test")
    # Actually tenant_id must match. Let's just use the repo directly.
    conteo = await repo.get_by_id("6ab7cf3ffb7c9c6b1ecdddb0", "69cd80008f3f6866d4cfbb63")
    
    if not conteo:
        print("Not found")
        return
        
    res = await svc.get_conteo("6ab7cf3ffb7c9c6b1ecdddb0", "69cd80008f3f6866d4cfbb63")
    print(res.items[0].model_dump())

asyncio.run(test())
