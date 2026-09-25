import os
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

class HistoricalFactsService:
    """
    Servicio de Respaldo y Acceso Directo a los Hechos Históricos Limpios (2024 - 2025).
    Garantiza que el módulo de BI siempre disponga de las ventas netas reales verificadas,
    excluyendo automáticamente cualquier fila de prueba o duplicación sintética.
    """
    _cached_df: Optional[pd.DataFrame] = None

    @classmethod
    def get_cleaned_dataframe(cls) -> pd.DataFrame:
        if cls._cached_df is not None:
            return cls._cached_df

        # Buscar el archivo Tabla_de_Hechos_BI.xlsx en rutas conocidas
        candidate_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "Tabla_de_Hechos_BI.xlsx")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Tabla_de_Hechos_BI.xlsx")),
            r"C:\Users\dell\OneDrive\Desktop\SalesSystem\Tabla_de_Hechos_BI.xlsx",
            "Tabla_de_Hechos_BI.xlsx"
        ]

        excel_path = None
        for p in candidate_paths:
            if os.path.exists(p):
                excel_path = p
                break

        if not excel_path:
            return pd.DataFrame()

        try:
            df = pd.read_excel(excel_path, sheet_name="Datos_Crudos")
            
            # 1. Excluir productos de prueba sintéticos
            test_mask = df['nombre_producto'].astype(str).str.contains(
                r'TRUFAS GOURMET|CAJA SURTIDA X|^PRUEBA|^TEST', case=False, na=False, regex=True
            )
            df_clean = df[~test_mask].copy()

            # 2. Deduplicar bloques duplicados
            df_clean = df_clean.drop_duplicates(subset=[
                'fecha_transaccion', 'sucursal', 'nombre_producto', 'cantidad_vendida', 'monto_total_bs'
            ]).copy()

            # 3. Parsear fecha y campos numéricos
            df_clean['dt_parsed'] = pd.to_datetime(df_clean['fecha_transaccion'], errors='coerce')
            df_clean = df_clean[df_clean['dt_parsed'].notna()].copy()
            df_clean['fecha_bolivia'] = df_clean['dt_parsed'].dt.strftime('%Y-%m-%d')
            df_clean['hora_bolivia'] = df_clean['dt_parsed'].dt.hour
            df_clean['monto_total_bs'] = pd.to_numeric(df_clean['monto_total_bs'], errors='coerce').fillna(0.0)
            df_clean['cantidad_vendida'] = pd.to_numeric(df_clean['cantidad_vendida'], errors='coerce').fillna(1.0)

            cls._cached_df = df_clean
            return cls._cached_df
        except Exception as err:
            print(f"⚠️ Error cargando Tabla_de_Hechos_BI.xlsx: {err}")
            return pd.DataFrame()

    @classmethod
    def get_sales_for_date_range(
        cls,
        start_date_str: str,
        end_date_str: str,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        df = cls.get_cleaned_dataframe()
        if df.empty:
            return []

        mask = (df['fecha_bolivia'] >= start_date_str) & (df['fecha_bolivia'] <= end_date_str)
        df_range = df[mask].copy()

        if sucursal_id and sucursal_id.lower() not in ["all", "todas", "global", ""]:
            suc_norm = sucursal_id.lower()
            df_range = df_range[df_range['sucursal'].astype(str).str.lower().str.contains(suc_norm, na=False)]

        if df_range.empty:
            return []

        # Agrupar por ticket (fecha_transaccion + sucursal)
        grouped_tickets: Dict[str, Dict[str, Any]] = {}
        for _, row in df_range.iterrows():
            dt_raw = row['dt_parsed']
            suc = str(row.get('sucursal', 'Heroínas'))
            
            if getattr(dt_raw, 'tzinfo', None) is None:
                dt_local = dt_raw.replace(tzinfo=BOLIVIA_TZ)
            else:
                dt_local = dt_raw.astimezone(BOLIVIA_TZ)
            dt_utc = dt_local.astimezone(ZoneInfo("UTC"))
            
            num_ticket = f"HIST-{dt_local.strftime('%Y%m%d%H%M%S')}-{suc[:3].upper()}"
            monto = float(row['monto_total_bs'])
            qty = float(row['cantidad_vendida'])
            precio_u = round(monto / qty, 2) if qty > 0 else monto

            item_obj = {
                "producto_id": "HIST",
                "nombre": str(row.get('nombre_producto', 'Producto Histórico')),
                "cantidad": qty,
                "precio_unitario": precio_u,
                "subtotal": monto
            }

            if num_ticket not in grouped_tickets:
                grouped_tickets[num_ticket] = {
                    "_id": num_ticket,
                    "numero_ticket": num_ticket,
                    "created_at": dt_utc,
                    "fecha_bolivia": row['fecha_bolivia'],
                    "hora_bolivia": int(row['hora_bolivia']),
                    "sucursal_id": suc,
                    "tenant_id": "default",
                    "total": 0.0,
                    "anulada": False,
                    "items": [],
                    "cajero_id": "HISTORICO",
                    "cajero_name": "Carga Histórica"
                }

            grouped_tickets[num_ticket]["items"].append(item_obj)
            grouped_tickets[num_ticket]["total"] = round(grouped_tickets[num_ticket]["total"] + monto, 2)

        return list(grouped_tickets.values())
