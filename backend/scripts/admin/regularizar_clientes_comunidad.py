"""
Script administrativo para regularizar clientes que solicitaron afiliarse a la
Comunidad Taboada en ventas recientes (ej. Tickets #12A81E, #5E7B01 o compras con 5+ sellos)
pero que por la condición de resolución de ventas quedaron sin marcar en la colección de clientes.
"""
import asyncio
import random
import string
from datetime import UTC, datetime

from app.domain.models.cliente import Cliente
from app.domain.models.sale import Sale
from app.infrastructure.db import init_db


async def main():
    print("Iniciando conexión a base de datos...")
    await init_db()

    print("\n--- PASO 1: Buscando ventas con intención de Comunidad o clientes afectados ---")
    # Buscamos ventas donde cliente.is_miembro_comunidad sea True o con teléfono 61812174 / Fernandez
    ventas = await Sale.find().sort("-created_at").limit(500).to_list()

    ventas_comunidad = []
    for v in ventas:
        es_comunidad = bool(v.cliente and getattr(v.cliente, "is_miembro_comunidad", False))
        tel = (v.cliente.telefono or "") if v.cliente else ""
        nom = ((v.cliente.razon_social or "") if v.cliente else "").lower()
        sid = str(v.id).lower()

        # Coincidencia por bandera de comunidad o tickets/teléfonos reportados
        if es_comunidad or "61812174" in tel or "fernandez" in nom or "12a81e" in sid or "5e7b01" in sid:
            ventas_comunidad.append(v)

    print(f"Total ventas candidatas encontradas: {len(ventas_comunidad)}")

    regularizados = 0
    clientes_actualizados = set()

    for v in ventas_comunidad:
        tenant_id = v.tenant_id
        telf = (v.cliente.telefono.strip() if v.cliente and v.cliente.telefono else None)
        nit_val = (v.cliente.nit.strip() if v.cliente and v.cliente.nit else None)
        raw_nom = ((v.cliente.razon_social or "").strip() if v.cliente else None) or "Cliente Comunidad"

        # Buscar cliente existente
        cliente = None
        if v.cliente_id:
            try:
                from bson import ObjectId
                cid_obj = ObjectId(v.cliente_id) if ObjectId.is_valid(v.cliente_id) else None
                if cid_obj:
                    cliente = await Cliente.get(cid_obj)
            except Exception:
                cliente = None

        if not cliente and nit_val:
            cliente = await Cliente.find_one({"tenant_id": tenant_id, "nit_ci": nit_val, "is_active": True})

        if not cliente and telf:
            cliente = await Cliente.find_one({"tenant_id": tenant_id, "telefono": telf, "is_active": True})

        if not cliente and raw_nom and raw_nom.upper() not in ["CONSUMIDOR FINAL", "SIN NOMBRE"]:
            cliente = await Cliente.find_one({
                "tenant_id": tenant_id,
                "nombre": {"$regex": f"^{raw_nom}$", "$options": "i"},
                "is_active": True
            })

        codigo_tarjeta = f"TAB-{''.join(random.choices(string.digits, k=6))}"

        if not cliente:
            print(f"[*] Creando nuevo Cliente para venta {v.id} (Ticket #{str(v.id)[-6:].upper()}): {raw_nom} - Tel: {telf}")
            cliente = Cliente(
                tenant_id=tenant_id,
                nombre=raw_nom,
                telefono=telf,
                nit_ci=nit_val,
                email=v.cliente.email if v.cliente else None,
                is_miembro_comunidad=True,
                numero_tarjeta=codigo_tarjeta,
                fecha_afiliacion=v.created_at or datetime.now(UTC),
            )
            await cliente.insert()
            regularizados += 1
        else:
            updated = False
            if not cliente.is_miembro_comunidad:
                cliente.is_miembro_comunidad = True
                updated = True
            if not cliente.numero_tarjeta:
                cliente.numero_tarjeta = codigo_tarjeta
                updated = True
            if not cliente.fecha_afiliacion:
                cliente.fecha_afiliacion = v.created_at or datetime.now(UTC)
                updated = True
            if telf and not cliente.telefono:
                cliente.telefono = telf
                updated = True
            if nit_val and not cliente.nit_ci:
                cliente.nit_ci = nit_val
                updated = True
            if raw_nom and cliente.nombre.upper() in ["CONSUMIDOR FINAL", "SIN NOMBRE"] and raw_nom.upper() not in ["CONSUMIDOR FINAL", "SIN NOMBRE"]:
                cliente.nombre = raw_nom
                updated = True

            if updated:
                await cliente.save()
                print(f"[✓] Cliente actualizado: {cliente.nombre} | Tarjeta: {cliente.numero_tarjeta} | Tel: {cliente.telefono}")
                regularizados += 1

        clientes_actualizados.add(str(cliente.id))

        # Asegurar que la venta quede formalmente vinculada al cliente_id
        if v.cliente_id != str(cliente.id):
            v.cliente_id = str(cliente.id)
            if v.cliente:
                v.cliente.is_miembro_comunidad = True
            await v.save()
            print(f"    -> Venta {v.id} vinculada exitosamente con cliente_id {cliente.id}")

    print("\n=======================================================")
    print("REGULARIZACIÓN COMPLETADA:")
    print(f"  Total clientes intervenidos/creados: {regularizados}")
    print(f"  Clientes únicos activos en Comunidad: {len(clientes_actualizados)}")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
