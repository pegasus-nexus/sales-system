import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from fastapi import HTTPException

from app.application.services.momentos_taboada_participantes_service import (
    MomentosTaboadaParticipantesService,
)
from app.application.services.momentos_taboada_logistica_service import (
    MomentosTaboadaLogisticaService,
)
from app.application.services.momentos_taboada_service import (
    MomentosTaboadaService,
)
from app.domain.models.momentos_taboada import (
    PremioMomentosTaboada,
    MovimientoStockPremio,
    MovimientoCajaChicaTaboada,
    CanjeMomentosTaboada,
)
from app.domain.models.user import User


def get_mock_user(user_id: str = "650000000000000000000099", role: str = "ADMIN_MATRIZ") -> MagicMock:
    user = MagicMock()
    user.id = ObjectId(user_id)
    user.username = "admin_taboada"
    user.email = "admin@taboada.com"
    user.tenant_id = "tenant_test_taboada"
    user.sucursal_id = "650000000000000000000011"
    user.role = role
    user.full_name = "Administrador Taboada"
    return user


@pytest.mark.asyncio
async def test_metricas_y_participantes_calculo_correcto():
    """
    Verifica que el servicio de participantes calcule correctamente:
    - 4 KPIs: total participantes, ticket promedio, tickets repartidos, compradores recurrentes (>1 compra).
    - Regla de 30 Bs = 1 ticket por venta independiente (sin acumular residuos).
    - Columnas de la tabla: saldo de tickets disponibles, estado de canje y tarjeta.
    """
    tenant_id = "tenant_test_taboada"

    mock_cliente_1 = MagicMock()
    mock_cliente_1.id = ObjectId("650000000000000000000001")
    mock_cliente_1.nombre = "Rodrigo Test"
    mock_cliente_1.telefono = "71234567"
    mock_cliente_1.numero_tarjeta = "TAB-123456"
    mock_cliente_1.is_miembro_comunidad = True

    mock_cliente_2 = MagicMock()
    mock_cliente_2.id = ObjectId("650000000000000000000002")
    mock_cliente_2.nombre = "Maria Lopez"
    mock_cliente_2.telefono = "72345678"
    mock_cliente_2.numero_tarjeta = None
    mock_cliente_2.is_miembro_comunidad = False

    now = datetime.now(timezone.utc)

    # Ventas:
    # Cliente 1:
    #   Venta 1: 65 Bs -> 2 tickets (sobrante 5 Bs)
    #   Venta 2: 90 Bs -> 3 tickets (sobrante 0 Bs)
    #   Total cliente 1: 5 tickets, 2 compras (recurrente)
    # Cliente 2:
    #   Venta 3: 35 Bs -> 1 ticket (sobrante 5 Bs, 1 compra)
    s1 = MagicMock(id=ObjectId("6500000000000000000000aa"), cliente_id=str(mock_cliente_1.id), total=Decimal("65.00"), created_at=now, anulada=False)
    s1.cliente = MagicMock(telefono="71234567", razon_social="Rodrigo Test")
    s2 = MagicMock(id=ObjectId("6500000000000000000000bb"), cliente_id=str(mock_cliente_1.id), total=Decimal("90.00"), created_at=now, anulada=False)
    s2.cliente = MagicMock(telefono="71234567", razon_social="Rodrigo Test")
    s3 = MagicMock(id=ObjectId("6500000000000000000000cc"), cliente_id=str(mock_cliente_2.id), total=Decimal("35.00"), created_at=now, anulada=False)
    s3.cliente = MagicMock(telefono="72345678", razon_social="Maria Lopez")

    mock_sales = [s1, s2, s3]

    with patch("app.domain.models.sale.Sale.find") as mock_sale_find, \
         patch("app.domain.models.cliente.Cliente.find") as mock_cliente_find, \
         patch("app.domain.models.momentos_taboada.CanjeMomentosTaboada.find") as mock_canje_find:

        mock_sale_find.return_value.sort.return_value.to_list = AsyncMock(return_value=mock_sales)
        mock_cliente_find.return_value.to_list = AsyncMock(return_value=[mock_cliente_1, mock_cliente_2])
        mock_canje_find.return_value.to_list = AsyncMock(return_value=[])

        result = await MomentosTaboadaParticipantesService.get_participantes_y_metricas(tenant_id)

        # 4 KPIs
        assert result["metricas"]["total_participantes"] == 2
        assert result["metricas"]["total_tickets_repartidos"] == 6
        assert result["metricas"]["participantes_recurrentes"] == 1
        assert result["metricas"]["ticket_promedio"] == 63.33  # (65 + 90 + 35) / 3

        # Tabla de participantes
        assert len(result["participantes"]) == 2
        p1 = next(p for p in result["participantes"] if p["nombre"] == "Rodrigo Test")
        assert p1["tickets_acumulados"] == 5
        assert p1["tarjeta_taboada"] == "TAB-123456"
        assert p1["estado_canjeado"] == "Sin canjes"
        assert p1["tickets_utilizados"] == 0
        assert p1["tickets_disponibles"] == 5


