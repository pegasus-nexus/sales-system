from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from beanie import PydanticObjectId
import re

from app.domain.models.momentos_taboada import (
    PremioMomentosTaboada,
    CanjeMomentosTaboada,
    MovimientoCajaChicaTaboada,
)
from app.domain.models.sale import Sale
from app.domain.models.cliente import Cliente
from app.domain.models.sucursal import Sucursal
from app.domain.models.user import User

# Fecha oficial de inicio de la promoción Momentos Taboada
FECHA_INICIO_CAMPANA = datetime(2026, 11, 1, 0, 0, 0, tzinfo=timezone.utc)

# 4 Premios oficiales según cartilla oficial
PREMIOS_DEFAULT = [
    {
        "codigo": "TAZA_NEGRA",
        "nombre": "Elegante taza negra",
        "descripcion": "1 taza negra con logo dorado",
        "sellos_requeridos": 5,
        "copago_bs": 19.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/taza_negra_taboada.jpg",
    },
    {
        "codigo": "TAZA_CORCHO",
        "nombre": "Tu taza de corcho",
        "descripcion": "1 taza con base de corcho y tapa",
        "sellos_requeridos": 10,
        "copago_bs": 39.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/taza_corcho_taboada.jpg",
    },
    {
        "codigo": "CORAZONES_DOS",
        "nombre": "Corazones para dos",
        "descripcion": "2 tazas con asa de corazón",
        "sellos_requeridos": 20,
        "copago_bs": 69.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/corazones_dos_taboada.jpg",
    },
    {
        "codigo": "CHOCO_ESPUMA",
        "nombre": "Chocolate con espuma",
        "descripcion": "1 batidora pequeña + 1 taza de corcho",
        "sellos_requeridos": 30,
        "copago_bs": 99.0,
        "imagen_url": "https://res.cloudinary.com/dv71mcfvm/image/upload/v1741170000/choco_espuma_taboada.jpg",
    },
]


