from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_inventario_repository import MongoInventarioRepository, safe_float_bi
from app.schemas.bi_inventario import (
    BIInventarioControlResponse,
    KPIInventarioBI,
    SucursalInventarioItemBI,
    ProductoInventarioItemBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class InventarioBIService:
    """
    Servicio de Aplicación de BI para Control y Valorización de Inventario.
    Procesa de forma limpia los documentos operacionales de MongoDB (inventario, products, sucursales)
    aplicando Pandas ETL in-memory.
    """

    def __init__(self, repository: Optional[MongoInventarioRepository] = None):
        self.repository = repository or MongoInventarioRepository()

    async def get_inventario_analysis(
        self,
        user: User,
        sucursal_id: Optional[str] = None
    ) -> BIInventarioControlResponse:
        now_bolivia_dt = datetime.now(BOLIVIA_TZ)
        now_bolivia_str = now_bolivia_dt.strftime("%H:%M:%S")
        today_bolivia_str = now_bolivia_dt.strftime("%Y-%m-%d")

        # 1. Extracción de Inventario Operacional
        raw_inv = await self.repository.get_raw_inventario(user=user, sucursal_id=sucursal_id)
        tenant_id = str(user.tenant_id or "default")
        products_dim = await self.repository.get_products_dim(tenant_id=tenant_id)
        sucursales_dim = await self.repository.get_sucursales_dim(tenant_id=tenant_id)

        if not raw_inv:
            return BIInventarioControlResponse(
                status="success",
                fecha_consulta_bolivia=today_bolivia_str,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIInventarioBI(),
                desglose_sucursales=[],
                top_productos_inventario=[]
            )

        # 2. DataFrame de Productos Dimensión
        df_prod_dim = pd.DataFrame(products_dim) if products_dim else pd.DataFrame()
        if not df_prod_dim.empty and "_id" in df_prod_dim.columns:
            df_prod_dim["_id"] = df_prod_dim["_id"].astype(str)
            df_prod_dim.rename(columns={"_id": "producto_id"}, inplace=True)
        else:
            df_prod_dim = pd.DataFrame(columns=["producto_id", "nombre", "categoria_nombre", "costo_producto", "precio_venta"])

        # 3. DataFrame de Sucursales Dimensión
        df_suc_dim = pd.DataFrame(sucursales_dim) if sucursales_dim else pd.DataFrame()
        if not df_suc_dim.empty and "_id" in df_suc_dim.columns:
            df_suc_dim["_id"] = df_suc_dim["_id"].astype(str)
            df_suc_dim.rename(columns={"_id": "sucursal_id", "nombre": "sucursal_nombre"}, inplace=True)
        else:
            df_suc_dim = pd.DataFrame(columns=["sucursal_id", "sucursal_nombre", "ciudad"])

        # 4. DataFrame Base de Inventario
        inv_rows = []
        for d in raw_inv:
            pid = str(d.get("producto_id", ""))
            suc_id = str(d.get("sucursal_id", ""))
            qty = safe_float_bi(d.get("cantidad"))
            inv_rows.append({
                "inv_id": str(d.get("_id")),
                "producto_id": pid,
                "sucursal_id": suc_id,
                "cantidad": qty
            })

        df_inv = pd.DataFrame(inv_rows)
        df_inv = pd.merge(df_inv, df_prod_dim, on="producto_id", how="left")
        df_inv["nombre"] = df_inv["nombre"].fillna("Producto Sin Registro")
        df_inv["categoria_nombre"] = df_inv["categoria_nombre"].fillna("Sin Categoría")
        df_inv["costo_producto"] = df_inv["costo_producto"].fillna(0.0)
        df_inv["valor_total_costo"] = (df_inv["cantidad"] * df_inv["costo_producto"]).round(2)

        # Totales Globales
        total_unidades_global = round(float(df_inv["cantidad"].sum()), 2)
        valorizacion_costo_global = round(float(df_inv["valor_total_costo"].sum()), 2)

        # Conteos de SKUs globales
        grp_prod_global = df_inv.groupby("producto_id").agg(
            stock_total=("cantidad", "sum"),
            valor_total=("valor_total_costo", "sum")
        ).reset_index()

        skus_stock_pos = sum(1 for _, r in grp_prod_global.iterrows() if r["stock_total"] > 0)

        # Conteo de Agotados y Bajo por registros de almacén por tienda
        skus_agotados_cnt = sum(1 for _, r in df_inv.iterrows() if r["cantidad"] <= 0)
        skus_stock_bajo_cnt = sum(1 for _, r in df_inv.iterrows() if 0 < r["cantidad"] <= 5)

        # 5. Desglose por Sucursal
        df_inv_suc = pd.merge(df_inv, df_suc_dim, on="sucursal_id", how="left")
        df_inv_suc["sucursal_nombre"] = df_inv_suc["sucursal_nombre"].fillna("Sucursal Sin Registro DB")
        df_inv_suc["ciudad"] = df_inv_suc["ciudad"].fillna("Sin Ciudad")

        grp_suc = df_inv_suc.groupby(["sucursal_id", "sucursal_nombre", "ciudad"]).agg(
            unidades_stock=("cantidad", "sum"),
            skus_conteo=("producto_id", "nunique"),
            valorizacion_costo=("valor_total_costo", "sum")
        ).reset_index()

        # Conteo de agotados por sucursal
        agotados_per_suc = df_inv_suc[df_inv_suc["cantidad"] <= 0].groupby("sucursal_id")["producto_id"].count().to_dict()

        sucursales_list: List[SucursalInventarioItemBI] = []
        for _, r in grp_suc.iterrows():
            s_id = str(r["sucursal_id"])
            sucursales_list.append(
                SucursalInventarioItemBI(
                    sucursal_id=s_id,
                    nombre=str(r["sucursal_nombre"]),
                    ciudad=str(r["ciudad"]),
                    unidades_stock=round(float(r["unidades_stock"]), 2),
                    skus_conteo=int(r["skus_conteo"]),
                    skus_agotados=int(agotados_per_suc.get(s_id, 0)),
                    valorizacion_costo=round(float(r["valorizacion_costo"]), 2)
                )
            )

        sucursales_list.sort(key=lambda x: x.valorizacion_costo, reverse=True)

        # 6. Top Productos por Valorización
        grp_prod_detail = df_inv.groupby(["producto_id", "nombre", "categoria_nombre", "costo_producto"]).agg(
            stock_actual=("cantidad", "sum"),
            valor_total_costo=("valor_total_costo", "sum")
        ).reset_index()

        grp_prod_detail = grp_prod_detail.sort_values(by="valor_total_costo", ascending=False)

        top_productos_list: List[ProductoInventarioItemBI] = []
        for _, r in grp_prod_detail.iterrows():
            stk = round(float(r["stock_actual"]), 2)
            est_stk = "AGOTADO" if stk <= 0 else ("BAJO" if stk <= 5 else "OK")
            top_productos_list.append(
                ProductoInventarioItemBI(
                    producto_id=str(r["producto_id"]),
                    nombre=str(r["nombre"]),
                    categoria_nombre=str(r["categoria_nombre"]),
                    stock_actual=stk,
                    costo_unitario=round(float(r["costo_producto"]), 2),
                    valor_total_costo=round(float(r["valor_total_costo"]), 2),
                    estado_stock=est_stk
                )
            )

        # 7. KPIs
        suc_mayor_val_nom = "Sin datos"
        suc_mayor_val_monto = 0.0
        if sucursales_list:
            suc_mayor_val_nom = sucursales_list[0].nombre
            suc_mayor_val_monto = sucursales_list[0].valorizacion_costo

        kpis = KPIInventarioBI(
            total_unidades_stock=total_unidades_global,
            valorizacion_costo_total=valorizacion_costo_global,
            skus_con_stock_disponible=skus_stock_pos,
            skus_agotados=skus_agotados_cnt,
            skus_stock_bajo=skus_stock_bajo_cnt,
            sucursal_mayor_inventario_nombre=suc_mayor_val_nom,
            sucursal_mayor_inventario_monto=suc_mayor_val_monto
        )

        return BIInventarioControlResponse(
            status="success",
            fecha_consulta_bolivia=today_bolivia_str,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            desglose_sucursales=sucursales_list,
            top_productos_inventario=top_productos_list,
            trazabilidad={
                "coleccion": "inventario & db.products & db.sucursales",
                "servicio": "InventarioBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_INVENTARIO)",
                "total_registros_inventario": len(df_inv),
                "suma_unidades_stock": total_unidades_global,
                "suma_valor_costo_total": valorizacion_costo_global,
                "rotacion_kardex": "NO_DISPONIBLE (Sin historial continuo de movimientos de almacén en MongoDB)"
            }
        )