@pytest.mark.asyncio
async def test_afiliar_tarjeta_taboada_generacion_y_vinculacion():
    """
    Verifica que afiliar una tarjeta genere un código TAB-XXXXXX
    y actualice al cliente correctamente.
    """
    tenant_id = "tenant_test_taboada"
    telefono = "71234567"

    mock_cliente = MagicMock()
    mock_cliente.id = ObjectId("650000000000000000000001")
    mock_cliente.nombre = "Carlos Perez"
    mock_cliente.telefono = telefono
    mock_cliente.numero_tarjeta = None
    mock_cliente.is_miembro_comunidad = False
    mock_cliente.fecha_afiliacion = None
    mock_cliente.save = AsyncMock()

    with patch("app.domain.models.cliente.Cliente.find_one", new_callable=AsyncMock) as mock_find_one:
        mock_find_one.return_value = mock_cliente

        resultado = await MomentosTaboadaParticipantesService.afiliar_tarjeta_taboada(
            tenant_id=tenant_id,
            telefono=telefono,
            nombre="Carlos Perez",
        )

        assert resultado["status"] == "success"
        assert resultado["numero_tarjeta"].startswith("TAB-")
        assert len(resultado["numero_tarjeta"]) == 10
        assert mock_cliente.is_miembro_comunidad is True
        mock_cliente.save.assert_awaited_once()


