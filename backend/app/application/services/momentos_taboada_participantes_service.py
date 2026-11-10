from datetime import datetime, UTC
from typing import List, Dict, Any, Optional
import random
import string
import re

from app.domain.constants.momentos_taboada import FECHA_INICIO_CAMPANA
from app.domain.models.sale import Sale
from app.domain.models.cliente import Cliente
from app.domain.models.momentos_taboada import CanjeMomentosTaboada


class MomentosTaboadaParticipantesService:
    """
    Servicio especializado para la vista de Promoción y Métricas de Participantes
    orientada al cajero y supervisión de mostrador en Momentos Taboada.
    """

    @staticmethod
    async def get_participantes_y_metricas(
        tenant_id: str,
        sucursal_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retorna los KPIs ejecutivos para el cajero y la tabla completa de participantes
        con base en las ventas participantes desde el 1 de noviembre de 2026.
        """
        filtro_ventas: Dict[str, Any] = {
            "tenant_id": tenant_id,
            "anulada": False,
            "created_at": {"$gte": FECHA_INICIO_CAMPANA},
        }
        if sucursal_id and sucursal_id != "TODAS":
            filtro_ventas["sucursal_id"] = sucursal_id

        # 1. Cargar ventas participantes
        ventas = await Sale.find(filtro_ventas).sort("-created_at").to_list()

        # 2. Cargar todos los canjes de este tenant
        filtro_canjes: Dict[str, Any] = {
            "tenant_id": tenant_id,
            "estado": "COMPLETADO",
        }
        if sucursal_id and sucursal_id != "TODAS":
            filtro_canjes["sucursal_id"] = sucursal_id

        canjes = await CanjeMomentosTaboada.find(filtro_canjes).to_list()

        # Indexar canjes por teléfono del cliente
        canjes_por_telefono: Dict[str, List[CanjeMomentosTaboada]] = {}
        for c in canjes:
            tel = (c.cliente_telefono or "").strip()
            if tel:
                canjes_por_telefono.setdefault(tel, []).append(c)

        # 3. Agrupar ventas por participante (usando teléfono o cliente_id como clave única)
        participantes_map: Dict[str, Dict[str, Any]] = {}
        total_tickets_repartidos_global = 0
        total_monto_ventas_global = 0.0

        for v in ventas:
            monto_venta = float(v.total)
            tickets_de_venta = int(monto_venta // 30)

            # Extraer identificador de cliente
            tel = ""
            nom = ""
            if v.cliente and v.cliente.telefono:
                tel = v.cliente.telefono.strip()
            if not tel and v.cliente_id:
                tel = f"ID:{v.cliente_id}"

            if not tel:
                # Si es una venta anónima sin celular ni id, no acumula tickets de cartilla
                continue

            if v.cliente and v.cliente.razon_social:
                nom = v.cliente.razon_social.strip()
            elif not nom and v.cliente_id:
                nom = "Cliente Registrado"

            if tel not in participantes_map:
                participantes_map[tel] = {
                    "cliente_id": v.cliente_id,
                    "nombre": nom or f"Cliente {tel}",
                    "celular": tel if not tel.startswith("ID:") else "Sin celular",
                    "raw_tel": tel,
                    "ventas_count": 0,
                    "total_gastado": 0.0,
                    "tickets_acumulados": 0,
                    "ultima_compra": v.created_at,
                }

            p_data = participantes_map[tel]
            p_data["ventas_count"] += 1
            p_data["total_gastado"] += monto_venta
            p_data["tickets_acumulados"] += tickets_de_venta
            if v.created_at > p_data["ultima_compra"]:
                p_data["ultima_compra"] = v.created_at
            if nom and (p_data["nombre"].startswith("Cliente ") or not p_data["nombre"]):
                p_data["nombre"] = nom

            total_tickets_repartidos_global += tickets_de_venta
            total_monto_ventas_global += monto_venta

        # 4. Enriquecer con la colección de Clientes (para obtener tarjeta_taboada oficial)
        # Buscar todos los teléfonos registrados
        telefonos_buscar = [
            p["raw_tel"] for p in participantes_map.values()
            if not p["raw_tel"].startswith("ID:") and p["raw_tel"]
        ]
        clientes_db = await Cliente.find({
            "tenant_id": tenant_id,
            "telefono": {"$in": telefonos_buscar},
        }).to_list()
        cliente_info_map = {c.telefono: c for c in clientes_db if c.telefono}

        # 5. Construir lista de participantes y calcular estado de canjes
        lista_participantes: List[Dict[str, Any]] = []
        compraron_mas_de_una_vez = 0

        for key, p in participantes_map.items():
            if p["ventas_count"] > 1:
                compraron_mas_de_una_vez += 1

            c_doc = cliente_info_map.get(p["raw_tel"])
            if c_doc:
                p["nombre"] = c_doc.nombre or p["nombre"]
                tarjeta_taboada = c_doc.numero_tarjeta
                is_miembro = c_doc.is_miembro_comunidad
            else:
                tarjeta_taboada = None
                is_miembro = False

            # Calcular canjes y tickets utilizados
            canjes_cliente = canjes_por_telefono.get(p["raw_tel"], [])
            tickets_utilizados = sum(c.sellos_utilizados for c in canjes_cliente)
            canjes_completados = len(canjes_cliente)

            tickets_disponibles = max(0, p["tickets_acumulados"] - tickets_utilizados)

            if canjes_completados == 0:
                estado_canjeado = "Sin canjes"
            elif canjes_completados == 1:
                estado_canjeado = f"1 canje ({canjes_cliente[0].premio_nombre})"
            else:
                estado_canjeado = f"{canjes_completados} canjes realizados"

            row = {
                "id": p["cliente_id"] or key,
                "nombre": p["nombre"],
                "celular": p["celular"],
                "raw_tel": p["raw_tel"],
                "fecha_ultima_compra": p["ultima_compra"].isoformat(),
                "tickets_acumulados": p["tickets_acumulados"],
                "tickets_utilizados": tickets_utilizados,
                "tickets_disponibles": tickets_disponibles,
                "estado_canjeado": estado_canjeado,
                "total_canjes": canjes_completados,
                "tarjeta_taboada": tarjeta_taboada,
                "is_miembro_comunidad": is_miembro,
                "cantidad_compras": p["ventas_count"],
                "total_gastado_bs": round(p["total_gastado"], 2),
            }
            lista_participantes.append(row)

        # Ordenar por fecha de última compra más reciente
        lista_participantes.sort(key=lambda x: x["fecha_ultima_compra"], reverse=True)

        # 6. Filtrar por búsqueda si se envió `search`
        if search and search.strip():
            query_lower = search.strip().lower()
            lista_participantes = [
                item for item in lista_participantes
                if query_lower in item["nombre"].lower()
                or query_lower in item["celular"].lower()
                or (item["tarjeta_taboada"] and query_lower in item["tarjeta_taboada"].lower())
            ]

        # 7. Calcular Métricas Solicitadas
        total_participantes = len(participantes_map)
        ticket_promedio = (
            round(total_monto_ventas_global / len(ventas), 2)
            if ventas else 0.0
        )

        return {
            "metricas": {
                "total_participantes": total_participantes,
                "ticket_promedio": ticket_promedio,
                "total_tickets_repartidos": total_tickets_repartidos_global,
                "participantes_recurrentes": compraron_mas_de_una_vez,
                "total_tickets_campana": len(ventas),
            },
            "participantes": lista_participantes,
        }

    @staticmethod
    async def afiliar_tarjeta_taboada(
        tenant_id: str,
        telefono: str,
        nombre: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Asigna o genera una Tarjeta Taboada (código TAB-XXXXXX) para un cliente,
        marcando su afiliación a la Comunidad Taboada para incentivar la fidelización.
        """
        clean_tel = telefono.strip()
        if not clean_tel:
            return {"status": "error", "message": "El teléfono es requerido para asignar la tarjeta"}

        cliente = await Cliente.find_one({
            "tenant_id": tenant_id,
            "telefono": clean_tel,
        })

        # Generar código aleatorio de 6 dígitos numéricos
        codigo_nuevo = f"TAB-{''.join(random.choices(string.digits, k=6))}"

        if not cliente:
            # Crear cliente si no existía previamente
            cliente = Cliente(
                tenant_id=tenant_id,
                nombre=nombre.strip() if nombre and nombre.strip() else f"Cliente {clean_tel}",
                telefono=clean_tel,
                numero_tarjeta=codigo_nuevo,
                is_miembro_comunidad=True,
                fecha_afiliacion=datetime.now(UTC),
            )
            await cliente.create()
        else:
            if not cliente.numero_tarjeta:
                cliente.numero_tarjeta = codigo_nuevo
            cliente.is_miembro_comunidad = True
            if not cliente.fecha_afiliacion:
                cliente.fecha_afiliacion = datetime.now(UTC)
            if nombre and nombre.strip() and cliente.nombre.startswith("Cliente "):
                cliente.nombre = nombre.strip()
            await cliente.save()

        return {
            "status": "success",
            "message": "Tarjeta Taboada vinculada con éxito",
            "numero_tarjeta": cliente.numero_tarjeta,
            "cliente_nombre": cliente.nombre,
            "cliente_telefono": cliente.telefono,
        }
