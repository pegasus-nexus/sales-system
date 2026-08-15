import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import random
import string

from app.domain.models.cliente import Cliente

async def migrate_member_codes():
    print("Iniciando migracion de codigos de miembro ampliada...")
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    await init_beanie(database=client.sales_system_prod, document_models=[Cliente])
    
    # Todos los clientes
    clientes = await Cliente.find_all().to_list()
    count = 0
    for c in clientes:
        is_community = c.is_miembro_comunidad or (c.datos_crm and c.datos_crm.get('origen') == 'landing_page_fidelizacion')
        if is_community and not c.numero_tarjeta:
            random_code = ''.join(random.choices(string.digits, k=6))
            c.numero_tarjeta = f"TAB-{random_code}"
            c.is_miembro_comunidad = True
            await c.save()
            count += 1
            
    print(f"Migracion terminada. {count} clientes actualizados.")

if __name__ == '__main__':
    asyncio.run(migrate_member_codes())