@pytest.mark.asyncio
async def test_surtir_stock_incremento_y_auditoria():
    """
    Verifica que surtir stock incremente el inventario de la sucursal
    y registre un movimiento auditable de SURTIDO_INGRESO.
    """
    tenant_id = "tenant_test_taboada"
    premio_id = "650000000000000000000099"
    sucursal_id = "650000000000000000000011"
    user = get_mock_user()

    mock_premio = MagicMock(spec=PremioMomentosTaboada)
    mock_premio.id = ObjectId(premio_id)
    mock_premio.tenant_id = tenant_id
    mock_premio.codigo = "TAZA_NEGRA"
    mock_premio.nombre = "Taza Negra Colección"
    mock_premio.stock_por_sucursal = {sucursal_id: 10}
    mock_premio.save = AsyncMock()

    mock_sucursal = MagicMock()
    mock_sucursal.nombre = "Sucursal Prado"

    with patch("app.domain.models.momentos_taboada.PremioMomentosTaboada.get", new_callable=AsyncMock, return_value=mock_premio), \
         patch("app.domain.models.sucursal.Sucursal.get", new_callable=AsyncMock, return_value=mock_sucursal), \
         patch("app.application.services.momentos_taboada_logistica_service.MovimientoStockPremio") as mock_mov_cls:

        mock_mov_inst = mock_mov_cls.return_value
        mock_mov_inst.create = AsyncMock()
        mock_mov_inst.id = ObjectId("650000000000000000000088")

        resultado = await MomentosTaboadaLogisticaService.surtir_stock(
            tenant_id=tenant_id,
            premio_id=premio_id,
            sucursal_id=sucursal_id,
            cantidad=15,
            motivo="Lote fábrica noviembre",
            current_user=user,
        )

        assert resultado["status"] == "success"
        assert resultado["stock_anterior"] == 10
        assert resultado["nuevo_stock"] == 25
        assert mock_premio.stock_por_sucursal[sucursal_id] == 25
        mock_premio.save.assert_awaited_once()
        mock_mov_inst.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_surtir_stock_valida_cantidad_positiva():
    """Verifica que no se permita surtir cantidades cero o negativas."""
    tenant_id = "tenant_test_taboada"
    user = get_mock_user()

    with pytest.raises(HTTPException) as exc_info:
        await MomentosTaboadaLogisticaService.surtir_stock(
            tenant_id=tenant_id,
            premio_id="650000000000000000000099",
            sucursal_id="650000000000000000000011",
            cantidad=0,
            motivo="Inválido",
            current_user=user,
        )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_trasladar_stock_valida_origen_distinto_a_destino():
    """Verifica que el traslado rechace si origen == destino."""
    tenant_id = "tenant_test_taboada"
    user = get_mock_user()
    suc_id = "650000000000000000000011"

    with pytest.raises(HTTPException) as exc_info:
        await MomentosTaboadaLogisticaService.trasladar_stock(
            tenant_id=tenant_id,
            premio_id="650000000000000000000099",
            sucursal_origen_id=suc_id,
            sucursal_destino_id=suc_id,
            cantidad=5,
            motivo="Traslado inválido",
            current_user=user,
        )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_trasladar_stock_valida_stock_suficiente():
    """Verifica que el traslado valide que el origen tenga suficiente stock."""
    tenant_id = "tenant_test_taboada"
    premio_id = "650000000000000000000099"
    suc_origen = "650000000000000000000011"
    suc_destino = "650000000000000000000022"
    user = get_mock_user()

    mock_premio = MagicMock(spec=PremioMomentosTaboada)
    mock_premio.id = ObjectId(premio_id)
    mock_premio.tenant_id = tenant_id
    mock_premio.stock_por_sucursal = {suc_origen: 3, suc_destino: 0}

    with patch("app.domain.models.momentos_taboada.PremioMomentosTaboada.get", new_callable=AsyncMock, return_value=mock_premio):
        with pytest.raises(HTTPException) as exc_info:
            await MomentosTaboadaLogisticaService.trasladar_stock(
                tenant_id=tenant_id,
                premio_id=premio_id,
                sucursal_origen_id=suc_origen,
                sucursal_destino_id=suc_destino,
                cantidad=10,  # Disponible solo 3
                motivo="Traslado excesivo",
                current_user=user,
            )
        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_registrar_egreso_caja_chica():
    """
    Verifica que el egreso de fondo promocional se registre
    y persista correctamente.
    """
    tenant_id = "tenant_test_taboada"
    sucursal_id = "650000000000000000000011"
    user = get_mock_user()

    mock_sucursal = MagicMock()
    mock_sucursal.nombre = "Sucursal Prado"

    with patch("app.domain.models.sucursal.Sucursal.get", new_callable=AsyncMock, return_value=mock_sucursal), \
         patch("app.application.services.momentos_taboada_logistica_service.MovimientoCajaChicaTaboada") as mock_egreso_cls:

        mock_egreso_inst = mock_egreso_cls.return_value
        mock_egreso_inst.create = AsyncMock()
        mock_egreso_inst.id = ObjectId("650000000000000000000077")

        res = await MomentosTaboadaLogisticaService.registrar_egreso_caja_chica(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            monto=120.50,
            metodo_pago="EFECTIVO",
            descripcion="Compra de empaques de regalo y listón",
            current_user=user,
        )

        assert res["status"] == "success"
        mock_egreso_inst.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_resumen_logistico_alertas_de_stock():
    """
    Verifica que el resumen logístico detecte premios agotados (stock 0)
    o con stock bajo (<= 3 unidades).
    """
    tenant_id = "tenant_test_taboada"
    suc_1 = "650000000000000000000011"
    suc_2 = "650000000000000000000022"

    p1 = MagicMock(spec=PremioMomentosTaboada)
    p1.id = ObjectId("650000000000000000000001")
    p1.codigo = "TAZA_NEGRA"
    p1.nombre = "Taza Negra"
    p1.stock_por_sucursal = {suc_1: 0, suc_2: 2}

    p2 = MagicMock(spec=PremioMomentosTaboada)
    p2.id = ObjectId("650000000000000000000002")
    p2.codigo = "CORCH_TAZA"
    p2.nombre = "Taza Corcho"
    p2.stock_por_sucursal = {suc_1: 15, suc_2: 20}

    s1 = MagicMock(id=ObjectId(suc_1), nombre="Prado")
    s2 = MagicMock(id=ObjectId(suc_2), nombre="Calacoto")

    with patch("app.domain.models.momentos_taboada.PremioMomentosTaboada.find") as mock_find_premios, \
         patch("app.domain.models.momentos_taboada.CanjeMomentosTaboada.find") as mock_find_canjes, \
         patch("app.domain.models.sucursal.Sucursal.find") as mock_find_sucursales:

        mock_find_premios.return_value.to_list = AsyncMock(return_value=[p1, p2])
        mock_find_canjes.return_value.to_list = AsyncMock(return_value=[])
        mock_find_sucursales.return_value.to_list = AsyncMock(return_value=[s1, s2])

        resumen = await MomentosTaboadaLogisticaService.get_resumen_logistico(tenant_id)

        assert len(resumen["premios"]) == 2
        # Taza Negra en Prado tiene 0 unidades (agotado)
        assert any(a["premio_nombre"] == "Taza Negra" and a["sucursal_nombre"] == "Prado" for a in resumen["alertas"]["agotados"])
        # Taza Negra en Calacoto tiene 2 unidades (bajo)
        assert any(a["premio_nombre"] == "Taza Negra" and a["sucursal_nombre"] == "Calacoto" for a in resumen["alertas"]["bajos"])