class MomentosTaboadaService:

    @staticmethod
    async def get_or_seed_premios(tenant_id: str) -> List[PremioMomentosTaboada]:
        """Retorna los premios de la campaña o los inicializa si es la primera vez."""
        premios = await PremioMomentosTaboada.find(
            PremioMomentosTaboada.tenant_id == tenant_id,
            PremioMomentosTaboada.is_active == True,
        ).sort("sellos_requeridos").to_list()

        if not premios:
            # Auto-sembrado de los 4 premios oficiales de Momentos Taboada
            for p_def in PREMIOS_DEFAULT:
                nuevo = PremioMomentosTaboada(
                    tenant_id=tenant_id,
                    codigo=p_def["codigo"],
                    nombre=p_def["nombre"],
                    descripcion=p_def["descripcion"],
                    sellos_requeridos=p_def["sellos_requeridos"],
                    copago_bs=p_def["copago_bs"],
                    imagen_url=p_def["imagen_url"],
                    stock_por_sucursal={},
                )
                await nuevo.create()
            premios = await PremioMomentosTaboada.find(
                PremioMomentosTaboada.tenant_id == tenant_id,
                PremioMomentosTaboada.is_active == True,
            ).sort("sellos_requeridos").to_list()

        return premios

    @staticmethod
    async def update_premio_stock(
        tenant_id: str, premio_id: str, sucursal_id: str, nuevo_stock: int
    ) -> PremioMomentosTaboada:
        """Actualiza el stock disponible de un premio en una sucursal específica."""
        premio = await PremioMomentosTaboada.get(PydanticObjectId(premio_id))
        if not premio or premio.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Premio no encontrado")

        if nuevo_stock < 0:
            raise HTTPException(status_code=400, detail="El stock no puede ser negativo")

        premio.stock_por_sucursal[sucursal_id] = nuevo_stock
        premio.updated_at = datetime.now(timezone.utc)
        await premio.save()
        return premio

    @staticmethod
    async def buscar_cliente_sellos(tenant_id: str, query: str) -> Dict[str, Any]:
        """
        Calcula los sellos ganados, canjeados y disponibles de un cliente.
        REGLA DE NEGOCIO ESTRICTA:
        - 1 sello por cada Bs 30 completos de cada compra independiente.
        - Se evalúa TICKET POR TICKET (los centavos o residuos no se acumulan entre compras).
        - Solo compras válidas desde el 1 de noviembre de 2026.
        """
        clean_q = query.strip()
        if not clean_q:
            raise HTTPException(status_code=400, detail="Debes ingresar un teléfono o nombre de cliente")

        # Buscar cliente por teléfono o nombre
        cliente = await Cliente.find_one(
            Cliente.tenant_id == tenant_id,
            Cliente.telefono == clean_q,
        )
        if not cliente:
            # Intento por nombre parcial
            cliente = await Cliente.find_one(
                Cliente.tenant_id == tenant_id,
                {"nombre": re.compile(re.escape(clean_q), re.IGNORECASE)},
            )

        telefono_objetivo = cliente.telefono if cliente else clean_q
        cliente_id_str = str(cliente.id) if cliente else None
        cliente_nombre = cliente.nombre if cliente else f"Cliente {clean_q}"

        # Buscar todas las ventas válidas desde el 1 de noviembre de 2026
        filtro_ventas = {
            "tenant_id": tenant_id,
            "anulada": False,
            "created_at": {"$gte": FECHA_INICIO_CAMPANA},
            "$or": [
                {"cliente_id": cliente_id_str} if cliente_id_str else {"cliente_id": "__NO_MATCH__"},
                {"cliente.telefono": telefono_objetivo},
            ],
        }

        ventas = await Sale.find(filtro_ventas).sort("created_at").to_list()

        # Detalle ticket por ticket
        historial_tickets = []
        total_sellos_ganados = 0
        total_gastado_campana = 0.0

        for v in ventas:
            monto_ticket = float(v.total)
            total_gastado_campana += monto_ticket
            # Regla de división entera por ticket (sin acumulativos residuales)
            sellos_ticket = int(monto_ticket // 30)
            sobrante_ticket = round(monto_ticket % 30, 2)
            total_sellos_ganados += sellos_ticket

            historial_tickets.append({
                "ticket_id": str(v.id),
                "fecha": v.created_at.isoformat(),
                "monto_bs": monto_ticket,
                "sellos_otorgados": sellos_ticket,
                "sobrante_no_acumulable_bs": sobrante_ticket,
                "sucursal_id": v.sucursal_id,
            })

        # Buscar canjes realizados por el cliente
        canjes = await CanjeMomentosTaboada.find(
            CanjeMomentosTaboada.tenant_id == tenant_id,
            CanjeMomentosTaboada.cliente_telefono == telefono_objetivo,
            CanjeMomentosTaboada.estado == "COMPLETADO",
        ).sort("-created_at").to_list()

        total_sellos_canjeados = sum(c.sellos_utilizados for c in canjes)
        sellos_disponibles = max(0, total_sellos_ganados - total_sellos_canjeados)

        # Generar estado de la cartilla (1 al 30)
        # La cartilla tiene 30 casillas
        casillas_cartilla = []
        for i in range(1, 31):
            casillas_cartilla.append({
                "numero": i,
                "marcado": i <= sellos_disponibles,
                "es_hito": i in [5, 10, 15, 20, 25, 30],
            })

        return {
            "cliente": {
                "id": cliente_id_str,
                "nombre": cliente_nombre,
                "telefono": telefono_objetivo,
                "is_registrado": cliente is not None,
            },
            "balance": {
                "sellos_totales_ganados": total_sellos_ganados,
                "sellos_canjeados": total_sellos_canjeados,
                "sellos_disponibles": sellos_disponibles,
                "total_compras_campana_bs": round(total_gastado_campana, 2),
                "tickets_computados": len(ventas),
            },
            "cartilla_progreso": casillas_cartilla,
            "historial_tickets": historial_tickets,
            "historial_canjes": [
                {
                    "canje_id": str(c.id),
                    "fecha": c.created_at.isoformat(),
                    "premio_nombre": c.premio_nombre,
                    "sellos_utilizados": c.sellos_utilizados,
                    "copago_bs": c.copago_bs,
                    "sucursal_nombre": c.sucursal_nombre,
                }
                for c in canjes
            ],
        }

    @staticmethod
    async def registrar_canje(
        tenant_id: str,
        payload: Dict[str, Any],
        current_user: User,
    ) -> Dict[str, Any]:
        """
        Registra un canje de premio:
        1. Valida que el premio exista y tenga stock en la sucursal seleccionada.
        2. Valida que el cliente cuente con los sellos requeridos.
        3. Descuenta 1 unidad del stock de la sucursal.
        4. Registra el canje inmutablemente.
        5. Registra el ingreso en la Caja Chica / Fondo de la Promoción (separado del POS).
        """
        premio_id = payload.get("premio_id")
        sucursal_id = payload.get("sucursal_id")
        cliente_telefono = str(payload.get("cliente_telefono", "")).strip()
        cliente_nombre = str(payload.get("cliente_nombre", "")).strip() or "Cliente"
        metodo_pago = payload.get("metodo_pago", "EFECTIVO")
        notas = payload.get("notas", "")

        if not premio_id or not sucursal_id or not cliente_telefono:
            raise HTTPException(status_code=400, detail="Faltan datos obligatorios (premio, sucursal, teléfono)")

        premio = await PremioMomentosTaboada.get(PydanticObjectId(premio_id))
        if not premio or premio.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Premio no encontrado")

        # 1. Validar stock en la sucursal
        stock_actual = premio.stock_por_sucursal.get(sucursal_id, 0)
        if stock_actual <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Stock agotado de '{premio.nombre}' en la sucursal seleccionada. Stock disponible: 0",
            )

        # 2. Validar sellos disponibles del cliente
        consulta_sellos = await MomentosTaboadaService.buscar_cliente_sellos(tenant_id, cliente_telefono)
        sellos_disponibles = consulta_sellos["balance"]["sellos_disponibles"]

        if sellos_disponibles < premio.sellos_requeridos:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Sellos insuficientes. Se requieren {premio.sellos_requeridos} sellos, "
                    f"pero el cliente tiene {sellos_disponibles} sellos disponibles."
                ),
            )

        # Resolver nombre de sucursal
        sucursal = await Sucursal.get(PydanticObjectId(sucursal_id)) if PydanticObjectId.is_valid(sucursal_id) else None
        sucursal_nombre = sucursal.nombre if sucursal else "Sucursal"

        # 3. Descontar stock atómicamente
        premio.stock_por_sucursal[sucursal_id] = stock_actual - 1
        premio.updated_at = datetime.now(timezone.utc)
        await premio.save()

        # 4. Crear Canje
        nuevo_canje = CanjeMomentosTaboada(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            sucursal_nombre=sucursal_nombre,
            cliente_id=consulta_sellos["cliente"]["id"],
            cliente_nombre=consulta_sellos["cliente"]["nombre"] or cliente_nombre,
            cliente_telefono=cliente_telefono,
            premio_id=str(premio.id),
            premio_codigo=premio.codigo,
            premio_nombre=premio.nombre,
            sellos_utilizados=premio.sellos_requeridos,
            copago_bs=premio.copago_bs,
            metodo_pago=metodo_pago,
            cajero_id=str(current_user.id),
            cajero_nombre=current_user.full_name or current_user.username,
            estado="COMPLETADO",
            notas=notas,
        )
        await nuevo_canje.create()

        # 5. Registrar en Caja Chica / Fondo Separado de la Promoción (OPCIÓN B)
        movimiento_fondo = MovimientoCajaChicaTaboada(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            sucursal_nombre=sucursal_nombre,
            tipo="INGRESO_CANJE",
            monto=premio.copago_bs,
            metodo_pago=metodo_pago,
            canje_id=str(nuevo_canje.id),
            descripcion=f"Aporte Canje {premio.nombre} ({premio.sellos_requeridos} sellos + Bs {premio.copago_bs})",
            usuario_id=str(current_user.id),
            usuario_nombre=current_user.full_name or current_user.username,
        )
        await movimiento_fondo.create()

        return {
            "status": "success",
            "message": f"Canje registrado con éxito: {premio.nombre}",
            "canje_id": str(nuevo_canje.id),
            "sellos_descontados": premio.sellos_requeridos,
            "sellos_restantes": sellos_disponibles - premio.sellos_requeridos,
            "copago_recaudado_bs": premio.copago_bs,
            "stock_restante_sucursal": premio.stock_por_sucursal[sucursal_id],
        }

    @staticmethod
    async def get_dashboard_metricas(tenant_id: str) -> Dict[str, Any]:
        """Calcula las métricas ejecutivas de la campaña para el admin."""
        # 1. Total canjes completados
        canjes = await CanjeMomentosTaboada.find(
            CanjeMomentosTaboada.tenant_id == tenant_id,
            CanjeMomentosTaboada.estado == "COMPLETADO",
        ).to_list()

        total_canjes = len(canjes)
        total_sellos_redimidos = sum(c.sellos_utilizados for c in canjes)
        total_recaudado_fondo = sum(c.copago_bs for c in canjes)
        recaudado_efectivo = sum(c.copago_bs for c in canjes if c.metodo_pago == "EFECTIVO")
        recaudado_qr = sum(c.copago_bs for c in canjes if c.metodo_pago == "QR")

        # 2. Premios y stocks
        premios = await MomentosTaboadaService.get_or_seed_premios(tenant_id)
        resumen_premios = []
        for p in premios:
            stock_total = sum(p.stock_por_sucursal.values())
            canjeados_premio = sum(1 for c in canjes if c.premio_codigo == p.codigo)
            resumen_premios.append({
                "id": str(p.id),
                "codigo": p.codigo,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "sellos_requeridos": p.sellos_requeridos,
                "copago_bs": p.copago_bs,
                "imagen_url": p.imagen_url,
                "stock_total": stock_total,
                "stock_por_sucursal": p.stock_por_sucursal,
                "total_canjeados": canjeados_premio,
            })

        # 3. Ventas totales participantes desde el 1 de noviembre
        ventas_campana = await Sale.find(
            Sale.tenant_id == tenant_id,
            Sale.anulada == False,
            Sale.created_at >= FECHA_INICIO_CAMPANA,
        ).to_list()

        total_facturado_campana = sum(float(v.total) for v in ventas_campana)
        total_sellos_emitidos = sum(int(float(v.total) // 30) for v in ventas_campana)

        return {
            "fecha_inicio": FECHA_INICIO_CAMPANA.isoformat(),
            "metricas": {
                "total_canjes": total_canjes,
                "total_sellos_redimidos": total_sellos_redimidos,
                "total_sellos_emitidos": total_sellos_emitidos,
                "sellos_circulantes": max(0, total_sellos_emitidos - total_sellos_redimidos),
                "total_recaudado_fondo_bs": round(total_recaudado_fondo, 2),
                "recaudado_efectivo_bs": round(recaudado_efectivo, 2),
                "recaudado_qr_bs": round(recaudado_qr, 2),
                "total_facturado_ventas_bs": round(total_facturado_campana, 2),
                "total_tickets_participantes": len(ventas_campana),
            },
            "premios": resumen_premios,
        }

    @staticmethod
    async def get_caja_chica_movimientos(
        tenant_id: str, sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Retorna el balance y los movimientos del fondo promocional de Momentos Taboada."""
        filtros: Dict[str, Any] = {"tenant_id": tenant_id}
        if sucursal_id and sucursal_id != "TODAS":
            filtros["sucursal_id"] = sucursal_id

        movimientos = await MovimientoCajaChicaTaboada.find(filtros).sort("-created_at").to_list()

        ingresos = sum(m.monto for m in movimientos if m.tipo == "INGRESO_CANJE")
        egresos = sum(m.monto for m in movimientos if m.tipo == "EGRESO_FONDO")
        saldo_fondo = ingresos - egresos

        return {
            "saldo_fondo_bs": round(saldo_fondo, 2),
            "total_ingresos_bs": round(ingresos, 2),
            "total_egresos_bs": round(egresos, 2),
            "movimientos": [
                {
                    "id": str(m.id),
                    "fecha": m.created_at.isoformat(),
                    "sucursal_nombre": m.sucursal_nombre,
                    "tipo": m.tipo,
                    "monto": m.monto,
                    "metodo_pago": m.metodo_pago,
                    "descripcion": m.descripcion,
                    "usuario_nombre": m.usuario_nombre,
                }
                for m in movimientos
            ],
        }
