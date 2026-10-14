from typing import Optional, List
from datetime import datetime, timezone
from decimal import Decimal

from app.domain.models.contabilidad import (
    CuentaContable, AsientoContable, LineaAsiento, NaturalezaCuenta
)
from app.domain.models.base import DecimalMoney
from app.domain.models.compra import PurchaseReception
from app.domain.models.sale import Sale
from app.domain.models.caja import CajaMovimiento
from app.application.services.contabilidad_service import ContabilidadService

class ContabilidadAutoPostingService:
    @staticmethod
    async def _get_next_asiento_numero(tenant_id: str, session=None) -> int:
        col = AsientoContable.get_pymongo_collection()
        last = await col.find(
            {"tenant_id": tenant_id},
            session=session.client_session if hasattr(session, "client_session") else session
        ).sort("numero", -1).limit(1).to_list(length=1)
        if last and "numero" in last[0]:
            return int(last[0]["numero"]) + 1
        return 1

    @staticmethod
    async def _get_or_seed_account(tenant_id: str, codigo: str, session=None) -> Optional[CuentaContable]:
        cuenta = await CuentaContable.find_one(
            CuentaContable.tenant_id == tenant_id,
            CuentaContable.codigo == codigo,
            CuentaContable.is_active == True,
            session=session
        )
        if not cuenta:
            # Intentar inicializar plan de cuentas si no existe
            await ContabilidadService.seed_plan_cuentas(tenant_id, "SYSTEM_AUTOPOSTING")
            cuenta = await CuentaContable.find_one(
                CuentaContable.tenant_id == tenant_id,
                CuentaContable.codigo == codigo,
                CuentaContable.is_active == True,
                session=session
            )
        return cuenta

    @staticmethod
    async def _update_account_balance(cuenta: CuentaContable, delta_debe: Decimal, delta_haber: Decimal, session=None):
        saldo_actual = Decimal(str(cuenta.saldo_actual))
        if cuenta.naturaleza == NaturalezaCuenta.DEUDORA:
            saldo_actual += (delta_debe - delta_haber)
        else:
            saldo_actual += (delta_haber - delta_debe)
        cuenta.saldo_actual = DecimalMoney(str(saldo_actual))
        await cuenta.save(session=session)

    @classmethod
    async def post_purchase_reception(
        cls, 
        reception: PurchaseReception, 
        usuario_nombre: str, 
        session=None
    ) -> Optional[AsientoContable]:
        """
        Genera el asiento contable por ingreso de mercadería (Compra):
        DEBE:  1.1.3 Inventarios
        HABER: 1.1.1 Caja y Bancos (si es contado) o 2.1.1 Cuentas por Pagar (si es crédito/consignación)
        """
        total = Decimal(str(reception.total_real))
        if total <= Decimal("0"):
            return None

        tenant_id = reception.tenant_id
        cta_inventario = await cls._get_or_seed_account(tenant_id, "1.1.3", session=session)
        
        is_credito = reception.metodo_pago in ["CREDITO", "CONSIGNACION"]
        haber_codigo = "2.1.1" if is_credito else "1.1.1"
        cta_haber = await cls._get_or_seed_account(tenant_id, haber_codigo, session=session)

        if not cta_inventario or not cta_haber:
            return None

        total_dm = DecimalMoney(str(total))
        lineas = [
            LineaAsiento(
                cuenta_id=str(cta_inventario.id),
                cuenta_codigo=cta_inventario.codigo,
                cuenta_nombre=cta_inventario.nombre,
                debe=total_dm,
                haber=DecimalMoney("0.00"),
                descripcion=f"Ingreso de mercadería según Doc: {reception.numero_documento}"
            ),
            LineaAsiento(
                cuenta_id=str(cta_haber.id),
                cuenta_codigo=cta_haber.codigo,
                cuenta_nombre=cta_haber.nombre,
                debe=DecimalMoney("0.00"),
                haber=total_dm,
                descripcion=f"Pago/Compromiso compra {reception.proveedor_nombre} ({reception.metodo_pago})"
            )
        ]

        numero = await cls._get_next_asiento_numero(tenant_id, session=session)
        asiento = AsientoContable(
            tenant_id=tenant_id,
            numero=numero,
            fecha=reception.fecha_recepcion or datetime.now(timezone.utc),
            descripcion=f"Compra/Ingreso de mercadería a {reception.proveedor_nombre} (Doc {reception.numero_documento})",
            lineas=lineas,
            total_debe=total_dm,
            total_haber=total_dm,
            referencia_tipo="COMPRA",
            referencia_id=str(reception.id),
            es_automatico=True,
            creado_por=usuario_nombre
        )
        await asiento.insert(session=session)

        await cls._update_account_balance(cta_inventario, delta_debe=total, delta_haber=Decimal("0"), session=session)
        await cls._update_account_balance(cta_haber, delta_debe=Decimal("0"), delta_haber=total, session=session)

        return asiento

    @classmethod
    async def post_sale(
        cls, 
        sale: Sale, 
        usuario_nombre: str, 
        session=None
    ) -> Optional[AsientoContable]:
        """
        Genera el asiento contable por venta y costo de ventas:
        Asiento 1: Ingreso por ventas
          DEBE: 1.1.1 Caja y Bancos (pagos contado/qr/tarjeta) y/o 1.1.2 Cuentas por Cobrar (crédito)
          HABER: 4.1 Ventas Netas
        Asiento 2: Reconocimiento del Costo de Ventas
          DEBE: 5.1 Costo de Ventas
          HABER: 1.1.3 Inventarios
        """
        total_venta = Decimal(str(sale.total))
        if total_venta <= Decimal("0"):
            return None

        tenant_id = sale.tenant_id
        cta_caja = await cls._get_or_seed_account(tenant_id, "1.1.1", session=session)
        cta_cxc = await cls._get_or_seed_account(tenant_id, "1.1.2", session=session)
        cta_ventas = await cls._get_or_seed_account(tenant_id, "4.1", session=session)
        cta_costo = await cls._get_or_seed_account(tenant_id, "5.1", session=session)
        cta_inventario = await cls._get_or_seed_account(tenant_id, "1.1.3", session=session)

        if not cta_caja or not cta_ventas:
            return None

        # Desglose de pagos
        monto_credito = Decimal("0")
        for pago in getattr(sale, "pagos", []):
            if pago.metodo == "CREDITO":
                monto_credito += Decimal(str(pago.monto))
        
        monto_contado = total_venta - monto_credito
        if monto_contado < Decimal("0"):
            monto_contado = Decimal("0")

        lineas: List[LineaAsiento] = []
        if monto_contado > Decimal("0"):
            lineas.append(LineaAsiento(
                cuenta_id=str(cta_caja.id),
                cuenta_codigo=cta_caja.codigo,
                cuenta_nombre=cta_caja.nombre,
                debe=DecimalMoney(str(monto_contado)),
                haber=DecimalMoney("0.00"),
                descripcion=f"Cobro venta #{str(sale.id)[-6:]}"
            ))
            await cls._update_account_balance(cta_caja, delta_debe=monto_contado, delta_haber=Decimal("0"), session=session)

        if monto_credito > Decimal("0") and cta_cxc:
            lineas.append(LineaAsiento(
                cuenta_id=str(cta_cxc.id),
                cuenta_codigo=cta_cxc.codigo,
                cuenta_nombre=cta_cxc.nombre,
                debe=DecimalMoney(str(monto_credito)),
                haber=DecimalMoney("0.00"),
                descripcion=f"Venta al crédito cliente #{str(sale.id)[-6:]}"
            ))
            await cls._update_account_balance(cta_cxc, delta_debe=monto_credito, delta_haber=Decimal("0"), session=session)

        # Haber: Ventas Netas
        lineas.append(LineaAsiento(
            cuenta_id=str(cta_ventas.id),
            cuenta_codigo=cta_ventas.codigo,
            cuenta_nombre=cta_ventas.nombre,
            debe=DecimalMoney("0.00"),
            haber=DecimalMoney(str(total_venta)),
            descripcion=f"Ingreso por venta POS #{str(sale.id)[-6:]}"
        ))
        await cls._update_account_balance(cta_ventas, delta_debe=Decimal("0"), delta_haber=total_venta, session=session)

        # Costo de ventas (si hay productos físicos con costo)
        total_costo = Decimal("0")
        for item in sale.items:
            c_unit = Decimal(str(item.costo_unitario))
            total_costo += c_unit * Decimal(str(item.cantidad))

        if total_costo > Decimal("0") and cta_costo and cta_inventario:
            lineas.append(LineaAsiento(
                cuenta_id=str(cta_costo.id),
                cuenta_codigo=cta_costo.codigo,
                cuenta_nombre=cta_costo.nombre,
                debe=DecimalMoney(str(total_costo)),
                haber=DecimalMoney("0.00"),
                descripcion=f"Costo de ventas mercadería #{str(sale.id)[-6:]}"
            ))
            lineas.append(LineaAsiento(
                cuenta_id=str(cta_inventario.id),
                cuenta_codigo=cta_inventario.codigo,
                cuenta_nombre=cta_inventario.nombre,
                debe=DecimalMoney("0.00"),
                haber=DecimalMoney(str(total_costo)),
                descripcion=f"Salida de inventario por venta #{str(sale.id)[-6:]}"
            ))
            await cls._update_account_balance(cta_costo, delta_debe=total_costo, delta_haber=Decimal("0"), session=session)
            await cls._update_account_balance(cta_inventario, delta_debe=Decimal("0"), delta_haber=total_costo, session=session)

        total_asiento_debe = sum((Decimal(str(l.debe)) for l in lineas), Decimal("0"))
        total_asiento_haber = sum((Decimal(str(l.haber)) for l in lineas), Decimal("0"))

        numero = await cls._get_next_asiento_numero(tenant_id, session=session)
        asiento = AsientoContable(
            tenant_id=tenant_id,
            numero=numero,
            fecha=sale.created_at,
            descripcion=f"Venta POS #{str(sale.id)[-6:]} y costo de mercadería",
            lineas=lineas,
            total_debe=DecimalMoney(str(total_asiento_debe)),
            total_haber=DecimalMoney(str(total_asiento_haber)),
            referencia_tipo="VENTA",
            referencia_id=str(sale.id),
            es_automatico=True,
            creado_por=usuario_nombre
        )
        await asiento.insert(session=session)
        return asiento

    @classmethod
    async def post_caja_movimiento(
        cls, 
        mov: CajaMovimiento, 
        session=None
    ) -> Optional[AsientoContable]:
        """
        Genera el asiento contable por movimiento manual de caja:
        EGRESO (Gasto Operativo):
          DEBE:  5.2 Gastos Operativos
          HABER: 1.1.1 Caja y Bancos
        INGRESO (Otro Ingreso):
          DEBE:  1.1.1 Caja y Bancos
          HABER: 4.2 Otros Ingresos
        """
        monto = Decimal(str(mov.monto))
        if monto <= Decimal("0"):
            return None

        tenant_id = mov.tenant_id
        cta_caja = await cls._get_or_seed_account(tenant_id, "1.1.1", session=session)
        if not cta_caja:
            return None

        monto_dm = DecimalMoney(str(monto))
        lineas: List[LineaAsiento] = []

        if mov.tipo == "EGRESO":
            cta_gasto = await cls._get_or_seed_account(tenant_id, "5.2", session=session)
            if not cta_gasto:
                return None
            lineas = [
                LineaAsiento(
                    cuenta_id=str(cta_gasto.id),
                    cuenta_codigo=cta_gasto.codigo,
                    cuenta_nombre=cta_gasto.nombre,
                    debe=monto_dm,
                    haber=DecimalMoney("0.00"),
                    descripcion=mov.descripcion or "Gasto operativo de caja"
                ),
                LineaAsiento(
                    cuenta_id=str(cta_caja.id),
                    cuenta_codigo=cta_caja.codigo,
                    cuenta_nombre=cta_caja.nombre,
                    debe=DecimalMoney("0.00"),
                    haber=monto_dm,
                    descripcion="Salida de efectivo de caja"
                )
            ]
            await cls._update_account_balance(cta_gasto, delta_debe=monto, delta_haber=Decimal("0"), session=session)
            await cls._update_account_balance(cta_caja, delta_debe=Decimal("0"), delta_haber=monto, session=session)
        else:
            cta_ingreso = await cls._get_or_seed_account(tenant_id, "4.2", session=session)
            if not cta_ingreso:
                return None
            lineas = [
                LineaAsiento(
                    cuenta_id=str(cta_caja.id),
                    cuenta_codigo=cta_caja.codigo,
                    cuenta_nombre=cta_caja.nombre,
                    debe=monto_dm,
                    haber=DecimalMoney("0.00"),
                    descripcion="Ingreso de efectivo a caja"
                ),
                LineaAsiento(
                    cuenta_id=str(cta_ingreso.id),
                    cuenta_codigo=cta_ingreso.codigo,
                    cuenta_nombre=cta_ingreso.nombre,
                    debe=DecimalMoney("0.00"),
                    haber=monto_dm,
                    descripcion=mov.descripcion or "Otros ingresos de caja"
                )
            ]
            await cls._update_account_balance(cta_caja, delta_debe=monto, delta_haber=Decimal("0"), session=session)
            await cls._update_account_balance(cta_ingreso, delta_debe=Decimal("0"), delta_haber=monto, session=session)

        numero = await cls._get_next_asiento_numero(tenant_id, session=session)
        asiento = AsientoContable(
            tenant_id=tenant_id,
            numero=numero,
            fecha=mov.fecha or datetime.now(timezone.utc),
            descripcion=f"Movimiento de Caja: {mov.tipo} - {mov.descripcion}",
            lineas=lineas,
            total_debe=monto_dm,
            total_haber=monto_dm,
            referencia_tipo="GASTO" if mov.tipo == "EGRESO" else "INGRESO_CAJA",
            referencia_id=str(mov.id),
            es_automatico=True,
            creado_por=mov.cajero_name or "Cajero"
        )
        await asiento.insert(session=session)
        return asiento
