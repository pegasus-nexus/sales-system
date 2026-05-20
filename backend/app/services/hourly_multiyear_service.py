import traceback
import pandas as pd
from datetime import date, datetime
from typing import Any, Dict, List

from app.db import get_raw_db


async def get_hourly_multiyear(
    tenant_id: str,
    fecha_referencia: date,
    sucursal: str = None,
) -> Dict[str, Any]:
    """
    Devuelve ventas por hora para:
      - fecha_referencia        (Año 0  / "Real")
      - fecha_referencia - 364d (Año -1 / 2025)
      - fecha_referencia - 728d (Año -2 / 2024)
    
    Si fecha_referencia == hoy, agrega una línea de Predicción hasta las 20:00
    basada en el promedio de Año -1 y Año -2 con un factor +10%.
    Si sucursal se provee, filtra solo esa sucursal.
    """
    print(f"\n>>> MOTOR MULTI-AÑO: fecha_referencia={fecha_referencia}, sucursal={sucursal or 'TODAS'}")

    try:
        db = await get_raw_db()

        # Definir las 3 fechas objetivo
        f0 = fecha_referencia                          # Año 0 (día elegido)
        f1 = fecha_referencia - pd.DateOffset(days=364)  # Año -1
        f2 = fecha_referencia - pd.DateOffset(days=728)  # Año -2

        # Rango de fechas a traer de MongoDB (entre f2 y f0, solo los 3 días)
        from datetime import timedelta
        # Convertimos a datetime para el filtro
        f0_dt = datetime.combine(f0, datetime.min.time())
        f1_dt = datetime.combine(f1.date(), datetime.min.time()) if hasattr(f1, 'date') else datetime.combine(f1, datetime.min.time())
        f2_dt = datetime.combine(f2.date(), datetime.min.time()) if hasattr(f2, 'date') else datetime.combine(f2, datetime.min.time())

        # OPTIMIZACIÓN: Traer SOLO los 3 días necesarios
        date_filter = {"$or": [
            {"fecha_transaccion": {"$gte": f0_dt, "$lt": f0_dt + timedelta(days=1)}},
            {"fecha_transaccion": {"$gte": f1_dt, "$lt": f1_dt + timedelta(days=1)}},
            {"fecha_transaccion": {"$gte": f2_dt, "$lt": f2_dt + timedelta(days=1)}}
        ]}
        # Filtrar por sucursal si se especifica
        if sucursal and sucursal.strip():
            date_filter["sucursal"] = {"$regex": sucursal.strip(), "$options": "i"}
        
        cursor = db.ventas_historicas_crudas.find(
            date_filter,
            {
                "_id": 0,
                "fecha_transaccion": 1,
                "monto_total_bs": 1,
            }
        )
        datos = await cursor.to_list(length=None)

        if not datos:
            return _empty_hourly()

        df = pd.DataFrame(datos)

        # Limpieza
        df['fecha_transaccion'] = pd.to_datetime(df['fecha_transaccion'], errors='coerce', utc=True)
        df.dropna(subset=['fecha_transaccion'], inplace=True)
        df['monto_total_bs'] = pd.to_numeric(df['monto_total_bs'], errors='coerce').fillna(0)
        df['fecha_solo'] = df['fecha_transaccion'].dt.date
        df['hora_str'] = df['fecha_transaccion'].dt.strftime('%H:00')

        # --- Helper: agrupar por hora para una fecha dada ---
        def agrupar_hora(fecha_target):
            fecha_date = fecha_target.date() if hasattr(fecha_target, 'date') else fecha_target
            sub = df[df['fecha_solo'] == fecha_date]
            if sub.empty:
                return {}
            gr = sub.groupby('hora_str')['monto_total_bs'].sum()
            return gr.to_dict()

        gr0 = agrupar_hora(f0)   # Real / Año 0
        gr1 = agrupar_hora(f1)   # Año -1
        gr2 = agrupar_hora(f2)   # Año -2

        # Rango horario forzado 08:00 - 20:00
        horas = [f"{h:02d}:00" for h in range(8, 21)]

        hoy_real = date.today()
        es_hoy = (fecha_referencia == hoy_real) or (
            # fallback: si no hay datos hoy, comparamos con fecha_max
            pd.Timestamp(fecha_referencia, tz='UTC').date() == df['fecha_transaccion'].max().date()
        )

        filas: List[Dict] = []
        for hora in horas:
            real_val = gr0.get(hora, 0.0)
            anio1_val = gr1.get(hora, 0.0)
            anio2_val = gr2.get(hora, 0.0)

            # Predicción: promedio de años anteriores x1.10
            promedio_hist = (anio1_val + anio2_val) / 2 if (anio1_val + anio2_val) > 0 else 0.0
            prediccion = round(promedio_hist * 1.10, 2) if es_hoy else None

            fila: Dict[str, Any] = {
                "hora": hora,
                "real": round(real_val, 2),
                "anio1": round(anio1_val, 2),
                "anio2": round(anio2_val, 2),
            }
            if prediccion is not None:
                fila["prediccion"] = prediccion

            filas.append(fila)

        # Calcular variaciones porcentuales globales para el tooltip
        total_real = sum(r["real"] for r in filas)
        total_a1   = sum(r["anio1"] for r in filas)
        total_a2   = sum(r["anio2"] for r in filas)

        def variacion(curr, prev):
            if prev == 0:
                return None
            return round((curr - prev) / prev * 100, 1)

        labels = {
            "real_label":  str(f0),
            "anio1_label": str(f1.date() if hasattr(f1, 'date') else f1),
            "anio2_label": str(f2.date() if hasattr(f2, 'date') else f2),
            "es_hoy": es_hoy,
            "variacion_vs_anio1": variacion(total_real, total_a1),
            "variacion_vs_anio2": variacion(total_real, total_a2),
        }

        print(f">>> MULTI-AÑO OK: {len(filas)} horas, real={total_real:.0f}")
        return {"horas": filas, "meta": labels}

    except Exception as e:
        print(f"[X] Error en motor multi-año: {e}")
        print(traceback.format_exc())
        return _empty_hourly()


def _empty_hourly():
    horas = [f"{h:02d}:00" for h in range(8, 21)]
    return {
        "horas": [{"hora": h, "real": 0, "anio1": 0, "anio2": 0} for h in horas],
        "meta": {
            "real_label": "—", "anio1_label": "—", "anio2_label": "—",
            "es_hoy": False, "variacion_vs_anio1": None, "variacion_vs_anio2": None
        }
    }