@pytest.mark.asyncio
async def test_cartilla_digital_calculo_saldo_y_casillas():
    """
    Verifica que la búsqueda de cliente devuelva el balance exacto,
    los tickets computados y las 30 casillas de la cartilla gráfica.
    """
    tenant_id = "tenant_test_taboada"
    telefono = "71234567"
    now = datetime.now(timezone.utc)

    mock_cliente = MagicMock()
    mock_cliente.id = ObjectId("650000000000000000000001")
    mock_cliente.nombre = "Rodrigo Test"
    mock_cliente.telefono = telefono
    mock_cliente.numero_tarjeta = "TAB-654321"
    mock_cliente.is_miembro_comunidad = True

    # 1 venta de 150 Bs -> 5 sellos
    mock_sales = [
        MagicMock(id=ObjectId("65000000000000000000000a"), total=Decimal("150.00"), created_at=now, sucursal_id="suc_1", anulada=False),
    ]

    with patch("app.domain.models.cliente.Cliente.find_one", new_callable=AsyncMock, return_value=mock_cliente), \
         patch("app.domain.models.sale.Sale.find") as mock_sale_find, \
         patch("app.domain.models.momentos_taboada.CanjeMomentosTaboada.find") as mock_canje_find:

        mock_sale_find.return_value.sort.return_value.to_list = AsyncMock(return_value=mock_sales)
        mock_canje_find.return_value.sort.return_value.to_list = AsyncMock(return_value=[])

        cartilla = await MomentosTaboadaService.buscar_cliente_sellos(tenant_id, telefono)

        assert cartilla["cliente"]["numero_tarjeta"] == "TAB-654321"
        assert cartilla["balance"]["sellos_totales_ganados"] == 5
        assert cartilla["balance"]["sellos_canjeados"] == 0
        assert cartilla["balance"]["sellos_disponibles"] == 5
        assert len(cartilla["cartilla_progreso"]) == 30

        # Primeras 5 casillas marcadas
        for i in range(5):
            assert cartilla["cartilla_progreso"][i]["marcado"] is True
        # Casilla 6 desmarcada
        assert cartilla["cartilla_progreso"][5]["marcado"] is False


@pytest.mark.asyncio
async def test_campana_inactiva_por_defecto_y_activacion():
    """
    Verifica que la campaña inicie inactiva (Modo Preparación) y que
    la activación guarde el estado y el usuario que la activó.
    """
    from app.application.services.momentos_taboada_config_service import MomentosTaboadaConfigService

    tenant_id = "tenant_test_taboada"
    admin_user = get_mock_user(role="ADMIN_MATRIZ")

    mock_cfg = MagicMock()
    mock_cfg.activa = False
    mock_cfg.mensaje_inactivo = "En preparación"
    mock_cfg.fecha_activacion = None
    mock_cfg.activado_por_usuario = None
    mock_cfg.updated_at = datetime.now(timezone.utc)
    mock_cfg.save = AsyncMock()

    with patch("app.domain.models.momentos_taboada.ConfiguracionCampanaTaboada.find_one", new_callable=AsyncMock, return_value=mock_cfg):
        # 1. Chequeo de estado inicial
        estado = await MomentosTaboadaConfigService.get_estado_campana(tenant_id)
        assert estado["activa"] is False

        # 2. Activación por admin
        resultado = await MomentosTaboadaConfigService.toggle_activacion_campana(
            tenant_id=tenant_id,
            activa=True,
            current_user=admin_user,
        )
        assert resultado["status"] == "success"
        assert resultado["activa"] is True
        assert mock_cfg.activa is True
        assert mock_cfg.activado_por_usuario == "Administrador Taboada"
        mock_cfg.save.assert_awaited_once()


@pytest.mark.asyncio
async def test_campana_inactiva_bloquea_cajero_pero_permite_admin():
    """
    Verifica que si la campaña está inactiva:
    - Cajeros/vendedores reciban HTTPException 403 con mensaje de preparación.
    - Administradores NO sean bloqueados (pueden seguir preparando).
    """
    from app.application.services.momentos_taboada_config_service import MomentosTaboadaConfigService

    tenant_id = "tenant_test_taboada"
    cajero_user = get_mock_user(role="CAJERO")
    admin_user = get_mock_user(role="ADMIN_MATRIZ")

    mock_cfg = MagicMock()
    mock_cfg.activa = False
    mock_cfg.mensaje_inactivo = "En preparación por gerencia"

    with patch("app.domain.models.momentos_taboada.ConfiguracionCampanaTaboada.find_one", new_callable=AsyncMock, return_value=mock_cfg):
        # Admin no debe ser bloqueado
        await MomentosTaboadaConfigService.validar_campana_disponible_para_usuario(tenant_id, admin_user)

        # Cajero debe ser bloqueado con 403
        with pytest.raises(HTTPException) as exc_info:
            await MomentosTaboadaConfigService.validar_campana_disponible_para_usuario(tenant_id, cajero_user)
        assert exc_info.value.status_code == 403
        assert "En preparación por gerencia" in exc_info.value.detail
