from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_productos_repository import MongoProductosRepository, safe_float_bi
from app.schemas.bi_productos import (
    BIProductosResponse,
    KPIProductosBI,
    TopProductoItemBI,
    CategoriaProductosItemBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class ProductosBIService:
    """
    Servicio de Aplicación de BI de Productos y Categorías desde cero.
    Transforma los documentos operacionales de MongoDB en un Modelo Estrella limpio (FACT_SALES_ITEMS).
    """

    def __init__(self, repository: Optional[MongoProductosRepository] = None):
        self.repository = repository or MongoProductosRepository()

    async def get_productos_analysis(
        self,
        user: User,
        start_date: str,
        end_date: str,
        sucursal_id: Optional[str] = None
    ) -> BIProductosResponse:
        # 1. Extracción Limpia de Ventas Operacionales
        raw_sales = await self.repository.get_raw_sales_for_period(
            user=user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        tenant_id = str(user.tenant_id or "default")
        products_dim = await self.repository.get_products_dim(tenant_id=tenant_id)
        categories_dim = await self.repository.get_categories_dim(tenant_id=tenant_id)

        now_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%H:%M:%S")

        if not raw_sales:
            return BIProductosResponse(
                status="success",
                fecha_inicio_bolivia=start_date,
                fecha_fin_bolivia=end_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIProductosBI(),
                top_productos=[],
                categorias=[]
            )

        # 2. Despliegue de Array items[] en FACT_SALES_ITEMS
        item_rows = []
        unique_sale_ids = set()

        for sale in raw_sales:
            sale_id = str(sale.get("_id", ""))
            unique_sale_ids.add(sale_id)
            items = sale.get("items", [])

            for item in items:
                pid = str(item.get("producto_id") or item.get("product_id") or "")
                desc = str(item.get("descripcion") or "Producto sin nombre")
                qty = safe_float_bi(item.get("cantidad") or item.get("quantity"))
                price = safe_float_bi(item.get("precio_unitario") or item.get("price"))
                subt = safe_float_bi(item.get("subtotal") or (qty * price))

                item_rows.append({
                    "sale_id": sale_id,
                    "producto_id": pid,
                    "descripcion": desc,
                    "cantidad": qty,
                    "precio_unitario": price,
                    "subtotal": subt
                })

        if not item_rows:
            return BIProductosResponse(
                status="success",
                fecha_inicio_bolivia=start_date,
                fecha_fin_bolivia=end_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIProductosBI(),
                top_productos=[],
                categorias=[]
            )

        df_items = pd.DataFrame(item_rows)
        ingresos_totales_items = round(float(df_items["subtotal"].sum()), 2)
        total_tickets_cnt = len(unique_sale_ids)

        # 3. DataFrames de Dimensiones
        df_prod_dim = pd.DataFrame(products_dim) if products_dim else pd.DataFrame()
        if not df_prod_dim.empty and "_id" in df_prod_dim.columns:
            df_prod_dim["_id"] = df_prod_dim["_id"].astype(str)
            df_prod_dim.rename(columns={"_id": "producto_id", "descripcion": "nombre_oficial"}, inplace=True)
        else:
            df_prod_dim = pd.DataFrame(columns=["producto_id", "nombre_oficial", "categoria_id"])

        df_cat_dim = pd.DataFrame(categories_dim) if categories_dim else pd.DataFrame()
        if not df_cat_dim.empty and "_id" in df_cat_dim.columns:
            df_cat_dim["_id"] = df_cat_dim["_id"].astype(str)
            df_cat_dim.rename(columns={"_id": "categoria_id", "name": "categoria_nombre"}, inplace=True)
        else:
            df_cat_dim = pd.DataFrame(columns=["categoria_id", "categoria_nombre"])

        # Joins con Dimensiones
        df_merged = pd.merge(df_items, df_prod_dim, on="producto_id", how="left")
        df_merged["nombre_final"] = df_merged["nombre_oficial"].fillna(df_merged["descripcion"])
        df_merged["categoria_id"] = df_merged["categoria_id"].fillna("sin_categoria")

        df_merged = pd.merge(df_merged, df_cat_dim, on="categoria_id", how="left")
        df_merged["categoria_nombre"] = df_merged["categoria_nombre"].fillna("Sin Categoría")

        # 4. Agregación Top Productos
        grp_prod = df_merged.groupby(["producto_id", "nombre_final", "categoria_id", "categoria_nombre"]).agg(
            unidades=("cantidad", "sum"),
            ingresos=("subtotal", "sum")
        ).reset_index()

        grp_prod["unidades"] = grp_prod["unidades"].round(2)
        grp_prod["ingresos"] = grp_prod["ingresos"].round(2)
        grp_prod["precio_promedio"] = (grp_prod["ingresos"] / grp_prod["unidades"]).round(2).fillna(0.0)
        grp_prod["participacion_pct"] = (grp_prod["ingresos"] / ingresos_totales_items * 100.0).round(2) if ingresos_totales_items > 0 else 0.0

        df_top_prod = grp_prod.sort_values(by="ingresos", ascending=False)

        top_productos_list: List[TopProductoItemBI] = []
        for _, r in df_top_prod.iterrows():
            top_productos_list.append(
                TopProductoItemBI(
                    producto_id=str(r["producto_id"]),
                    nombre=str(r["nombre_final"]),
                    categoria_id=str(r["categoria_id"]),
                    categoria_nombre=str(r["categoria_nombre"]),
                    unidades_vendidas=float(r["unidades"]),
                    ingresos_bs=float(r["ingresos"]),
                    precio_promedio_efectivo=float(r["precio_promedio"]),
                    participacion_pct=float(r["participacion_pct"])
                )
            )

        # 5. Agregación Categorías
        grp_cat = df_merged.groupby(["categoria_id", "categoria_nombre"]).agg(
            unidades=("cantidad", "sum"),
            ingresos=("subtotal", "sum")
        ).reset_index()

        grp_cat["unidades"] = grp_cat["unidades"].round(2)
        grp_cat["ingresos"] = grp_cat["ingresos"].round(2)
        grp_cat["participacion_pct"] = (grp_cat["ingresos"] / ingresos_totales_items * 100.0).round(2) if ingresos_totales_items > 0 else 0.0
        grp_cat = grp_cat.sort_values(by="ingresos", ascending=False)

        categorias_list: List[CategoriaProductosItemBI] = []
        for _, r in grp_cat.iterrows():
            categorias_list.append(
                CategoriaProductosItemBI(
                    categoria_id=str(r["categoria_id"]),
                    categoria_nombre=str(r["categoria_nombre"]),
                    unidades_vendidas=float(r["unidades"]),
                    ingresos_bs=float(r["ingresos"]),
                    participacion_pct=float(r["participacion_pct"])
                )
            )

        # 6. Cálculo KPIs
        prod_mas_vendido_nom = "Sin datos"
        unidades_mas_vendido = 0.0
        if not grp_prod.empty:
            df_by_qty = grp_prod.sort_values(by="unidades", ascending=False).iloc[0]
            prod_mas_vendido_nom = str(df_by_qty["nombre_final"])
            unidades_mas_vendido = float(df_by_qty["unidades"])

        prod_mayor_recaudacion_nom = "Sin datos"
        ingresos_mayor_recaudacion = 0.0
        if not df_top_prod.empty:
            top_rec = df_top_prod.iloc[0]
            prod_mayor_recaudacion_nom = str(top_rec["nombre_final"])
            ingresos_mayor_recaudacion = float(top_rec["ingresos"])

        skus_cnt = len(grp_prod)
        total_units_sum = float(df_items["cantidad"].sum())
        unidades_prom_ticket = round(total_units_sum / total_tickets_cnt, 2) if total_tickets_cnt > 0 else 0.0

        kpis = KPIProductosBI(
            producto_mas_vendido=prod_mas_vendido_nom,
            unidades_producto_mas_vendido=unidades_mas_vendido,
            producto_mayor_recaudacion=prod_mayor_recaudacion_nom,
            ingresos_producto_mayor_recaudacion=ingresos_mayor_recaudacion,
            skus_distintos=skus_cnt,
            unidades_promedio_por_ticket=unidades_prom_ticket
        )

        return BIProductosResponse(
            status="success",
            fecha_inicio_bolivia=start_date,
            fecha_fin_bolivia=end_date,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            top_productos=top_productos_list,
            categorias=categorias_list,
            trazabilidad={
                "coleccion": "sales.items[]",
                "servicio": "ProductosBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_SALES_ITEMS)",
                "filtro_anuladas": "anulada != True",
                "total_tickets_procesados": total_tickets_cnt,
                "total_lineas_items": len(df_items),
                "suma_subtotales_items": ingresos_totales_items
            }
        )
