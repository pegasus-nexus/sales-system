from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_ejecutivo_repository import MongoEjecutivoRepository, safe_float_bi
from app.infrastructure.bi.mongo_inventario_repository import MongoInventarioRepository
from app.infrastructure.bi.mongo_descuentos_repository import MongoDescuentosRepository
from app.application.bi.inventario_service import InventarioBIService
from app.schemas.bi_ejecutivo import (
    BIEjecutivoResumenResponse,
    KPIEjecutivoBI,
    ResumenSucursalEjecutivoBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class EjecutivoBIService:
    """
    Servicio de Aplicación de BI para el Resumen Ejecutivo Global (Fase 10).
    Consolida de manera 100% trazable los indicadores de ventas, costos, inventario, promociones y sucursales.
    Aplica Pandas ETL in-memory.
    """

    def __init__(
        self,
        repository: Optional[MongoEjecutivoRepository] = None,
        inventario_repo: Optional[MongoInventarioRepository] = None,
        descuentos_repo: Optional[MongoDescuentosRepository] = None
    ):
        self.repository = repository or MongoEjecutivoRepository()
        self.inventario_repo = inventario_repo or MongoInventarioRepository()
        self.descuentos_repo = descuentos_repo or MongoDescuentosRepository()

    async def get_ejecutivo_summary(
        self,
        user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sucursal_id: Optional[str] = None
    ) -> BIEjecutivoResumenResponse:
        now_bolivia_dt = datetime.now(BOLIVIA_TZ)
        now_bolivia_str = now_bolivia_dt.strftime("%H:%M:%S")
        today_bolivia_str = now_bolivia_dt.strftime("%Y-%m-%d")

        s_date = start_date or today_bolivia_str
        e_date = end_date or today_bolivia_str

        if not user.tenant_id or str(user.tenant_id) in ["default", "None", ""]:
            user.tenant_id = "69cd7f0a8f3f6866d4cfbb62"

        tenant_id = str(user.tenant_id)

        # 1. Extracción de Ventas, Mapa de Costos, Inventario, Promociones y Sucursales
        raw_sales = await self.repository.get_raw_sales(
            user=user,
            start_date_str=s_date,
            end_date_str=e_date,
            sucursal_id=sucursal_id
        )
        cost_map = await self.repository.get_products_cost_map(tenant_id=tenant_id)
        
        # Inventario Consolidado (Clean Architecture - Reutilización estricta de Fase 6)
        inv_service = InventarioBIService(repository=self.inventario_repo)
        inv_res = await inv_service.get_inventario_analysis(user=user, sucursal_id=sucursal_id)
        tot_units = inv_res.kpis.total_unidades_stock
        tot_val_stock = inv_res.kpis.valorizacion_costo_total

        # Descuentos Consolidados Historicos (Clean Architecture)
        catalog_promos = await self.descuentos_repo.get_raw_descuentos_catalog(tenant_id=tenant_id)
        sales_disc_raw = await self.descuentos_repo.get_raw_sales_with_discounts(user=user, sucursal_id=sucursal_id)

        monto_total_descuentos_hist = 0.0
        for sd in sales_disc_raw:
            d_obj = sd.get("descuento")
            if isinstance(d_obj, dict):
                d_tipo = str(d_obj.get("tipo") or "PORCENTAJE")
                d_val = safe_float_bi(d_obj.get("valor"))
                subt = safe_float_bi(sd.get("subtotal") or sd.get("total"))
                if d_tipo == "MONTO":
                    monto_total_descuentos_hist += d_val
                elif d_tipo == "PORCENTAJE":
                    monto_total_descuentos_hist += (subt * (d_val / 100.0))

        suc_map = await self.repository.get_sucursales_map()

        if not raw_sales:
            return BIEjecutivoResumenResponse(
                status="success",
                fecha_inicio_bolivia=s_date,
                fecha_fin_bolivia=e_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIEjecutivoBI(
                    total_unidades_stock=round(tot_units, 2),
                    valorizacion_costo_stock=round(tot_val_stock, 2),
                    promociones_configuradas=len(catalog_promos),
                    monto_total_descuentos=round(monto_total_descuentos_hist, 2),
                    tickets_con_descuento=len(sales_disc_raw)
                ),
                sucursales=[]
            )

        # 2. Procesamiento de Ventas y Items (Costo Directo)
        sales_rows = []
        cajeros_map: Dict[str, float] = {}
        sucursales_acc: Dict[str, Dict[str, Any]] = {}

        monto_total_descuentos = 0.0
        tickets_con_descuento_cnt = 0

        total_ingresos_global = 0.0
        total_costos_global = 0.0

        for s in raw_sales:
            s_id = str(s.get("_id"))
            tot = safe_float_bi(s.get("total"))
            total_ingresos_global += tot

            s_id_suc = str(s.get("sucursal_id") or "DESCONOCIDA")
            s_nom_suc = suc_map.get(s_id_suc, f"Sucursal {s_id_suc[:8]}")

            if s_id_suc not in sucursales_acc:
                sucursales_acc[s_id_suc] = {
                    "nombre": s_nom_suc,
                    "ingresos": 0.0,
                    "tickets": 0
                }
            sucursales_acc[s_id_suc]["ingresos"] += tot
            sucursales_acc[s_id_suc]["tickets"] += 1

            c_nom = str(s.get("cashier_name") or s.get("usuario_nombre") or "Cajero No Especificado").strip()
            cajeros_map[c_nom] = cajeros_map.get(c_nom, 0.0) + tot

            # Subdocumento descuento
            d_obj = s.get("descuento")
            if isinstance(d_obj, dict):
                tickets_con_descuento_cnt += 1
                d_tipo = str(d_obj.get("tipo") or "PORCENTAJE")
                d_val = safe_float_bi(d_obj.get("valor"))
                subt = safe_float_bi(s.get("subtotal") or tot)
                if d_tipo == "MONTO":
                    monto_total_descuentos += d_val
                elif d_tipo == "PORCENTAJE":
                    monto_total_descuentos += (subt * (d_val / 100.0))

            # Cálculo de Costo Directo por Linea de Venta (items)
            items = s.get("items") or []
            for it in items:
                p_id = str(it.get("producto_id") or it.get("product_id") or it.get("_id") or "")
                cant = safe_float_bi(it.get("cantidad") or it.get("quantity") or 1.0)
                cost_unit = cost_map.get(p_id, 0.0)
                if cost_unit == 0.0:
                    cost_unit = safe_float_bi(it.get("costo_unitario") or it.get("costo"))
                total_costos_global += (cant * cost_unit)

        total_ingresos_global = round(total_ingresos_global, 2)
        total_costos_global = round(total_costos_global, 2)
        margen_bruto_bs = round(total_ingresos_global - total_costos_global, 2)
        margen_bruto_pct = round((margen_bruto_bs / total_ingresos_global * 100.0), 2) if total_ingresos_global > 0 else 0.0

        total_tickets_cnt = len(raw_sales)
        ticket_medio_global = round(total_ingresos_global / total_tickets_cnt, 2) if total_tickets_cnt > 0 else 0.0

        # 3. Lista de Sucursales
        sucursales_list: List[ResumenSucursalEjecutivoBI] = []
        for s_id, s_data in sucursales_acc.items():
            ing_s = round(s_data["ingresos"], 2)
            part_s = round((ing_s / total_ingresos_global * 100.0), 2) if total_ingresos_global > 0 else 0.0
            sucursales_list.append(
                ResumenSucursalEjecutivoBI(
                    sucursal_id=s_id,
                    nombre=s_data["nombre"],
                    ingresos_bs=ing_s,
                    tickets_conteo=s_data["tickets"],
                    participacion_pct=part_s
                )
            )
        sucursales_list.sort(key=lambda x: x.ingresos_bs, reverse=True)

        # 4. Sucursal Líder y Cajero Líder
        suc_lider_nom = sucursales_list[0].nombre if sucursales_list else "Sin datos"
        suc_lider_ing = sucursales_list[0].ingresos_bs if sucursales_list else 0.0

        cajero_lider_nom = "Sin datos"
        cajero_lider_ing = 0.0
        if cajeros_map:
            best_c = max(cajeros_map.items(), key=lambda x: x[1])
            cajero_lider_nom = best_c[0]
            cajero_lider_ing = round(best_c[1], 2)

        kpis = KPIEjecutivoBI(
            ingresos_totales=total_ingresos_global,
            costo_directo_total=total_costos_global,
            margen_bruto_teorico_bs=margen_bruto_bs,
            margen_bruto_teorico_pct=margen_bruto_pct,
            total_tickets=total_tickets_cnt,
            ticket_medio=ticket_medio_global,
            total_unidades_stock=round(tot_units, 2),
            valorizacion_costo_stock=round(tot_val_stock, 2),
            promociones_configuradas=len(catalog_promos),
            monto_total_descuentos=round(monto_total_descuentos_hist, 2),
            tickets_con_descuento=len(sales_disc_raw),
            sucursal_lider_nombre=suc_lider_nom,
            sucursal_lider_ingresos=suc_lider_ing,
            cajero_lider_nombre=cajero_lider_nom,
            cajero_lider_ingresos=cajero_lider_ing
        )

        return BIEjecutivoResumenResponse(
            status="success",
            fecha_inicio_bolivia=s_date,
            fecha_fin_bolivia=e_date,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            sucursales=sucursales_list,
            trazabilidad={
                "coleccion": "sales, products, descuentos, sucursales",
                "servicio": "EjecutivoBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (CONSOLIDATED_EXECUTIVE_SUMMARY)",
                "ingresos_totales_conciliados": total_ingresos_global,
                "costo_directo_conciliado": total_costos_global,
                "margen_bruto_teorico_bs": margen_bruto_bs,
                "margen_bruto_teorico_pct": margen_bruto_pct,
                "ebitda_gastos_operativos": "NO_DISPONIBLE (Sin libros de egresos fijos en MongoDB)",
                "rotacion_kardex": "NO_DISPONIBLE (Sin kardex continuo de almacen en MongoDB)",
                "pronosticos_ia": "NO_DISPONIBLE (Sin modelos predictivos en MongoDB)"
            }
        )
