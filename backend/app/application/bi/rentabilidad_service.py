from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_rentabilidad_repository import MongoRentabilidadRepository, safe_float_bi
from app.schemas.bi_rentabilidad import (
    BIRentabilidadMargenResponse,
    KPIRentabilidadBI,
    CategoriaRentabilidadItemBI,
    ProductoRentabilidadItemBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class RentabilidadBIService:
    """
    Servicio de Aplicación de BI para Rentabilidad Teórica & Margen Bruto.
    Calcula el diferencial exacto: Ingresos por subtotal - Costo directo (cantidad * costo_producto).
    Aplica Pandas ETL in-memory.
    """

    def __init__(self, repository: Optional[MongoRentabilidadRepository] = None):
        self.repository = repository or MongoRentabilidadRepository()

    async def get_rentabilidad_analysis(
        self,
        user: User,
        start_date: str,
        end_date: str,
        sucursal_id: Optional[str] = None
    ) -> BIRentabilidadMargenResponse:
        now_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%H:%M:%S")

        # 1. Extracción de Ventas Operacionales y Productos Dimensión
        raw_sales = await self.repository.get_raw_sales_for_period(
            user=user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        tenant_id = str(user.tenant_id or "default")
        products_dim = await self.repository.get_products_dim(tenant_id=tenant_id)

        if not raw_sales:
            return BIRentabilidadMargenResponse(
                status="success",
                fecha_inicio_bolivia=start_date,
                fecha_fin_bolivia=end_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIRentabilidadBI(),
                categorias=[],
                top_productos=[]
            )

        # 2. DataFrame de Productos Dimensión
        df_prod_dim = pd.DataFrame(products_dim) if products_dim else pd.DataFrame()
        if not df_prod_dim.empty and "_id" in df_prod_dim.columns:
            df_prod_dim["_id"] = df_prod_dim["_id"].astype(str)
            df_prod_dim.rename(columns={"_id": "producto_id", "nombre": "nombre_oficial"}, inplace=True)
        else:
            df_prod_dim = pd.DataFrame(columns=["producto_id", "nombre_oficial", "categoria_nombre", "costo_producto"])

        # 3. Despliegue de sales.items[]
        item_rows = []

        for sale in raw_sales:
            sale_id = str(sale.get("_id", ""))
            items = sale.get("items", [])

            for item in items:
                pid = str(item.get("producto_id") or item.get("product_id") or "")
                desc = str(item.get("descripcion") or "Producto sin nombre")
                qty = safe_float_bi(item.get("cantidad") or item.get("quantity"))
                price = safe_float_bi(item.get("precio_unitario") or item.get("price"))
                subt = safe_float_bi(item.get("subtotal") or (qty * price))
                costo_u_item = safe_float_bi(item.get("costo_unitario") or item.get("costo"))

                item_rows.append({
                    "sale_id": sale_id,
                    "producto_id": pid,
                    "descripcion": desc,
                    "cantidad": qty,
                    "subtotal": subt,
                    "costo_u_item": costo_u_item
                })

        if not item_rows:
            return BIRentabilidadMargenResponse(
                status="success",
                fecha_inicio_bolivia=start_date,
                fecha_fin_bolivia=end_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIRentabilidadBI(),
                categorias=[],
                top_productos=[]
            )

        df_items = pd.DataFrame(item_rows)
        df_merged = pd.merge(df_items, df_prod_dim, on="producto_id", how="left")

        df_merged["nombre_final"] = df_merged["nombre_oficial"].fillna(df_merged["descripcion"])
        df_merged["categoria_nombre"] = df_merged["categoria_nombre"].fillna("Sin Categoría")

        # Priorizar costo maestro, si no usar costo de item
        df_merged["costo_unitario_final"] = df_merged["costo_producto"].where(df_merged["costo_producto"] > 0, df_merged["costo_u_item"])
        df_merged["costo_unitario_final"] = df_merged["costo_unitario_final"].fillna(0.0)

        df_merged["costo_total_linea"] = (df_merged["cantidad"] * df_merged["costo_unitario_final"]).round(2)
        df_merged["margen_bruto_linea"] = (df_merged["subtotal"] - df_merged["costo_total_linea"]).round(2)

        # Totales Globales
        ingresos_totales_global = round(float(df_merged["subtotal"].sum()), 2)
        costo_directo_total_global = round(float(df_merged["costo_total_linea"].sum()), 2)
        margen_bruto_global_bs = round(ingresos_totales_global - costo_directo_total_global, 2)
        margen_bruto_global_pct = round((margen_bruto_global_bs / ingresos_totales_global * 100.0), 2) if ingresos_totales_global > 0 else 0.0

        # 4. Agregación por Categoría
        grp_cat = df_merged.groupby("categoria_nombre").agg(
            ingresos_bs=("subtotal", "sum"),
            costos_bs=("costo_total_linea", "sum")
        ).reset_index()

        grp_cat["ingresos_bs"] = grp_cat["ingresos_bs"].round(2)
        grp_cat["costos_bs"] = grp_cat["costos_bs"].round(2)
        grp_cat["margen_bruto_bs"] = (grp_cat["ingresos_bs"] - grp_cat["costos_bs"]).round(2)
        grp_cat["margen_bruto_pct"] = (grp_cat["margen_bruto_bs"] / grp_cat["ingresos_bs"] * 100.0).round(2).fillna(0.0)

        grp_cat = grp_cat.sort_values(by="margen_bruto_bs", ascending=False)

        categorias_list: List[CategoriaRentabilidadItemBI] = []
        for _, r in grp_cat.iterrows():
            categorias_list.append(
                CategoriaRentabilidadItemBI(
                    categoria_nombre=str(r["categoria_nombre"]),
                    ingresos_bs=float(r["ingresos_bs"]),
                    costos_bs=float(r["costos_bs"]),
                    margen_bruto_bs=float(r["margen_bruto_bs"]),
                    margen_bruto_pct=float(r["margen_bruto_pct"])
                )
            )

        # 5. Agregación Top Productos por Margen Bruto
        grp_prod = df_merged.groupby(["producto_id", "nombre_final", "categoria_nombre"]).agg(
            unidades_vendidas=("cantidad", "sum"),
            ingresos_bs=("subtotal", "sum"),
            costos_bs=("costo_total_linea", "sum")
        ).reset_index()

        grp_prod["unidades_vendidas"] = grp_prod["unidades_vendidas"].round(2)
        grp_prod["ingresos_bs"] = grp_prod["ingresos_bs"].round(2)
        grp_prod["costos_bs"] = grp_prod["costos_bs"].round(2)
        grp_prod["margen_bruto_bs"] = (grp_prod["ingresos_bs"] - grp_prod["costos_bs"]).round(2)
        grp_prod["margen_bruto_pct"] = (grp_prod["margen_bruto_bs"] / grp_prod["ingresos_bs"] * 100.0).round(2).fillna(0.0)

        grp_prod = grp_prod.sort_values(by="margen_bruto_bs", ascending=False)

        top_productos_list: List[ProductoRentabilidadItemBI] = []
        for _, r in grp_prod.iterrows():
            top_productos_list.append(
                ProductoRentabilidadItemBI(
                    producto_id=str(r["producto_id"]),
                    nombre=str(r["nombre_final"]),
                    categoria_nombre=str(r["categoria_nombre"]),
                    unidades_vendidas=float(r["unidades_vendidas"]),
                    ingresos_bs=float(r["ingresos_bs"]),
                    costos_bs=float(r["costos_bs"]),
                    margen_bruto_bs=float(r["margen_bruto_bs"]),
                    margen_bruto_pct=float(r["margen_bruto_pct"])
                )
            )

        # 6. KPIs
        prod_mayor_margen_nom = "Sin datos"
        prod_mayor_margen_monto = 0.0
        if top_productos_list:
            top_p = top_productos_list[0]
            prod_mayor_margen_nom = top_p.nombre
            prod_mayor_margen_monto = top_p.margen_bruto_bs

        kpis = KPIRentabilidadBI(
            ingresos_totales=ingresos_totales_global,
            costo_directo_total=costo_directo_total_global,
            margen_bruto_teorico_bs=margen_bruto_global_bs,
            margen_bruto_teorico_pct=margen_bruto_global_pct,
            total_lineas_procesadas=len(df_items),
            producto_mayor_margen_nombre=prod_mayor_margen_nom,
            producto_mayor_margen_monto=prod_mayor_margen_monto
        )

        return BIRentabilidadMargenResponse(
            status="success",
            fecha_inicio_bolivia=start_date,
            fecha_fin_bolivia=end_date,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            categorias=categorias_list,
            top_productos=top_productos_list,
            trazabilidad={
                "coleccion": "sales.items[] & db.products",
                "servicio": "RentabilidadBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_RENTABILIDAD_ITEMS)",
                "total_lineas_procesadas": len(df_items),
                "suma_ingresos": ingresos_totales_global,
                "suma_costos": costo_directo_total_global,
                "suma_margen_bruto": margen_bruto_global_bs,
                "gastos_operativos": "NO_DISPONIBLE (Sin registros de gastos fijos/salarios en MongoDB)"
            }
        )
