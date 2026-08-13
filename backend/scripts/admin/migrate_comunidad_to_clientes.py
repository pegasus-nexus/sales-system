import asyncio
import os
import sys
import random
import string
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db import init_db
from app.domain.models.comunidad import ComunidadUser
from app.domain.models.cliente import Cliente

load_dotenv()

async def migrate_comunidad():
    print("Iniciando conexión a base de datos...")
    await init_db()
    
    print("Buscando usuarios de la comunidad antigua (FEXCO)...")
    comunidad_users = await ComunidadUser.find_all().to_list()
    print(f"Se encontraron {len(comunidad_users)} usuarios en la colección ComunidadUser.")
    
    migrados = 0
    actualizados = 0
    
    for c_user in comunidad_users:
        if not c_user.telefono:
            continue
            
        # Buscar si ya existe un cliente con este teléfono
        cliente = await Cliente.find_one(
            Cliente.tenant_id == c_user.tenant_id,
            Cliente.telefono == c_user.telefono
        )
        
        if not cliente:
            # Crear nuevo cliente
            random_code = ''.join(random.choices(string.digits, k=6))
            cliente = Cliente(
                tenant_id=c_user.tenant_id,
                nombre=c_user.nombre or "Usuario Comunidad",
                apellido=c_user.apellido,
                email=c_user.email,
                telefono=c_user.telefono,
                is_miembro_comunidad=True,
                numero_tarjeta=f"TAB-{random_code}"
            )
            await cliente.insert()
            migrados += 1
        else:
            # Actualizar cliente existente
            if not cliente.is_miembro_comunidad:
                cliente.is_miembro_comunidad = True
                
            if not cliente.numero_tarjeta:
                random_code = ''.join(random.choices(string.digits, k=6))
                cliente.numero_tarjeta = f"TAB-{random_code}"
                
            await cliente.save()
            actualizados += 1
            
    print(f"Migración completada con éxito.")
    print(f"Nuevos clientes creados a partir de la comunidad: {migrados}")
    print(f"Clientes existentes actualizados como miembros: {actualizados}")

if __name__ == "__main__":
    asyncio.run(migrate_comunidad())
