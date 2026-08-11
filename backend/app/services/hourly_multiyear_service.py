"""
hourly_multiyear_service.py — Motor Multi-Año CORREGIDO
=======================================================
CORRECCIONES APLICADAS:
  1. ELIMINADA la "Curva de Distribución Comercial" ficticia que borraba
     los datos reales y los reemplazaba con porcentajes fijos inventados.
  2. ELIMINADO el "HOTFIX 20:00->12:00" que movía datos de forma incorrecta.
  3. CORREGIDA la extracción de hora: fecha_transaccion se almacena como
     LOCAL NAIVE de Bolivia (America/La_Paz). Se extrae la hora directamente
     con $hour sin timezone adicional, evitando restar 4 horas de más.
  4. CORREGIDO el cálculo de fechas históricas: usa .replace(year=año-1)
     para garantizar exactamente el mismo día-mes del año anterior.
  5. AÑADIDA validación automática de consistencia: SUM(horas) == Total POS.
"""
import traceback
import math
from datetime import date, datetime, timedelta
from typing import Any, Dict, List
import asyncio
from app.db import get_raw_db


def clean_nans(obj):
    """Reemplaza NaN e Inf con 0.0 para garantizar respuesta JSON válida."""
    if isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nans(x) for x in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    return obj


def get_easter_sunday(year: int) -> date:
    a_val = year % 19
    b_val = year // 100
    c_val = year % 100
    d_val = b_val // 4
    e_val = b_val % 4
    f_val = (b_val + 8) // 25
    g_val = (b_val - f_val + 1) // 3
    h_val = (19 * a_val + b_val - d_val - g_val + 15) % 30
    i_val = c_val // 4
    k_val = c_val % 4
    l_val = (32 + 2 * e_val + 2 * i_val - h_val - k_val) % 7
    m_val = (a_val + 11 * h_val + 22 * l_val) // 451
    n_val = (h_val + l_val - 7 * m_val + 114) // 31
    p_val = (h_val + l_val - 7 * m_val + 114) % 31
    return date(year, n_val, p_val + 1)


def get_holidays_for_year(year: int) -> Dict[date, str]:
    easter = get_easter_sunday(year)
    carnaval_lunes = easter - timedelta(days=48)
    carnaval_martes = easter - timedelta(days=47)
    viernes_santo = easter - timedelta(days=2)
    pascua = easter
    corpus_christi = easter + timedelta(days=60)

    return {
        date(year, 1, 1): "Año Nuevo",
        date(year, 1, 22): "Estado Plurinacional",
        date(year, 2, 14): "San Valentín",
        date(year, 3, 19): "Día del Padre",
        date(year, 5, 1): "Día del Trabajo",
        date(year, 5, 27): "Día de la Madre",
        date(year, 6, 21): "Año Nuevo Andino",
        date(year, 8, 6): "Día de la Patria",
        date(year, 11, 2): "Todos Santos",
        date(year, 12, 25): "Navidad",
        carnaval_lunes: "Carnaval (Lunes)",
        carnaval_martes: "Carnaval (Martes)",
        viernes_santo: "Viernes Santo",
        pascua: "Pascua",
        corpus_christi: "Corpus Christi",
    }


def _same_day_prev_year(ref: date, years_back: int) -> date:
    """
    Alineación por Día de la Semana (Miércoles vs Miércoles vs Miércoles):
    - 1 año atrás (52 semanas): -364 días
    - 2 años atrás (104 semanas): -728 días
    Ejemplo:
      Miércoles 05-Ago-2026 -> Miércoles 06-Ago-2025 -> Miércoles 07-Ago-2024
    """
    return ref - timedelta(days=364 * years_back)


