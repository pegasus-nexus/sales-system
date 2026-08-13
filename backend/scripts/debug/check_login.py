import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db import init_db
from app.domain.models.user import User

load_dotenv()

async def check_user():
    await init_db()
    email = "rodrigorayomartinez@gmail.com"
    user = await User.find_one(User.email == email)
    if not user:
        print(f"El usuario con email {email} NO existe en la base de datos.")
    else:
        print(f"Usuario encontrado:")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Nombre: {user.full_name}")
        print(f"  Rol: {user.role}")
        print(f"  Tenant: {user.tenant_id}")
        print(f"  Activo: {user.is_active}")
        
        # Verificar contraseña
        from app.infrastructure.core.security import verify_password
        pwd = "2946370Rm!"
        is_valid = verify_password(pwd, user.hashed_password)
        print(f"  Contraseña proporcionada es VÁLIDA: {is_valid}")

if __name__ == "__main__":
    asyncio.run(check_user())
