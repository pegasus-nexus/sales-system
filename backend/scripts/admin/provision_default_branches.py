import asyncio
from app.infrastructure.db import init_db
from app.domain.models.tenant import Tenant
from app.domain.models.sucursal import Sucursal, TipoSucursal
from app.domain.models.almacen import Almacen, TipoAlmacen
from app.domain.models.user import User, UserRole

async def run():
    print("Iniciando conexión a base de datos...")
    await init_db()
    
    tenants = await Tenant.find_all().to_list()
    print(f"Total empresas (tenants): {len(tenants)}")
    
    for t in tenants:
        t_id = str(t.id)
        sucursales = await Sucursal.find(Sucursal.tenant_id == t_id, Sucursal.is_active == True).to_list()
        print(f"\nEmpresa: '{t.name}' (id: {t_id}) | Sucursales activas: {len(sucursales)}")
        
        # 1. Si no tiene ninguna sucursal activa, auto-crear Casa Matriz
        matriz_sucursal = None
        if len(sucursales) == 0:
            print(f"  [+] Creando 'Casa Matriz' para empresa '{t.name}'...")
            matriz_sucursal = Sucursal(
                tenant_id=t_id,
                nombre="Casa Matriz",
                ciudad="Cochabamba",
                direccion="Sede Principal",
                tipo=TipoSucursal.FISICA,
            )
            await matriz_sucursal.create()
            print(f"  [✓] Creada Sucursal: {matriz_sucursal.nombre} (id: {matriz_sucursal.id})")
        else:
            matriz_sucursal = sucursales[0]
            print(f"  [-] Ya cuenta con sucursal: {matriz_sucursal.nombre} (id: {matriz_sucursal.id})")
            
        # 2. Verificar que tenga al menos un almacén
        almacenes = await Almacen.find(Almacen.tenant_id == t_id, Almacen.is_active == True).to_list()
        if len(almacenes) == 0 and matriz_sucursal:
            print(f"  [+] Creando 'Almacén Principal' para empresa '{t.name}'...")
            almacen = Almacen(
                tenant_id=t_id,
                sucursal_id=str(matriz_sucursal.id),
                nombre="Almacén Principal",
                tipo=TipoAlmacen.GENERAL,
                is_default=True
            )
            await almacen.create()
            print(f"  [✓] Creado Almacén: {almacen.nombre} (id: {almacen.id})")
        else:
            print(f"  [-] Cuenta con {len(almacenes)} almacén(es)")

        # 3. Asignar sucursal_id por defecto a los administradores si no tienen
        admins = await User.find(
            User.tenant_id == t_id,
            {"$or": [{"role": UserRole.ADMIN_MATRIZ}, {"role": "ADMIN"}]}
        ).to_list()
        for admin in admins:
            if not admin.sucursal_id and matriz_sucursal:
                admin.sucursal_id = str(matriz_sucursal.id)
                await admin.save()
                print(f"  [✓] Asignada sucursal por defecto a usuario admin: {admin.username}")

    print("\nProvisión completada exitosamente.")

if __name__ == "__main__":
    asyncio.run(run())