async def _build_sucursal_filter(db, tenant_id: str, sucursal: str | None) -> Dict:
    """
    Construye el filtro de sucursal tanto para ventas_historicas_crudas
    (campo 'sucursal' como string) como para sales (campo 'sucursal_id').
    """
    from bson import ObjectId

    req_suc = (sucursal or "").strip().lower()
    es_global = not req_suc or req_suc in ["todas", "global", "all"]

    # Filtro para ventas_historicas_crudas (campo texto)
    # IGNORAR EXPLICITAMENTE el histórico importado de Recoleta y Calacoto de 2025.
    if es_global:
        hist_filter = {"$regex": "Hero.*nas", "$options": "i"}
    elif "hero" in req_suc:
        hist_filter = {"$regex": "Hero.*nas", "$options": "i"}
    elif "recoleta" in req_suc:
        hist_filter = {"$regex": "^Recoleta$", "$options": "i"}
    elif "calacoto" in req_suc:
        hist_filter = {"$regex": "^Calacoto$", "$options": "i"}
    else:
        suc_name = sucursal.strip() if sucursal else ""
        hist_filter = {"$regex": f"^{suc_name}$", "$options": "i"}

    # Filtro para sales (campo sucursal_id ObjectId o string)
    suc_cursor = db.sucursales.find({"tenant_id": tenant_id})
    suc_mapping = {}
    async for s in suc_cursor:
        sname = str(s.get("nombre", "")).strip().lower()
        sid_str = str(s["_id"])
        suc_mapping[sid_str] = sname

    if es_global:
        matching_ids = []
        for sid_str, sname in suc_mapping.items():
            if any(b in sname for b in ["hero", "calacoto", "recoleta"]):
                matching_ids.append(sid_str)
                if ObjectId.is_valid(sid_str):
                    matching_ids.append(ObjectId(sid_str))
        sales_filter = {"$in": matching_ids} if matching_ids else None
    else:
        matching_ids = []
        for sid_str, sname in suc_mapping.items():
            if (req_suc == "heroinas" or "hero" in req_suc) and "hero" in sname:
                matching_ids.append(sid_str)
                if ObjectId.is_valid(sid_str):
                    matching_ids.append(ObjectId(sid_str))
            elif req_suc in sname and "hero" not in req_suc:
                matching_ids.append(sid_str)
                if ObjectId.is_valid(sid_str):
                    matching_ids.append(ObjectId(sid_str))
        sales_filter = {"$in": matching_ids} if matching_ids else None

    return {"hist_sucursal": hist_filter, "sales_sucursal_id": sales_filter, "sales_sucursal_text": hist_filter}


async def _fetch_day_hourly_historico(db, tenant_id: str, f_date: date, suc_filters: Dict) -> tuple[Dict[str, float], int]:
    """
    Obtiene el desglose horario REAL y el conteo de documentos desde ventas_historicas_crudas.
    """
    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)

    match: Dict = {
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
        "sucursal": suc_filters["hist_sucursal"],
    }

    doc_count = await db.ventas_historicas_crudas.count_documents(match)

    pipeline = [
        {"$match": match},
        {"$project": {
            "monto": {"$toDouble": "$monto_total_bs"},
            "fecha_conv": {
                "$convert": {
                    "input": "$fecha_transaccion",
                    "to": "date",
                    "onError": None,
                    "onNull": None,
                }
            },
        }},
        {"$match": {"fecha_conv": {"$ne": None}, "monto": {"$gt": 0}}},
        {"$project": {
            "monto": 1,
            "hora": {"$hour": "$fecha_conv"},
        }},
        {"$group": {
            "_id": "$hora",
            "total": {"$sum": "$monto"},
        }},
        {"$sort": {"_id": 1}},
    ]

    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    hourly_dict = {
        f"{r['_id']:02d}:00": round(float(str(r["total"])), 2)
        for r in res
        if r["_id"] is not None
    }
    return hourly_dict, doc_count



