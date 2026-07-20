"""
Servicio de Percentiles de Ventas — Basado exclusivamente en datos históricos reales.
- Sin inteligencia artificial ni modelos predictivos.
- Las proyecciones futuras son referencias estadísticas: P25 (mínimo histórico),
  P50 (mediana histórica) y P75 (máximo histórico).
- 4 zonas semáforo: critico (rojo), bajo (amarillo), normal (verde), alto (lila)
- Agrupación por: día, semana, mes
"""
import traceback
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Any, Dict, List

from app.db import get_raw_db


# ── 4 Zonas Semáforo ──────────────────────────────────────────────────────────
ZONES = {
    "critico": "Crítico",   # < P25  → rojo
    "bajo":    "Bajo",      # P25-P50 → amarillo
    "normal":  "Normal",    # P50-P75 → verde
    "alto":    "Alto",      # > P75   → lila
}


async def get_sales_percentiles(
    tenant_id: str,
    sucursal: str = None,
    days_history: int = 90,
    group_by: str = "day",   # "day" | "week" | "month"
) -> Dict[str, Any]:
    """
    1. Consulta ventas históricas de los últimos `days_history` días.
    2. Agrupa por día / semana / mes según `group_by`.
    3. Calcula P25, P50 (mediana), P75 y la media sobre los totales agrupados.
    4. Clasifica cada período en 4 zonas (rojo / amarillo / verde / lila).
    5. Agrega períodos futuros con proyección basada en P50 ± rango intercuartil.
    """
    print(f"\n>>> PERCENTILES: group_by={group_by}, sucursal={sucursal or 'TODAS'}, history={days_history}d")

    try:
        db = await get_raw_db()

        today = datetime.utcnow().date()
        end_dt   = datetime(today.year, today.month, today.day, 23, 59, 59)
        start_dt = end_dt - timedelta(days=days_history)

        mongo_filter: Dict[str, Any] = {
            "fecha_transaccion": {"$gte": start_dt, "$lte": end_dt},
        }
        if sucursal and sucursal.strip():
            mongo_filter["sucursal"] = {"$regex": sucursal.strip(), "$options": "i"}

        cursor = db.ventas_historicas_crudas.find(
            mongo_filter,
            {"_id": 0, "fecha_transaccion": 1, "monto_total_bs": 1}
        )
        datos = await cursor.to_list(length=None)

        # Inyectar ventas POS (caja en vivo)
        # 1) Mapeo de sucursales si hay filtro
        import re
        sucursales_cursor = db.sucursales.find({}, {"_id": 1, "nombre": 1})
        sucursales_list = await sucursales_cursor.to_list(length=None)
        suc_id_to_name = {}
        for s in sucursales_list:
            nombre = str(s.get("nombre", ""))
            sid = str(s["_id"])
            nl = nombre.lower()
            if 'heroina' in nl or 'hero' in nl:
                suc_name = "Heroínas"
            elif 'recoleta' in nl:
                suc_name = "Recoleta"
            elif 'calacoto' in nl:
                suc_name = "Calacoto"
            else:
                suc_name = nombre
            suc_id_to_name[sid] = suc_name

        # 2) Buscar ventas POS en el rango
        pos_filter = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start_dt, "$lte": end_dt}
        }
        
        pos_cursor = db.sales.find(
            pos_filter, 
            {"_id": 0, "created_at": 1, "total": 1, "sucursal_id": 1, "items": 1}
        ).batch_size(1000)
        pos_sales = await pos_cursor.to_list(length=None)
        
        for sale in pos_sales:
            sid = str(sale.get("sucursal_id", ""))
            suc_name = suc_id_to_name.get(sid, "")
            
            # Filtro por sucursal
            if sucursal and sucursal.strip():
                suc_pattern = sucursal.strip()
                if suc_pattern.lower() == "heroinas":
                    suc_pattern = "Heroínas"
                if not re.search(suc_pattern, suc_name, re.IGNORECASE):
                    continue
                    
            items = sale.get("items", [])
            for item in items:
                try:
                    monto = float(str(item.get("subtotal", 0)))
                except:
                    monto = 0
                datos.append({
                    "fecha_transaccion": sale.get("created_at"),
                    "monto_total_bs": monto
                })

        if not datos:
            return _empty_percentiles(group_by)

        df = pd.DataFrame(datos)
        df["fecha_transaccion"] = pd.to_datetime(df["fecha_transaccion"], errors="coerce", utc=True)
        df.dropna(subset=["fecha_transaccion"], inplace=True)
        df["fecha_transaccion_local"] = df["fecha_transaccion"].dt.tz_convert('America/La_Paz')
        df["monto_total_bs"] = pd.to_numeric(df["monto_total_bs"], errors="coerce").fillna(0)
        df["fecha_solo"] = df["fecha_transaccion_local"].dt.date

        # ── Agrupar por período ──────────────────────────────────────────────
        daily = df.groupby("fecha_solo")["monto_total_bs"].sum().reset_index()
        daily.columns = ["fecha", "total"]
        daily["fecha"] = pd.to_datetime(daily["fecha"])
        daily = daily.sort_values("fecha")

        if group_by == "week":
            daily["period_key"] = daily["fecha"].dt.to_period("W")
            daily["period_start"] = daily["fecha"].dt.to_period("W").apply(lambda p: p.start_time.date())
            daily["period_label"] = daily["fecha"].dt.to_period("W").apply(
                lambda p: f"Sem {p.start_time.strftime('%d %b')}"
            )
            grouped = daily.groupby(["period_key", "period_start", "period_label"])["total"].sum().reset_index()
            grouped = grouped.sort_values("period_start")
        elif group_by == "month":
            daily["period_key"] = daily["fecha"].dt.to_period("M")
            daily["period_start"] = daily["fecha"].dt.to_period("M").apply(lambda p: p.start_time.date())
            daily["period_label"] = daily["fecha"].dt.to_period("M").apply(
                lambda p: p.start_time.strftime("%b %Y")
            )
            grouped = daily.groupby(["period_key", "period_start", "period_label"])["total"].sum().reset_index()
            grouped = grouped.sort_values("period_start")
        else:
            # Día
            daily["period_start"] = daily["fecha"].dt.date
            daily["period_label"] = daily["fecha"].dt.strftime("%d %b")
            grouped = daily.rename(columns={"fecha": "period_key"})[["period_start", "period_label", "total"]]

        grouped = grouped.reset_index(drop=True)
        totals = grouped["total"].values

        if len(totals) < 3:
            return _empty_percentiles(group_by)

        # ── Percentiles ──────────────────────────────────────────────────────
        p25  = float(np.percentile(totals, 25))
        p50  = float(np.percentile(totals, 50))
        p75  = float(np.percentile(totals, 75))
        mean = float(np.mean(totals))
        iqr  = p75 - p25   # Rango intercuartil para proyecciones

        def classify(val: float) -> str:
            if val < p25: return "critico"
            if val < p50: return "bajo"
            if val < p75: return "normal"
            return "alto"

        # ── Períodos históricos clasificados ─────────────────────────────────
        periods: List[Dict] = []
        for _, row in grouped.iterrows():
            val  = float(row["total"])
            zone = classify(val)
            periods.append({
                "label":      str(row["period_label"]),
                "fecha":      str(row["period_start"]),
                "total":      round(val, 2),
                "zone":       zone,
                "zone_label": ZONES[zone],
                "is_future":  False,
                "pct_vs_p50": round((val - p50) / p50 * 100, 1) if p50 > 0 else 0,
                "paso_p25":   val >= p25,
                "paso_p50":   val >= p50,
                "paso_p75":   val >= p75,
            })

        # ── Proyecciones futuras ──────────────────────────────────────────────
        # Generar los próximos N períodos con proyección basada en P50
        last_date = grouped["period_start"].max()
        if hasattr(last_date, 'item'):
            last_date = last_date.item()

        future_periods = _generate_future_periods(
            last_date=last_date,
            group_by=group_by,
            p25=p25, p50=p50, p75=p75,
            daily_df=daily[["fecha", "total"]],
        )
        periods.extend(future_periods)

        # ── Resumen ──────────────────────────────────────────────────────────
        hist = [p for p in periods if not p["is_future"]]
        summary = {
            "total_periods":    len(hist),
            "critico":          sum(1 for p in hist if p["zone"] == "critico"),
            "bajo":             sum(1 for p in hist if p["zone"] == "bajo"),
            "normal":           sum(1 for p in hist if p["zone"] == "normal"),
            "alto":             sum(1 for p in hist if p["zone"] == "alto"),
            "pct_above_median": round(
                sum(1 for p in hist if p["paso_p50"]) / len(hist) * 100, 1
            ) if hist else 0,
        }

        last_real = hist[-1] if hist else None

        print(f">>> PERCENTILES OK: {len(hist)} períodos históricos, P50={p50:.0f}")
        return {
            "percentiles": {
                "p25":   round(p25, 2),
                "p50":   round(p50, 2),
                "p75":   round(p75, 2),
                "media": round(mean, 2),
            },
            "summary":    summary,
            "last_real":  last_real,
            "periods":    periods,
            "group_by":   group_by,
            "start_date": start_dt.strftime("%Y-%m-%d"),
            "end_date":   end_dt.strftime("%Y-%m-%d"),
        }

    except Exception as e:
        print(f"[X] Error en percentile_service: {e}")
        print(traceback.format_exc())
        return _empty_percentiles(group_by)


