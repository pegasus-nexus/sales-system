import asyncio
import logging
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from pymongo import ReturnDocument

from app.domain.models.caja import CajaMovimiento, CajaSesion, EstadoSesion, SubtipoMovimiento
from app.domain.models.cliente import Cliente
from app.domain.models.inventario import Inventario, InventoryLog, TipoMovimiento
from app.domain.models.product import Product
from app.domain.models.sale import EstadoPago, PagoItem, Sale, SaleItem
from app.domain.models.sale_item import SaleItem as SaleItemAnalytics
from app.domain.models.user import User, UserRole
from app.domain.models.base import DecimalMoney
from app.infrastructure.core.config import settings
from app.infrastructure.db import get_client
from app.utils.errors import VentasErrors

logger = logging.getLogger("SalesAnulacionService")


class SalesAnulacionService:
    @staticmethod
    def _get_sale_repo():
        from app.infrastructure.repositories.mongo_sale_repository import MongoSaleRepository
        return MongoSaleRepository()

    @staticmethod
    async def anular_sale(
        sale_id: str,
        current_user: User,
        motivo: str,
        notas: Optional[str] = None,
        metodo_pago_correcto: Optional[str] = None,
        afectar_caja: bool = True,
        caja_sesion_id: Optional[str] = None,
    ) -> Sale:
        """
        Anula una venta con lógica inteligente según el motivo:

        - ERROR_COBRO: El método de pago fue registrado incorrectamente.
          Se anulan los movimientos del método INCORRECTO y (opcionalmente) se
          registra un ingreso con el método CORRECTO. Esto no genera desajuste.

        - DEVOLUCION_CLIENTE / PRODUCTO_DEFECTUOSO: El dinero sí ingresó.
          Se invierten los movimientos reales (egreso del método real).

        - VENTA_DUPLICADA: La venta se cobró dos veces. Se invierten los
          movimientos de caja de la venta duplicada.

        - OTRO: Comportamiento estándar (inversión de movimientos).
        """
        if current_user.role == UserRole.FACTURADOR:
            raise HTTPException(status_code=403, detail="Un facturador no tiene permisos para anular ventas")
        tenant_id = current_user.tenant_id or "default"
        client = get_client()

        # Validar que si es ERROR_COBRO, se debe especificar el método correcto
        if motivo == "ERROR_COBRO" and not metodo_pago_correcto:
            raise HTTPException(
                status_code=400,
                detail="Para anular por 'Error de cobro' debes especificar cuál fue el método de pago real."
            )

        sale_obj = None
        try:
            async with await client.start_session() as session:
                async with session.start_transaction():
                    sale = await SalesAnulacionService._get_sale_repo().get_by_id(sale_id, session=session)
                    if not sale or sale.tenant_id != tenant_id:
                        raise HTTPException(status_code=404, detail=VentasErrors.VENTA_NO_ENCONTRADA)

                    if sale.anulada:
                        raise HTTPException(status_code=400, detail=VentasErrors.VENTA_YA_ANULADA)

                    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR, UserRole.CAJERO]:
                        if sale.sucursal_id != current_user.sucursal_id:
                            raise HTTPException(status_code=403, detail="Solo puedes anular ventas de tu propia sucursal")

                    if current_user.role == UserRole.CAJERO:
                        if sale.cashier_id != str(current_user.id):
                            raise HTTPException(status_code=403, detail="Los cajeros solo pueden anular sus propias ventas")
                        hours_diff = (datetime.utcnow() - sale.created_at).total_seconds() / 3600
                        if hours_diff > 24:
                            raise HTTPException(status_code=403, detail="Un cajero no puede anular una venta pasada de 24 horas.")

                    sucursal_id = sale.sucursal_id

                    # ── 1. Revertir stock (siempre, por almacén específico del ítem) ──
                    for item in sale.items:
                        product = await Product.get(item.producto_id, session=session)
                        es_fisico = product.tipo_item == "FISICO" if product else True

                        if es_fisico:
                            item_almacen_id_anul = getattr(item, "almacen_id", None) or sale.almacen_id or "default"

                            inv_query_anul = {
                                "tenant_id": tenant_id,
                                "sucursal_id": sucursal_id,
                                "producto_id": item.producto_id,
                            }
                            if item_almacen_id_anul == "default":
                                inv_query_anul["$or"] = [{"almacen_id": "default"}, {"almacen_id": {"$exists": False}}]
                            else:
                                inv_query_anul["almacen_id"] = item_almacen_id_anul

                            updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                                inv_query_anul,
                                {"$inc": {"cantidad": item.cantidad}},
                                return_document=ReturnDocument.AFTER,
                                session=session.client_session if hasattr(session, "client_session") else session
                            )
                            if updated_inv:
                                await InventoryLog(
                                    tenant_id=tenant_id,
                                    sucursal_id=sucursal_id,
                                    almacen_id=item_almacen_id_anul,
                                    producto_id=item.producto_id,
                                    descripcion=item.descripcion,
                                    tipo_movimiento=TipoMovimiento.ANULACION,
                                    cantidad_movida=item.cantidad,
                                    stock_resultante=updated_inv["cantidad"],
                                    costo_unitario_momento=item.costo_unitario,
                                    precio_venta_momento=item.precio_unitario,
                                    usuario_id=str(current_user.id),
                                    usuario_nombre=current_user.full_name or current_user.username,
                                    notas=f"Anulación de Venta #{str(sale.id)[-6:]} — Motivo: {motivo}",
                                    referencia_id=str(sale.id)
                                ).create(session=session)

                    # ── 1.5 Revertir deuda de crédito ──
                    has_credit_payment = any(p.metodo == "CREDITO" for p in sale.pagos)
                    if has_credit_payment:
                        from app.domain.models.credito import Deuda, EstadoDeuda, CuentaCredito, TransaccionCredito
                        deuda = await Deuda.find_one(Deuda.sale_id == str(sale.id), session=session)
                        if deuda and deuda.estado != EstadoDeuda.ANULADA:
                            cuenta = await CuentaCredito.get(deuda.cuenta_id, session=session)
                            if cuenta:
                                from decimal import Decimal
                                nuevo_saldo = max(Decimal("0"), Decimal(str(cuenta.saldo_total)) - Decimal(str(deuda.saldo_pendiente)))
                                cuenta.saldo_total = DecimalMoney(str(nuevo_saldo))
                                cuenta.updated_at = datetime.utcnow()
                                await cuenta.save(session=session)

                            transaccion = TransaccionCredito(
                                tenant_id=sale.tenant_id,
                                sucursal_id=sale.sucursal_id,
                                cuenta_id=deuda.cuenta_id,
                                cliente_id=deuda.cliente_id,
                                tipo="ABONO",
                                monto=deuda.saldo_pendiente,
                                sale_id=str(sale.id),
                                cajero_id=str(current_user.id),
                                cajero_nombre=current_user.full_name or current_user.username,
                                notas=f"Reverso por Anulación de Venta #{str(sale.id)[-6:].upper()} — Motivo: {motivo}"
                            )
                            await transaccion.insert(session=session)

                            deuda.saldo_pendiente = DecimalMoney("0")
                            deuda.estado = EstadoDeuda.ANULADA
                            deuda.updated_at = datetime.utcnow()
                            await deuda.save(session=session)

                    if sale.cliente_id:
                        from beanie.operators import Inc
                        await Cliente.find_one(Cliente.id == sale.cliente_id, session=session).update(
                            Inc({Cliente.total_compras: -sale.total}),
                            Inc({Cliente.cantidad_compras: -1}),
                            session=session
                        )

                    # ── 2. Ajuste de caja según motivo ──
                    if afectar_caja:
                        if caja_sesion_id:
                            caja_sesion = await CajaSesion.get(caja_sesion_id, session=session)
                            if caja_sesion and caja_sesion.estado != EstadoSesion.ABIERTA:
                                caja_sesion = None
                        else:
                            caja_sesion = await CajaSesion.find_one(
                                CajaSesion.tenant_id   == tenant_id,
                                CajaSesion.sucursal_id == sucursal_id,
                                CajaSesion.cajero_id   == str(current_user.id),
                                CajaSesion.estado      == EstadoSesion.ABIERTA,
                                session=session
                            )

                        if not caja_sesion:
                            if len(sale.pagos) > 0 and sum(p.monto for p in sale.pagos) > 0:
                                raise HTTPException(
                                    status_code=400,
                                    detail="No puedes anular una venta y afectar caja sin tener una sesión de caja ABIERTA. Abre la caja primero o elige 'No afectar caja'."
                                )
                        else:
                            movs_originales = await CajaMovimiento.find(
                                CajaMovimiento.tenant_id == tenant_id,
                                CajaMovimiento.sale_id == str(sale.id),
                                session=session
                            ).to_list()

                            ticket_ref = f"#{str(sale.id)[-6:].upper()}"
                            cajero_info = current_user.full_name or current_user.username

                            if motivo == "VENTA_DUPLICADA":
                                for mov in movs_originales:
                                    inverse_type = "EGRESO" if mov.tipo == "INGRESO" else "INGRESO"
                                    await CajaMovimiento(
                                        tenant_id   = tenant_id,
                                        sucursal_id = sucursal_id,
                                        sesion_id   = str(caja_sesion.id),
                                        cajero_id   = str(current_user.id),
                                        cajero_name = cajero_info,
                                        subtipo     = mov.subtipo,
                                        tipo        = inverse_type,
                                        monto       = mov.monto,
                                        descripcion = f"Venta Duplicada — Reversa Ticket {ticket_ref} ({mov.subtipo})",
                                        sale_id     = str(sale.id),
                                    ).create(session=session)
                            else:
                                for mov in movs_originales:
                                    inverse_type = "EGRESO" if mov.tipo == "INGRESO" else "INGRESO"
                                    motivo_label = {
                                        "DEVOLUCION_CLIENTE": "Devolución de Cliente",
                                        "PRODUCTO_DEFECTUOSO": "Prod. Defectuoso",
                                        "ERROR_COBRO": "Error de Cobro",
                                        "OTRO": "Anulación"
                                    }.get(motivo, motivo)
                                    await CajaMovimiento(
                                        tenant_id   = tenant_id,
                                        sucursal_id = sucursal_id,
                                        sesion_id   = str(caja_sesion.id),
                                        cajero_id   = str(current_user.id),
                                        cajero_name = cajero_info,
                                        subtipo     = mov.subtipo,
                                        tipo        = inverse_type,
                                        monto       = mov.monto,
                                        descripcion = f"{motivo_label} — Reversa Ticket {ticket_ref} ({mov.subtipo})",
                                        sale_id     = str(sale.id),
                                    ).create(session=session)

                    # ── 3. Guardar auditoría de anulación en venta original ──
                    sale.anulada              = True
                    sale.motivo_anulacion     = motivo
                    sale.notas_anulacion      = notas
                    sale.anulada_por_id       = str(current_user.id)
                    sale.anulada_por_nombre   = current_user.full_name or current_user.username
                    sale.anulada_at           = datetime.utcnow()
                    sale.metodo_pago_correcto = metodo_pago_correcto
                    await SalesAnulacionService._get_sale_repo().update(sale, session=session)

                    await SaleItemAnalytics.find(
                        SaleItemAnalytics.tenant_id == tenant_id,
                        SaleItemAnalytics.sale_id == str(sale.id),
                        session=session
                    ).delete(session=session)

                    # ── 4. CLONAR Y CREAR NUEVA VENTA CON MÉTODO CORRECTO (Para ERROR_COBRO) ──
                    if motivo == "ERROR_COBRO":
                        from bson import ObjectId

                        new_sale_id = str(ObjectId())

                        for item in sale.items:
                            product = await Product.get(item.producto_id, session=session)
                            es_fisico = product.tipo_item == "FISICO" if product else True

                            if es_fisico:
                                inv_query_corr = {
                                    "tenant_id": tenant_id,
                                    "sucursal_id": sucursal_id,
                                    "producto_id": item.producto_id,
                                }
                                if sale.almacen_id == "default":
                                    inv_query_corr["$or"] = [{"almacen_id": "default"}, {"almacen_id": {"$exists": False}}]
                                else:
                                    inv_query_corr["almacen_id"] = sale.almacen_id

                                updated_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                                    inv_query_corr,
                                    {"$inc": {"cantidad": -item.cantidad}},
                                    return_document=ReturnDocument.AFTER,
                                    session=session.client_session if hasattr(session, "client_session") else session
                                )
                                if updated_inv:
                                    await InventoryLog(
                                        tenant_id=tenant_id,
                                        sucursal_id=sucursal_id,
                                        almacen_id=sale.almacen_id,
                                        producto_id=item.producto_id,
                                        descripcion=item.descripcion,
                                        tipo_movimiento=TipoMovimiento.VENTA,
                                        cantidad_movida=-item.cantidad,
                                        stock_resultante=updated_inv["cantidad"],
                                        costo_unitario_momento=item.costo_unitario,
                                        precio_venta_momento=item.precio_unitario,
                                        usuario_id=str(current_user.id),
                                        usuario_nombre=current_user.full_name or current_user.username,
                                        notas=f"Salida por Venta POS (Corrección de Ticket #{str(sale.id)[-6:].upper()})",
                                        referencia_id=new_sale_id
                                    ).create(session=session)

                            await SaleItemAnalytics(
                                tenant_id=tenant_id,
                                sucursal_id=sucursal_id,
                                sale_id=new_sale_id,
                                sale_date=datetime.utcnow(),
                                producto_id=item.producto_id,
                                descripcion=item.descripcion,
                                cantidad=item.cantidad,
                                precio_unitario=item.precio_unitario,
                                costo_unitario=item.costo_unitario,
                                descuento_unitario=item.descuento_unitario,
                                subtotal=item.subtotal
                            ).create(session=session)

                        new_pagos = [PagoItem(metodo=metodo_pago_correcto, monto=sale.total)]

                        new_sale = Sale(
                            id=ObjectId(new_sale_id),
                            tenant_id=tenant_id,
                            sucursal_id=sucursal_id,
                            almacen_id=sale.almacen_id,
                            items=sale.items,
                            total=sale.total,
                            pagos=new_pagos,
                            descuento=sale.descuento,
                            cliente_id=sale.cliente_id,
                            cliente=sale.cliente,
                            cashier_id=str(current_user.id),
                            cashier_name=current_user.full_name or current_user.username,
                            vendedor_id=sale.vendedor_id,
                            vendedor_name=sale.vendedor_name,
                            anulada=False,
                            created_at=datetime.utcnow(),
                            notas_anulacion=f"[Creada automáticamente por corrección del Ticket #{str(sale.id)[-6:].upper()}]"
                        )
                        await SalesAnulacionService._get_sale_repo().add(new_sale, session=session)

                        if new_sale.cliente_id:
                            from beanie.operators import Inc, Set
                            await Cliente.find_one(Cliente.id == new_sale.cliente_id, session=session).update(
                                Inc({Cliente.total_compras: new_sale.total}),
                                Inc({Cliente.cantidad_compras: 1}),
                                Set({Cliente.ultima_compra_at: new_sale.created_at}),
                                session=session
                            )

                        if afectar_caja and caja_sesion:
                            _SUBTIPO_MAP = {
                                "EFECTIVO": SubtipoMovimiento.VENTA_EFECTIVO,
                                "QR":       SubtipoMovimiento.VENTA_QR,
                                "TARJETA":  SubtipoMovimiento.VENTA_TARJETA,
                                "TRANSFERENCIA": SubtipoMovimiento.VENTA_QR,
                            }
                            subtipo = _SUBTIPO_MAP.get(metodo_pago_correcto, SubtipoMovimiento.VENTA_EFECTIVO)
                            await CajaMovimiento(
                                tenant_id   = tenant_id,
                                sucursal_id = sucursal_id,
                                sesion_id   = str(caja_sesion.id),
                                cajero_id   = str(current_user.id),
                                cajero_name = cajero_info,
                                subtipo     = subtipo,
                                tipo        = "INGRESO",
                                monto       = sale.total,
                                descripcion = f"Corrección Ticket #{str(sale.id)[-6:].upper()}: Ingreso real vía {metodo_pago_correcto} — {notas or 'Error de cobro'}",
                                sale_id     = new_sale_id,
                            ).create(session=session)

                    sale_obj = sale
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[SalesAnulacionService.anular_sale] Transaction aborted: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error transaccional al anular la venta: {str(e)}")

        if sale_obj:
            async def _sync_anular_background():
                try:
                    db_raw = get_client()[settings.MONGODB_DB_NAME]
                    await db_raw.ventas_historicas_crudas.delete_many(
                        {"original_sale_id": sale_obj.id}
                    )
                except Exception as e:
                    logger.error(f"Error en segundo plano eliminando venta anulada de ventas_historicas_crudas: {e}", exc_info=True)

            asyncio.create_task(_sync_anular_background())

        return sale_obj
