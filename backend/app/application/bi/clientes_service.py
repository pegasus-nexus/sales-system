from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_clientes_repository import MongoClientesRepository, safe_float_bi
from app.schemas.bi_clientes import (
    BIClientesResponse,
    KPIClientesBI,
    MetodoPagoItemBI,
    TopClienteItemBI,
    ResumenCreditoBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class ClientesBIService:
    """
    Servicio de Aplicación de BI para Clientes y Métodos de Pago.
    Procesa de manera limpia y trazable los documentos operacionales de MongoDB (sales, clientes, cuentas_credito).
    Aplica la fórmula matemática exacta para cobros netos por método de pago.
    """

    def __init__(self, repository: Optional[MongoClientesRepository] = None):
        self.repository = repository or MongoClientesRepository()

    async def get_clientes_analysis(
        self,
        user: User,
        start_date: str,
        end_date: str,
        sucursal_id: Optional[str] = None
    ) -> BIClientesResponse:
        now_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%H:%M:%S")

        # 1. Extracción de Ventas Operacionales y Cuentas de Crédito
        raw_sales = await self.repository.get_raw_sales_for_period(
            user=user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        tenant_id = str(user.tenant_id or "default")
        clientes_dim = await self.repository.get_clientes_dim(tenant_id=tenant_id)
        creditos_summary = await self.repository.get_cuentas_credito_summary(tenant_id=tenant_id)

        resumen_credito = ResumenCreditoBI(
            total_cuentas_credito=creditos_summary["total_cuentas"],
            saldo_total_cartera=creditos_summary["saldo_total"],
            cuentas_al_dia=creditos_summary["cuentas_al_dia"],
            cuentas_mora=creditos_summary["cuentas_mora"]
        )

        if not raw_sales:
            return BIClientesResponse(
                status="success",
                fecha_inicio_bolivia=start_date,
                fecha_fin_bolivia=end_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIClientesBI(),
                metodos_pago=[],
                top_clientes=[],
                resumen_credito=resumen_credito
            )

        # 2. Procesamiento de Ventas Totales, Nominadas vs Anónimas Mostrador
        ingresos_totales_sales = round(sum(safe_float_bi(s.get("total")) for s in raw_sales), 2)
        total_tickets_cnt = len(raw_sales)

        nominadas_monto = 0.0
        nominadas_tickets = 0
        anonimas_monto = 0.0
        anonimas_tickets = 0

        cliente_sales_rows = []

        for sale in raw_sales:
            s_total = safe_float_bi(sale.get("total"))
            c_id = sale.get("cliente_id") or sale.get("client_id")

            if c_id and str(c_id) not in ["None", "null", "", "undefined"]:
                nominadas_monto += s_total
                nominadas_tickets += 1
                cliente_sales_rows.append({
                    "ticket_id": str(sale.get("_id")),
                    "cliente_id": str(c_id),
                    "total": s_total
                })
            else:
                anonimas_monto += s_total
                anonimas_tickets += 1

        nominadas_monto = round(nominadas_monto, 2)
        anonimas_monto = round(anonimas_monto, 2)

        # 3. Procesamiento Matemático exacto de Métodos de Pago Netos
        method_net_totals: Dict[str, float] = {}
        method_ticket_counts: Dict[str, set] = {}

        for sale in raw_sales:
            s_total = safe_float_bi(sale.get("total"))
            s_id = str(sale.get("_id"))
            pagos = sale.get("pagos") or []

            if not pagos or not isinstance(pagos, list):
                # Ticket sin array pagos se asigna como EFECTIVO directo
                method_net_totals["EFECTIVO"] = method_net_totals.get("EFECTIVO", 0.0) + s_total
                method_ticket_counts.setdefault("EFECTIVO", set()).add(s_id)
                continue

            valid_pagos = [p for p in pagos if isinstance(p, dict) and safe_float_bi(p.get("monto")) > 0]
            total_entregado = sum(safe_float_bi(p.get("monto")) for p in valid_pagos)

            if total_entregado <= 0:
                method_net_totals["EFECTIVO"] = method_net_totals.get("EFECTIVO", 0.0) + s_total
                method_ticket_counts.setdefault("EFECTIVO", set()).add(s_id)
                continue

            for p in valid_pagos:
                m_tipo = str(p.get("metodo") or p.get("tipo") or "EFECTIVO").upper()
                m_monto = safe_float_bi(p.get("monto"))
                # Ponderación neta del cobro real del ticket
                m_neto_proporcional = round(s_total * (m_monto / total_entregado), 2)
                method_net_totals[m_tipo] = method_net_totals.get(m_tipo, 0.0) + m_neto_proporcional
                method_ticket_counts.setdefault(m_tipo, set()).add(s_id)

        # Redondear y formatear la lista de métodos de pago
        metodos_pago_list: List[MetodoPagoItemBI] = []
        for m_name, m_net in method_net_totals.items():
            m_net_round = round(m_net, 2)
            part_pct = round((m_net_round / ingresos_totales_sales * 100.0), 2) if ingresos_totales_sales > 0 else 0.0
            metodos_pago_list.append(
                MetodoPagoItemBI(
                    metodo=m_name,
                    monto_neto=m_net_round,
                    tickets_conteo=len(method_ticket_counts.get(m_name, set())),
                    participacion_pct=part_pct
                )
            )

        metodos_pago_list.sort(key=lambda x: x.monto_neto, reverse=True)

        # 4. Agregación Top Clientes Nominados
        df_clientes_dim = pd.DataFrame(clientes_dim) if clientes_dim else pd.DataFrame()
        if not df_clientes_dim.empty and "_id" in df_clientes_dim.columns:
            df_clientes_dim["_id"] = df_clientes_dim["_id"].astype(str)
            df_clientes_dim.rename(columns={"_id": "cliente_id"}, inplace=True)
        else:
            df_clientes_dim = pd.DataFrame(columns=["cliente_id", "nombre", "nit_ci"])

        top_clientes_list: List[TopClienteItemBI] = []
        top_cliente_nombre_kpi = "Sin ventas nominadas"
        top_cliente_monto_kpi = 0.0

        if cliente_sales_rows:
            df_c_sales = pd.DataFrame(cliente_sales_rows)
            grp_c = df_c_sales.groupby("cliente_id").agg(
                compras_conteo=("ticket_id", "count"),
                monto_total=("total", "sum")
            ).reset_index()

            df_merged_c = pd.merge(grp_c, df_clientes_dim, on="cliente_id", how="left")
            df_merged_c["nombre"] = df_merged_c["nombre"].fillna("Cliente Registrado")
            df_merged_c["nit_ci"] = df_merged_c["nit_ci"].fillna("Sin NIT/CI")

            df_merged_c = df_merged_c.sort_values(by="monto_total", ascending=False)

            for _, r in df_merged_c.iterrows():
                m_tot = round(float(r["monto_total"]), 2)
                part_c = round((m_tot / ingresos_totales_sales * 100.0), 2) if ingresos_totales_sales > 0 else 0.0
                top_clientes_list.append(
                    TopClienteItemBI(
                        cliente_id=str(r["cliente_id"]),
                        nombre=str(r["nombre"]),
                        nit_ci=str(r["nit_ci"]),
                        compras_conteo=int(r["compras_conteo"]),
                        monto_total=m_tot,
                        participacion_pct=part_c
                    )
                )

            if top_clientes_list:
                top_cliente_nombre_kpi = top_clientes_list[0].nombre
                top_cliente_monto_kpi = top_clientes_list[0].monto_total

        # 5. KPIs Principales
        kpis = KPIClientesBI(
            ingresos_totales=ingresos_totales_sales,
            total_tickets=total_tickets_cnt,
            ventas_nominadas_monto=nominadas_monto,
            ventas_nominadas_tickets=nominadas_tickets,
            ventas_anonimas_monto=anonimas_monto,
            ventas_anonimas_tickets=anonimas_tickets,
            top_cliente_nombre=top_cliente_nombre_kpi,
            top_cliente_monto=top_cliente_monto_kpi
        )

        return BIClientesResponse(
            status="success",
            fecha_inicio_bolivia=start_date,
            fecha_fin_bolivia=end_date,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            metodos_pago=metodos_pago_list,
            top_clientes=top_clientes_list,
            resumen_credito=resumen_credito,
            trazabilidad={
                "coleccion": "sales & db.clientes",
                "servicio": "ClientesBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_PAGOS & FACT_CLIENTES)",
                "filtro_anuladas": "anulada != True",
                "total_tickets_procesados": total_tickets_cnt,
                "suma_ventas_total": ingresos_totales_sales,
                "suma_pagos_netos": round(sum(m.monto_neto for m in metodos_pago_list), 2)
            }
        )