def _generate_future_periods(
    last_date, group_by: str,
    p25: float, p50: float, p75: float,
    daily_df=None,   # DataFrame con columnas fecha (date), total (float)
) -> List[Dict]:
    """Genera períodos futuros con proyección por día de semana (si hay datos suficientes)."""
    import calendar as cal_mod

    result = []
    today = date.today()
    year_end = date(today.year, 12, 31)

    # ── Percentiles por día de semana (0=lun … 6=dom) ────────────────────────
    dow_p25: Dict[int, float] = {}
    dow_p50: Dict[int, float] = {}
    dow_p75: Dict[int, float] = {}

    if daily_df is not None and len(daily_df) >= 14:
        try:
            df_copy = daily_df.copy()
            df_copy["dow"] = pd.to_datetime(df_copy["fecha"]).dt.dayofweek
            for dow in range(7):
                vals = df_copy[df_copy["dow"] == dow]["total"].values
                if len(vals) >= 4:
                    dow_p25[dow] = float(np.percentile(vals, 25))
                    dow_p50[dow] = float(np.percentile(vals, 50))
                    dow_p75[dow] = float(np.percentile(vals, 75))
        except Exception:
            pass  # Fallback to global percentiles below

    def get_dow_stats(d: date):
        """Devuelve (p25, p50, p75) específicos del día de la semana o globales."""
        dow = d.weekday()
        return (
            dow_p25.get(dow, p25),
            dow_p50.get(dow, p50),
            dow_p75.get(dow, p75),
        )

    if group_by == "day":
        cur = last_date + timedelta(days=1)
        while cur <= year_end:
            dp25, dp50, dp75 = get_dow_stats(cur)
            result.append(_future_period(
                label=cur.strftime("%d %b"),
                fecha=str(cur),
                p25=dp25, p50=dp50, p75=dp75,
            ))
            cur += timedelta(days=1)

    elif group_by == "week":
        days_ahead = (7 - last_date.weekday()) % 7 or 7
        cur = last_date + timedelta(days=days_ahead)
        while cur <= year_end:
            days_in_week = min(7, (year_end - cur).days + 1)
            # Suma de medianas por día de la semana que componen esa semana
            week_p50 = sum(get_dow_stats(cur + timedelta(days=k))[1] for k in range(days_in_week))
            week_p25 = sum(get_dow_stats(cur + timedelta(days=k))[0] for k in range(days_in_week))
            week_p75 = sum(get_dow_stats(cur + timedelta(days=k))[2] for k in range(days_in_week))
            result.append(_future_period(
                label=f"Sem {cur.strftime('%d %b')}",
                fecha=str(cur),
                p25=week_p25, p50=week_p50, p75=week_p75,
            ))
            cur += timedelta(weeks=1)

    elif group_by == "month":
        y, m = last_date.year, last_date.month
        while True:
            m += 1
            if m > 12:
                m = 1
                y += 1
            if y > today.year or (y == today.year and m > 12):
                break
            fd = date(y, m, 1)
            if fd > year_end:
                break
            days_in_month = cal_mod.monthrange(y, m)[1]
            # Suma de medianas por día del mes
            month_p50 = sum(get_dow_stats(date(y, m, d))[1] for d in range(1, days_in_month + 1))
            month_p25 = sum(get_dow_stats(date(y, m, d))[0] for d in range(1, days_in_month + 1))
            month_p75 = sum(get_dow_stats(date(y, m, d))[2] for d in range(1, days_in_month + 1))
            result.append(_future_period(
                label=fd.strftime("%b %Y"),
                fecha=str(fd),
                p25=month_p25, p50=month_p50, p75=month_p75,
            ))

    return result


def _future_period(label: str, fecha: str, p25: float, p50: float, p75: float) -> Dict:
    """Período futuro de referencia estadística — basado en historial real por día de semana."""
    return {
        "label":      label,
        "fecha":      fecha,
        "total":      round(p50, 2),           # Referencia central = mediana del día de semana
        "total_low":  round(p25, 2),           # Mínimo histórico del día de semana
        "total_high": round(p75, 2),           # Máximo histórico del día de semana
        "zone":       "historico_ref",
        "zone_label": "Ref. histórica",
        "is_future":  True,
        "pct_vs_p50": 0,
        "paso_p25":   True,
        "paso_p50":   True,
        "paso_p75":   False,
    }


def _empty_percentiles(group_by: str = "day") -> Dict[str, Any]:
    return {
        "percentiles": {"p25": 0, "p50": 0, "p75": 0, "media": 0},
        "summary": {
            "total_periods": 0,
            "critico": 0, "bajo": 0, "normal": 0, "alto": 0,
            "pct_above_median": 0,
        },
        "last_real":  None,
        "periods":    [],
        "group_by":   group_by,
    }
