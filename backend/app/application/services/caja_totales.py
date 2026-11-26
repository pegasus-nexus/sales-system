"""
Totales de una sesión de caja calculados SOLO desde sus propios movimientos.

Regla: una caja = una cajera = una sesión. Todo lo que el reporte muestra
(efectivo, QR, tarjeta, total de ventas) debe poder reconstruirse a partir de
la bitácora de esa sesión. Nunca se consultan ventas por sucursal + horario,
porque eso mezcla las ventas de otras cajas abiertas al mismo tiempo.
"""
from collections.abc import Iterable
from dataclasses import dataclass, field
from decimal import Decimal

from app.domain.models.caja import CajaMovimiento, SubtipoMovimiento

_VENTA_SUBTIPOS = {
    SubtipoMovimiento.VENTA_EFECTIVO,
    SubtipoMovimiento.VENTA_QR,
    SubtipoMovimiento.VENTA_TARJETA,
}


def _dec(v) -> Decimal:
    return Decimal(str(v)) if v is not None else Decimal("0")


@dataclass
class TotalesSesion:
    monto_inicial: Decimal = Decimal("0")
    ventas_efectivo: Decimal = Decimal("0")
    ingresos_efectivo: Decimal = Decimal("0")
    cambio: Decimal = Decimal("0")
    gastos: Decimal = Decimal("0")
    ajustes: Decimal = Decimal("0")
    ventas_qr: Decimal = Decimal("0")
    ventas_tarjeta: Decimal = Decimal("0")
    ingresos_qr: Decimal = Decimal("0")
    ingresos_tarjeta: Decimal = Decimal("0")
    sale_ids: set[str] = field(default_factory=set)

    @property
    def saldo_calculado(self) -> Decimal:
        return (self.monto_inicial + self.ventas_efectivo + self.ingresos_efectivo
                - self.cambio - self.gastos + self.ajustes)

    @property
    def efectivo_neto(self) -> Decimal:
        """Efectivo que realmente quedó por ventas (recibido - cambio)."""
        return self.ventas_efectivo - self.cambio

    @property
    def total_qr(self) -> Decimal:
        return self.ventas_qr + self.ingresos_qr

    @property
    def total_tarjeta(self) -> Decimal:
        return self.ventas_tarjeta + self.ingresos_tarjeta

    @property
    def total_ventas(self) -> Decimal:
        """Total de la sesión tal como lo arma el PDF: (efectivo neto + ingresos ef.) + QR + tarjeta.

        QR y tarjeta ya incluyen sus ingresos manuales, así que cada fila del
        reporte suma exactamente este total.
        """
        return self.efectivo_neto + self.ingresos_efectivo + self.total_qr + self.total_tarjeta


def calcular_totales(movimientos: Iterable[CajaMovimiento], monto_inicial) -> TotalesSesion:
    t = TotalesSesion(monto_inicial=_dec(monto_inicial))
    for m in movimientos:
        monto = _dec(m.monto)
        signo_ingreso = monto if m.tipo == "INGRESO" else -monto
        signo_egreso = monto if m.tipo == "EGRESO" else -monto
        st = m.subtipo
        if st == SubtipoMovimiento.VENTA_EFECTIVO:
            t.ventas_efectivo += signo_ingreso
        elif st == SubtipoMovimiento.VENTA_QR:
            t.ventas_qr += signo_ingreso
        elif st == SubtipoMovimiento.VENTA_TARJETA:
            t.ventas_tarjeta += signo_ingreso
        elif st == SubtipoMovimiento.INGRESO_EFECTIVO:
            t.ingresos_efectivo += signo_ingreso
        elif st == SubtipoMovimiento.INGRESO_QR:
            t.ingresos_qr += signo_ingreso
        elif st == SubtipoMovimiento.INGRESO_TARJETA:
            t.ingresos_tarjeta += signo_ingreso
        elif st == SubtipoMovimiento.CAMBIO:
            t.cambio += signo_egreso
        elif st == SubtipoMovimiento.GASTO:
            t.gastos += signo_egreso
        elif st == SubtipoMovimiento.AJUSTE:
            t.ajustes += signo_ingreso
        if st in _VENTA_SUBTIPOS and m.tipo == "INGRESO" and m.sale_id:
            t.sale_ids.add(m.sale_id)
    return t


def money(v: Decimal) -> float:
    """Redondeo a 2 decimales para la respuesta JSON (los schemas usan float)."""
    return float(round(v, 2))
