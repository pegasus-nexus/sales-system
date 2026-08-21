import asyncio
from bson import ObjectId
from app.infrastructure.db import init_db
from app.domain.models.user import User, UserRole
from app.domain.models.tenant import Tenant, PlanType, RubroEmpresa, TenantSettings, WhatsAppSettings
from app.domain.models.sucursal import Sucursal, TipoSucursal
from app.infrastructure.auth import get_password_hash, verify_password

async def main():
    print("Iniciando conexión a Base de Datos...")
    await init_db()
    
    tenant_obj_id = ObjectId("69cd7f0a8f3f6866d4cfbb62")
    tenant_id_str = str(tenant_obj_id)
    
    # ── 1. TENANT TABOADA ────────────────────────────────────────────────────
    tenant = await Tenant.get(tenant_obj_id)
    if not tenant:
        tenant = await Tenant.find_one(Tenant.name == "Supermercados Taboada")
        
    all_modules = [
        "VENTAS", "INVENTARIO", "CAJA", "CLIENTES", "CREDITOS",
        "KARDEX", "REPORTES_BASICOS", "REPORTES_AVANZADOS", "AUDITORIA",
        "FIDELIZACION", "PROVEEDORES", "COMPRAS", "PEDIDOS", "TRASLADOS"
    ]
    
    if not tenant:
        tenant = Tenant(
            id=tenant_obj_id,
            name="Supermercados Taboada",
            plan=PlanType.ILIMITADO,
            rubro=RubroEmpresa.RETAIL,
            modulos_activos=all_modules,
            is_active=True,
            settings=TenantSettings(
                whatsapp=WhatsAppSettings(enabled=True),
                ticket_footer="¡Gracias por su compra en Supermercados Taboada!",
                report_watermark="Supermercados Taboada • Confidencial"
            )
        )
        await tenant.insert()
        print(f"✨ Tenant creado: Supermercados Taboada (ID: {tenant.id})")
    else:
        tenant.name = "Supermercados Taboada"
        tenant.plan = PlanType.ILIMITADO
        tenant.rubro = RubroEmpresa.RETAIL
        tenant.modulos_activos = all_modules
        tenant.is_active = True
        await tenant.save()
        print(f"✅ Tenant actualizado: Supermercados Taboada (ID: {tenant.id})")

    # ── 2. SUCURSALES ────────────────────────────────────────────────────────
    sucursales_data = [
        {"nombre": "Heroinas", "ciudad": "Cochabamba", "direccion": "Av. Heroínas #123"},
        {"nombre": "Recoleta", "ciudad": "Cochabamba", "direccion": "Av. América / Recoleta #456"},
        {"nombre": "Calacoto", "ciudad": "La Paz", "direccion": "Calle 21 de Calacoto #789"},
    ]
    
    suc_map = {}
    for s_info in sucursales_data:
        suc = await Sucursal.find_one(
            Sucursal.tenant_id == tenant_id_str,
            {"nombre": {"$regex": f"^{s_info['nombre']}$", "$options": "i"}}
        )
        if not suc:
            suc = Sucursal(
                tenant_id=tenant_id_str,
                nombre=s_info["nombre"],
                ciudad=s_info["ciudad"],
                direccion=s_info["direccion"],
                tipo=TipoSucursal.FISICA
            )
            await suc.create()
            print(f"✨ Sucursal creada: {suc.nombre} (ID: {suc.id})")
        else:
            print(f"✅ Sucursal existente: {suc.nombre} (ID: {suc.id})")
        suc_map[s_info["nombre"].lower()] = str(suc.id)

    # ── 3. USUARIOS ──────────────────────────────────────────────────────────
    heroinas_suc_id = suc_map.get("heroinas")
    
    accounts = [
        {
            "username": "admin",
            "email": "admin@pegasus.com",
            "password": "admin123",
            "role": UserRole.SUPERADMIN,
            "full_name": "Super Administrador Pegasus",
            "tenant_id": tenant_id_str,
            "sucursal_id": heroinas_suc_id
        },
        {
            "username": "rodrigorayomartinez@gmail.com",
            "email": "rodrigorayomartinez@gmail.com",
            "password": "2946370Rm!",
            "role": UserRole.SUPERADMIN,
            "full_name": "Rodrigo Rayo Martinez",
            "tenant_id": tenant_id_str,
            "sucursal_id": heroinas_suc_id
        },
        {
            "username": "supermercados.taboada",
            "email": "supermercados.taboada@taboada.bo",
            "password": "darvuh-Synja8-kozpad%$",
            "role": UserRole.ADMIN_MATRIZ,
            "full_name": "Administración Taboada",
            "tenant_id": tenant_id_str,
            "sucursal_id": heroinas_suc_id
        },
        {
            "username": "sucursal.heroinas.taboada@gmail.com",
            "email": "sucursal.heroinas.taboada@gmail.com",
            "password": "Sucursal.heroinas$2026",
            "role": UserRole.ADMIN_SUCURSAL,
            "full_name": "Caja / Sucursal Heroínas",
            "tenant_id": tenant_id_str,
            "sucursal_id": heroinas_suc_id
        },
        {
            "username": "facturador.taboada",
            "email": "facturador@taboada.bo",
            "password": "facturadorCocha001@",
            "role": UserRole.FACTURADOR,
            "full_name": "Facturador Taboada",
            "tenant_id": tenant_id_str,
            "sucursal_id": heroinas_suc_id
        }
    ]
    
    print("\n--- REGISTRANDO / ACTUALIZANDO USUARIOS ---")
    for acc in accounts:
        user = await User.find_one({"username": acc["username"]})
        if not user:
            user = await User.find_one({"email": acc["email"]})
        
        hashed_pwd = get_password_hash(acc["password"])
        
        if user:
            user.username = acc["username"]
            user.email = acc["email"]
            user.hashed_password = hashed_pwd
            user.role = acc["role"]
            user.full_name = acc["full_name"]
            user.tenant_id = acc["tenant_id"]
            user.sucursal_id = acc.get("sucursal_id")
            user.is_active = True
            await user.save()
            print(f"✅ Usuario actualizado: {acc['username']} ({acc['role']})")
        else:
            new_user = User(
                username=acc["username"],
                email=acc["email"],
                hashed_password=hashed_pwd,
                role=acc["role"],
                full_name=acc["full_name"],
                tenant_id=acc["tenant_id"],
                sucursal_id=acc.get("sucursal_id"),
                is_active=True
            )
            await new_user.create()
            print(f"✨ Usuario creado: {acc['username']} ({acc['role']})")
            
    print("\n--- PRUEBA DE AUTENTICACIÓN LOCAL ---")
    for acc in accounts:
        u = await User.find_one({"username": acc["username"]})
        valid = verify_password(acc["password"], u.hashed_password) if u else False
        print(f"Login '{acc['username']}': {'OK' if valid else 'FALLÓ'}")

if __name__ == "__main__":
    asyncio.run(main())

