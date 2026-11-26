"""Tests de lógica pura para calcular_totales (sin BD)."""
from decimal import Decimal
from types import SimpleNamespace

from app.application.services.caja_totales import calcular_totales, money
from app.domain.models.caja import SubtipoMovimiento as S

D = Decimal


def mov(subtipo, tipo, monto, sale_id=None):
    return SimpleNamespace(subtipo=subtipo, tipo=tipo, monto=monto, sale_id=sale_id)


def _sesion_leydi():
    movs = []
    n = 0

    def sid():
        nonlocal n
        n += 1
        return f"sale_{n}"

    for m in ("102", "100", "100", "50", "50"):
        movs.append(mov(S.VENTA_EFECTIVO, "INGRESO", D(m), sid()))
    for m in ("40", "69.50", "24.50", "28", "20"):
        movs.append(mov(S.CAMBIO, "EGRESO", D(m)))
    for m in ("30", "548.05", "100", "65", "52", "69", "30"):
        movs.append(mov(S.VENTA_QR, "INGRESO", D(m), sid()))
    return movs


def test_sesion_real_leydi():
    t = calcular_totales(_sesion_leydi(), D("1000"))
    assert t.efectivo_neto == D("220")
    assert t.total_qr == D("894.05")
    assert t.total_ventas == D("1114.05")
    assert t.saldo_calculado == D("1220")
    assert len(t.sale_ids) == 12


def test_anulacion_qr_resta():
    movs = [
        mov(S.VENTA_QR, "INGRESO", D("100"), "a"),
        mov(S.VENTA_QR, "EGRESO", D("40")),
    ]
    t = calcular_totales(movs, 0)
    assert t.total_qr == D("60")
    assert t.total_ventas == D("60")
    assert t.sale_ids == {"a"}  # el EGRESO no agrega sale_id


def test_ingresos_manuales_y_gastos():
    movs = [
        mov(S.INGRESO_EFECTIVO, "INGRESO", D("30")),
        mov(S.INGRESO_QR, "INGRESO", D("20")),
        mov(S.GASTO, "EGRESO", D("10")),
    ]
    t = calcular_totales(movs, D("100"))
    assert t.saldo_calculado == D("120")  # 100 + 30 - 10
    assert t.total_qr == D("20")
    assert t.total_ventas == D("50")  # 30 ef + 20 qr


def test_ajuste_suma_y_resta():
    t = calcular_totales([mov(S.AJUSTE, "INGRESO", D("5"))], D("100"))
    assert t.saldo_calculado == D("105")
    t = calcular_totales([mov(S.AJUSTE, "EGRESO", D("5"))], D("100"))
    assert t.saldo_calculado == D("95")


def test_tarjeta_y_decimales_exactos():
    movs = [
        mov(S.VENTA_TARJETA, "INGRESO", 0.1),
        mov(S.VENTA_TARJETA, "INGRESO", 0.2),
        mov(S.INGRESO_TARJETA, "INGRESO", D("1.005")),
    ]
    t = calcular_totales(movs, None)
    assert t.ventas_tarjeta == D("0.3")  # sin error de float
    assert t.total_tarjeta == D("1.305")
    assert t.saldo_calculado == D("0")  # tarjeta no toca efectivo
    assert isinstance(money(t.total_tarjeta), float)


def test_sesiones_distintas_cajeras_no_se_mezclan():
    """Regresión: dos cajas simultáneas en la misma sucursal.

    Cubierto a nivel de calcular_totales con listas separadas (el cálculo solo
    depende de los movimientos de la sesión; no hay consulta por sucursal/horario).
    """
    caja_a = [mov(S.VENTA_EFECTIVO, "INGRESO", D("100"), "a1"),
              mov(S.VENTA_QR, "INGRESO", D("50"), "a2")]
    caja_b = [mov(S.VENTA_EFECTIVO, "INGRESO", D("70"), "b1"),
              mov(S.CAMBIO, "EGRESO", D("10"))]
    ta = calcular_totales(caja_a, D("200"))
    tb = calcular_totales(caja_b, D("300"))
    assert (ta.saldo_calculado, ta.total_qr, ta.sale_ids) == (D("300"), D("50"), {"a1", "a2"})
    assert (tb.saldo_calculado, tb.total_qr, tb.sale_ids) == (D("360"), D("0"), {"b1"})
    assert ta.sale_ids.isdisjoint(tb.sale_ids)
