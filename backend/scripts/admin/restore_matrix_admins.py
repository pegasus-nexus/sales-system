import asyncio
from app.infrastructure.db import init_db
from app.domain.models.user import User, UserRole

async def run():
    await init_db()
    # Find all ADMIN_MATRIZ users
    admins = await User.find(
        {"$or": [{"role": UserRole.ADMIN_MATRIZ}, {"role": "ADMIN"}]}
    ).to_list()
    print(f"Total ADMIN_MATRIZ users found: {len(admins)}")
    for a in admins:
        # If it was assigned a branch, set sucursal_id back to None (Matrix level)
        if a.sucursal_id is not None:
            old_s = a.sucursal_id
            a.sucursal_id = None
            await a.save()
            print(f" [✓] Restored {a.username} (was {old_s} -> now None / Matriz Global)")
        else:
            print(f" [-] {a.username} already has sucursal_id = None")

if __name__ == "__main__":
    asyncio.run(run())
