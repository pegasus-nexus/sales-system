"""
Migración: Actualizar rol de usuarios de Catálogo Digital a CATALOGO_MERCHANT
para aislar completamente su acceso del ERP.
"""
import asyncio
from app.infrastructure.db import init_db
from app.domain.models.user import User, UserRole
from app.domain.models.catalogo import CatalogoConfig


async def migrate_catalogo_merchants():
    print("Iniciando migración de roles para usuarios de Catálogo Digital...")
    await init_db()

    configs = await CatalogoConfig.find_all().to_list()
    print(f"Total de catálogos encontrados: {len(configs)}")

    migrated_count = 0
    for cfg in configs:
        tenant_id = cfg.tenant_id
        if not tenant_id:
            continue

        users = await User.find(
            User.tenant_id == tenant_id,
            User.role == UserRole.ADMIN_MATRIZ
        ).to_list()

        for u in users:
            print(f"Migrando usuario: {u.username} ({u.email}) de tenant {tenant_id} a CATALOGO_MERCHANT...")
            u.role = UserRole.CATALOGO_MERCHANT
            await u.save()
            migrated_count += 1

    print(f"Migración completada. Usuarios actualizados a CATALOGO_MERCHANT: {migrated_count}")


if __name__ == "__main__":
    asyncio.run(migrate_catalogo_merchants())
