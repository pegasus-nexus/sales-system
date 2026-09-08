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
    ProductoInventarioItemBI,
    InventoryLogItemBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class InventarioBIService:
    """
    Servicio de Aplicación de BI para Control, Valorización de Inventario y Demanda Predictiva.
    Procesa de forma limpia los documentos operacionales de MongoDB (inventario, products, sucursales, sales, inventory_logs)
    aplicando Pandas ETL e inferencia analítica in-memory.
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

        # 1. Extracción de Inventario Operacional, Dimensiones, Velocidad de Ventas y Logs Kárdex
        raw_inv = await self.repository.get_raw_inventario(user=user, sucursal_id=sucursal_id)
        tenant_id = str(user.tenant_id or "default")
        products_dim = await self.repository.get_products_dim(tenant_id=tenant_id)
        sucursales_dim = await self.repository.get_sucursales_dim(tenant_id=tenant_id)
        sales_velocity_map = await self.repository.get_sales_velocity_by_product(user=user, sucursal_id=sucursal_id, days=30)
        raw_logs = await self.repository.get_recent_inventory_logs(user=user, sucursal_id=sucursal_id, limit=50)

        if not raw_inv:
            return BIInventarioControlResponse(
                status="success",
                fecha_consulta_bolivia=today_bolivia_str,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIInventarioBI(),
                desglose_sucursales=[],
                top_productos_inventario=[],
                sugerencias_reabastecimiento=[],
                movimientos_kardex_recientes=[]
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

        # 6. Detalle de Productos, Demanda Predictiva & Sugerencias de Reabastecimiento
        grp_prod_detail = df_inv.groupby(["producto_id", "nombre", "categoria_nombre", "costo_producto"]).agg(
            stock_actual=("cantidad", "sum"),
            valor_total_costo=("valor_total_costo", "sum")
        ).reset_index()

        top_productos_list: List[ProductoInventarioItemBI] = []
        sugerencias_reabastecimiento: List[ProductoInventarioItemBI] = []

        total_unidades_sugeridas = 0.0
        presupuesto_total_reabastecimiento = 0.0
        skus_sugerencia_cnt = 0

        for _, r in grp_prod_detail.iterrows():
            p_id = str(r["producto_id"])
            stk = round(float(r["stock_actual"]), 2)
            costo_u = round(float(r["costo_producto"]), 2)
            val_tot = round(float(r["valor_total_costo"]), 2)

            v_diaria = float(sales_velocity_map.get(p_id, 0.0))

            # Días de Cobertura
            dias_cobertura: Optional[float] = None
            if v_diaria > 0:
                dias_cobertura = round(stk / v_diaria, 1)

            # Estado de Stock & Alerta de Cobertura
            if stk <= 0:
                est_stk = "AGOTADO"
                alerta_cob = "AGOTADO"
            elif stk <= 5:
                est_stk = "BAJO"
                alerta_cob = "URGENTE" if (dias_cobertura is not None and dias_cobertura <= 7) else "ALERTA"
            else:
                est_stk = "OK"
                if dias_cobertura is not None and dias_cobertura <= 7:
                    alerta_cob = "URGENTE"
                elif dias_cobertura is not None and dias_cobertura <= 15:
                    alerta_cob = "ALERTA"
                elif v_diaria == 0:
                    alerta_cob = "SIN_VENTAS"
                else:
                    alerta_cob = "SALUDABLE"

            # Sugerencia de Reabastecimiento a 30 Días
            target_30d = v_diaria * 30.0
            sugerencia_unidades = 0.0
            if v_diaria > 0 and stk < target_30d:
                sugerencia_unidades = round(target_30d - stk, 0)
            elif stk <= 0:
                sugerencia_unidades = 5.0  # Reposición mínima recomendada para producto agotado

            sugerencia_monto = round(sugerencia_unidades * costo_u, 2)

            prod_item = ProductoInventarioItemBI(
                producto_id=p_id,
                nombre=str(r["nombre"]),
                categoria_nombre=str(r["categoria_nombre"]),
                stock_actual=stk,
                costo_unitario=costo_u,
                valor_total_costo=val_tot,
                estado_stock=est_stk,
                velocidad_diaria_ventas=v_diaria,
                dias_cobertura_estimados=dias_cobertura,
                alerta_cobertura=alerta_cob,
                sugerencia_reabastecimiento_unidades=sugerencia_unidades,
                sugerencia_monto_bs=sugerencia_monto
            )

            top_productos_list.append(prod_item)

            if sugerencia_unidades > 0 or alerta_cob in ["AGOTADO", "URGENTE", "ALERTA"]:
                sugerencias_reabastecimiento.append(prod_item)
                total_unidades_sugeridas += sugerencia_unidades
                presupuesto_total_reabastecimiento += sugerencia_monto
                skus_sugerencia_cnt += 1

        top_productos_list.sort(key=lambda x: x.valor_total_costo, reverse=True)
        sugerencias_reabastecimiento.sort(key=lambda x: (x.sugerencia_monto_bs, x.velocidad_diaria_ventas), reverse=True)

        # 7. Movimientos Kárdex Recientes
        kardex_list: List[InventoryLogItemBI] = []
        for l in raw_logs:
            kardex_list.append(
                InventoryLogItemBI(
                    log_id=l["log_id"],
                    producto_id=l["producto_id"],
                    descripcion=l["descripcion"],
                    tipo_movimiento=l["tipo_movimiento"],
                    cantidad_movida=l["cantidad_movida"],
                    stock_resultante=l["stock_resultante"],
                    usuario_nombre=l["usuario_nombre"],
                    fecha=l["fecha"]
                )
            )

        # 8. KPIs Globales
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
            sucursal_mayor_inventario_monto=suc_mayor_val_monto,
            skus_sugerencia_pedido=skus_sugerencia_cnt,
            unidades_sugeridas_totales=round(total_unidades_sugeridas, 2),
            presupuesto_reabastecimiento_bs=round(presupuesto_total_reabastecimiento, 2)
        )

        return BIInventarioControlResponse(
            status="success",
            fecha_consulta_bolivia=today_bolivia_str,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            desglose_sucursales=sucursales_list,
            top_productos_inventario=top_productos_list,
            sugerencias_reabastecimiento=sugerencias_reabastecimiento,
            movimientos_kardex_recientes=kardex_list,
            trazabilidad={
                "coleccion": "inventario & db.products & db.sucursales & db.sales & db.inventory_logs",
                "servicio": "InventarioBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_INVENTARIO + DEMANDA_PREDICTIVA)",
                "total_registros_inventario": len(df_inv),
                "suma_unidades_stock": total_unidades_global,
                "suma_valor_costo_total": valorizacion_costo_global,
                "total_sugerencias_pedido": skus_sugerencia_cnt,
                "presupuesto_reabastecimiento": round(presupuesto_total_reabastecimiento, 2)
            }
        )