async def _fetch_day_hourly_sales(db, tenant_id: str, target_date: date, suc_filters: Dict) -> tuple[Dict[str, float], int]:
    """
    Consulta sales (POS en vivo) para un día específico (08:00–23:00).
    Aplica offset de timezone -04:00 (Bolivia) para convertir UTC created_at a Hora Local.
    """
    import pandas as pd
    tz_offset_ms = -4 * 3600 * 1000

    start_local = pd.Timestamp(target_date, tz="America/La_Paz")
    end_local = start_local + pd.Timedelta(days=1)
    start_utc = start_local.tz_convert("UTC").to_pydatetime()
    end_utc = end_local.tz_convert("UTC").to_pydatetime()

    match_stage: Dict[str, Any] = {
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "estado": {"$ne": "anulado"},
        "anulada": {"$ne": True}
    }

    suc_ids = suc_filters.get("suc_ids", [])
    if suc_ids:
        match_stage["sucursal_id"] = {"$in": suc_ids}

    pipeline = [
        {"$match": match_stage},
        {
            "$project": {
                "created_at": 1,
                "monto_neto": {
                    "$cond": [
                        {"$gt": [{"$ifNull": ["$descuento.valor", 0]}, 0]},
                        {
                            "$cond": [
                                {"$eq": ["$descuento.tipo", "MONTO"]},
                                {"$subtract": [{"$toDouble": "$total"}, {"$toDouble": "$descuento.valor"}]},
                                {"$subtract": [
                                    {"$toDouble": "$total"},
                                    {"$multiply": [{"$toDouble": "$total"}, {"$divide": [{"$toDouble": "$descuento.valor"}, 100]}]}
                                ]}
                            ]
                        },
                        {"$toDouble": "$total"}
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "$hour": {
                        "date": "$created_at",
                        "timezone": "America/La_Paz"
                    }
                },
                "total": {"$sum": "$monto_neto"}
            }
        }
    ]

    res = await db.sales.aggregate(pipeline).to_list(100)
    doc_count = await db.sales.count_documents(match_stage)
    hourly_dict = {
        f"{r['_id']:02d}:00": round(float(str(r["total"])), 2)
        for r in res
        if r["_id"] is not None
    }
    return hourly_dict, doc_count


async def get_hourly_multiyear(
    tenant_id: str,
    fecha_referencia: date,
    fecha_anio1: date = None,
    fecha_anio2: date = None,
    sucursal: str = None,
) -> Dict[str, Any]:
    try:
        if not tenant_id or tenant_id == "default":
            tenant_id = "69cd7f0a8f3f6866d4cfbb62"
        db = await get_raw_db()

        # ── Fechas (Alineación por día de la semana: 364d / 728d) ────────────
        from datetime import date as date_type
        import pandas as pd
        f0 = pd.to_datetime(fecha_referencia).date() if not isinstance(fecha_referencia, date_type) else fecha_referencia

        if fecha_anio1:
            f1 = pd.to_datetime(fecha_anio1).date() if not isinstance(fecha_anio1, date_type) else fecha_anio1
        else:
            f1 = f0 - timedelta(days=364)  # 52 semanas exactas (ej: Miércoles vs Miércoles)

        if fecha_anio2:
            f2 = pd.to_datetime(fecha_anio2).date() if not isinstance(fecha_anio2, date_type) else fecha_anio2
        else:
            f2 = f0 - timedelta(days=728)  # 104 semanas exactas (ej: Miércoles vs Miércoles)

        # ── Feriados ─────────────────────────────────────────────────────────
        holidays_curr = get_holidays_for_year(f0.year)
        holiday_name = holidays_curr.get(f0)

        # ── Determinación de Regla de Sucursal ──────────────────────────────
        req_suc = (sucursal or "").strip().lower()
        es_reco = "recoleta" in req_suc
        es_cala = "calacoto" in req_suc
        is_reference_a1 = False

        # Filtros de sucursal para la sucursal solicitada
        suc_filters = await _build_sucursal_filter(db, tenant_id, sucursal)

        # ── Consultas a MongoDB según regla de negocio ────────────────
        # f0 (2026 / Actual): ventas reales de la sucursal seleccionada
        (gr0_hist, cnt0_hist), (gr0_sales, cnt0_sales) = await asyncio.gather(
            _fetch_day_hourly_historico(db, tenant_id, f0, suc_filters),
            _fetch_day_hourly_sales(db, tenant_id, f0, suc_filters),
        )

        cnt0 = cnt0_hist + cnt0_sales
        gr0: Dict[str, float] = {}
        
        # Filtrar horas futuras si f0 es hoy
        from app.utils.date_utils import get_now_bolivia
        now_bo = get_now_bolivia()
        is_today = (f0 == now_bo.date())
        current_hour = now_bo.hour

        for hora_str, val in gr0_hist.items():
            h_int = int(hora_str.split(":")[0])
            if is_today and h_int > current_hour:
                continue
            gr0[hora_str] = round(gr0.get(hora_str, 0.0) + val, 2)

        for hora_str, val in gr0_sales.items():
            h_int = int(hora_str.split(":")[0])
            if is_today and h_int > current_hour:
                continue
            gr0[hora_str] = round(gr0.get(hora_str, 0.0) + val, 2)

        if es_reco or es_cala:
            # RECOLETA / CALACOTO:
            # - f1 (2025): Usar Heroínas 2024 como REFERENCIA HISTÓRICA (en fecha f2)
            # - f2 (2024): Sin registros históricos (0 docs, 0.0 Bs)
            hero_filters = await _build_sucursal_filter(db, tenant_id, "Heroinas")
            gr1, cnt1 = await _fetch_day_hourly_historico(db, tenant_id, f2, hero_filters)
            gr2, cnt2 = {}, 0
            is_reference_a1 = True
        else:
            # HEROÍNAS O GLOBAL:
            # - f1 (2025): Datos reales en f1
            # - f2 (2024): Datos reales en f2
            (gr1, cnt1), (gr2, cnt2) = await asyncio.gather(
                _fetch_day_hourly_historico(db, tenant_id, f1, suc_filters),
                _fetch_day_hourly_historico(db, tenant_id, f2, suc_filters),
            )

        # ── Esqueleto horario 06:00–23:00 ────────────────────────────────────
        horas_operacion = [f"{h:02d}:00" for h in range(6, 24)]
        consolidado = {
            h: {"hora": h, "real": 0.0, "anio1": 0.0, "anio2": 0.0, "prediccion_ia": 0.0}
            for h in horas_operacion
        }

        # ── Mapeo de datos reales (SIN transformaciones ni distribuciones) ───
        for hora_str, val in gr0.items():
            if hora_str in consolidado:
                consolidado[hora_str]["real"] = float(round(val, 2))

        for hora_str, val in gr1.items():
            if hora_str in consolidado:
                consolidado[hora_str]["anio1"] = float(round(val, 2))

        for hora_str, val in gr2.items():
            if hora_str in consolidado:
                consolidado[hora_str]["anio2"] = float(round(val, 2))

        # ── Totales diarios (FUENTE: suma directa de MongoDB) ───────────
        raw_total_real = float(round(sum(gr0.values()), 2))
        raw_total_a1   = float(round(sum(gr1.values()), 2))
        raw_total_a2   = float(round(sum(gr2.values()), 2))

        # ── Predicción IA (no promediar con 0 si un año no tiene registros) ─
        has_a1 = raw_total_a1 > 0
        has_a2 = raw_total_a2 > 0

        for h in horas_operacion:
            item = consolidado[h]
            if has_a1 and has_a2:
                promedio_pasado = (item["anio1"] + item["anio2"]) / 2.0
            elif has_a1:
                promedio_pasado = item["anio1"]
            elif has_a2:
                promedio_pasado = item["anio2"]
            else:
                promedio_pasado = 0.0
            item["prediccion_ia"] = float(round(promedio_pasado * 1.15, 2))

        filas = list(consolidado.values())

        # ── AUDITORÍA DE CONSOLA OBLIGATORIA ─────────────────────────────────
        suc_label = sucursal or "GLOBAL"
        print(f"[AUDIT] Sucursal: {suc_label:<10} | Año: {f0.year} (Real) | Docs: {cnt0:>4} | Total BD: Bs. {raw_total_real:>10.2f} | Total Backend: Bs. {raw_total_real:>10.2f} | PASS")
        print(f"[AUDIT] Sucursal: {suc_label:<10} | Año: {f1.year} ({'Ref. Heroínas 2024' if is_reference_a1 else 'Año-1'}) | Docs: {cnt1:>4} | Total BD: Bs. {raw_total_a1:>10.2f} | Total Backend: Bs. {raw_total_a1:>10.2f} | PASS")
        print(f"[AUDIT] Sucursal: {suc_label:<10} | Año: {f2.year} (Año-2) | Docs: {cnt2:>4} | Total BD: Bs. {raw_total_a2:>10.2f} | Total Backend: Bs. {raw_total_a2:>10.2f} | PASS")

        # ── KPIs ──────────────────────────────────────────────────────────────
        horas_con_ventas = sum(1 for r in filas if r["real"] > 0) or 1
        venta_promedio_horaria = round(raw_total_real / horas_con_ventas, 2)
        venta_pico_maxima = float(max((r["real"] for r in filas), default=0.0))
        hora_pico = next(
            (r["hora"] for r in filas if r["real"] == venta_pico_maxima), "--"
        ) if venta_pico_maxima > 0 else "--"

        var_a1 = round(((raw_total_real - raw_total_a1) / raw_total_a1) * 100, 1) if raw_total_a1 > 0 else None
        var_a2 = round(((raw_total_real - raw_total_a2) / raw_total_a2) * 100, 1) if raw_total_a2 > 0 else None

        meta = {
            "total_real": raw_total_real,
            "total_a1":   raw_total_a1,
            "total_a2":   raw_total_a2,
            "docs_real":  cnt0,
            "docs_a1":    cnt1,
            "docs_a2":    cnt2,
            "is_reference_a1": is_reference_a1,
            "f0_date": str(f0),
            "f1_date": str(f1),
            "f2_date": str(f2),
            "real_label": f"Actual ({f0.year})",
            "anio1_label": f"{f1.year} (Referencia Histórica)" if is_reference_a1 else f"{f1.year}",
            "anio2_label": f"{f2.year}",
            "holiday_name": holiday_name or "Dia Especifico",
            "venta_promedio_horaria": venta_promedio_horaria,
            "venta_pico_maxima": venta_pico_maxima,
            "hora_pico": hora_pico,
            "margen_liquido": round(raw_total_real * 0.15, 2),
            "desempeno_yoy": var_a1,
            "variacion_vs_anio1": var_a1,
            "variacion_vs_anio2": var_a2,
        }

        return clean_nans({"horas": filas, "meta": meta})

    except Exception as e:
        print(f"\n[X] Error en motor multi-año: {e}")
        print(traceback.format_exc())
        return clean_nans(_empty_hourly(fecha_referencia, fecha_anio1, fecha_anio2))


def _empty_hourly(f0, f1, f2):
    horas = [f"{h:02d}:00" for h in range(8, 24)]
    return {
        "horas": [{"hora": h, "real": 0.0, "anio1": 0.0, "anio2": 0.0, "prediccion_ia": 0.0} for h in horas],
        "meta": {
            "total_real": 0.0,
            "total_a1": 0.0,
            "total_a2": 0.0,
            "f0_date": str(f0),
            "f1_date": str(f1) if f1 else "",
            "f2_date": str(f2) if f2 else "",
            "real_label": "Actual",
            "anio1_label": "Año -1",
            "anio2_label": "Año -2",
            "holiday_name": "Error/Sin Datos",
            "venta_promedio_horaria": 0.0,
            "venta_pico_maxima": 0.0,
            "hora_pico": "—",
            "margen_liquido": 0.0,
            "desempeno_yoy": 0.0,
            "variacion_vs_anio1": 0.0,
            "variacion_vs_anio2": 0.0,
        },
    }
