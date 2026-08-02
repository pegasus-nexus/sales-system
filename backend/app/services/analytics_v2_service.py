import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any
import numpy as np
import pandas as pd

from app.db import get_raw_db
from app.services.daily_sales_service import get_official_daily_sales

_dashboard_cache = {}
_dashboard_locks = {}


def safe_float(val) -> float:
    """Convierte cualquier tipo (incluyendo Decimal128 de BSON) a float de forma segura."""
    if val is None:
        return 0.0
    try:
        return float(str(val))
    except (ValueError, TypeError):
        return 0.0

async def get_dashboard_metrics_v2(
    tenant_id: str, 
    start_date: datetime, 
    end_date: datetime,
    sucursal_id: str = None,
    time_range: str = '30days',
    clima_evento: str = None
) -> Dict[str, Any]:
    
    tenant_id = tenant_id or "69cd7f0a8f3f6866d4cfbb62"
    LOCAL_TZ = 'America/La_Paz'
    _local_date_today = pd.Timestamp.now(tz=LOCAL_TZ).strftime('%Y-%m-%d')
    
    if time_range != 'custom':
        cache_key = f"{tenant_id}_{sucursal_id}_{time_range}_{clima_evento}"
        if time_range == 'today':
            cache_key = f"{tenant_id}_{sucursal_id}_{time_range}_{_local_date_today}_{clima_evento}"
    else:
        cache_key = f"{tenant_id}_{sucursal_id}_{time_range}_{start_date.date()}_{end_date.date()}_{clima_evento}"

    cache_ttl = 60 if time_range == 'today' else 300
        
    if cache_key in _dashboard_cache:
        cached_time, cached_data = _dashboard_cache[cache_key]
        if time.time() - cached_time < cache_ttl:
            return cached_data
            
    if cache_key not in _dashboard_locks:
        _dashboard_locks[cache_key] = asyncio.Lock()
        
    async with _dashboard_locks[cache_key]:
        if cache_key in _dashboard_cache:
            cached_time, cached_data = _dashboard_cache[cache_key]
            if time.time() - cached_time < cache_ttl:
                return cached_data
                
        t_start = time.time()
        print("\n" + "="*50)
        print(">>> INICIANDO PROCESAMIENTO ANALÍTICO EJECUTIVO (PIPELINES V2) <<<")
        
        db = await get_raw_db()
        
        # 1. Resolve target_sucursal name if sucursal_id is provided
        nombre_sucursal_filtro = None
        if sucursal_id:
            try:
                from bson import ObjectId
                suc_doc = await db.sucursales.find_one({"_id": ObjectId(sucursal_id)})
                if suc_doc:
                    nombre_sucursal_filtro = suc_doc.get("nombre")
            except Exception:
                nombre_sucursal_filtro = sucursal_id
                
        # 2. Get global Sucursales mapping (whitelist)
        cursor_sucursales = db.sucursales.find({"tenant_id": tenant_id})
        suc_id_to_name = {}
        async for s in cursor_sucursales:
            nombre = str(s.get("nombre", "")).strip()
            n_lower = nombre.lower()
            if any(bad in n_lower for bad in ["fexco", "distribucion", "dsitribucion", "distribución", "vendedores", "sucre", "mayorista", "supermercados"]):
                continue
            nombre_real = None
            if "hero" in n_lower: nombre_real = "Heroínas"
            elif "calacoto" in n_lower: nombre_real = "Calacoto"
            elif "recoleta" in n_lower: nombre_real = "Recoleta"
            
            if nombre_real:
                suc_id_to_name[str(s["_id"])] = nombre_real
                
        # Filter matching IDs based on target_sucursal
        if nombre_sucursal_filtro:
            target_clean = "Heroínas" if "hero" in nombre_sucursal_filtro.lower() else nombre_sucursal_filtro
            matching_ids = [k for k, v in suc_id_to_name.items() if v == target_clean]
            regex_pat = "Hero.*nas" if target_clean == "Heroínas" else target_clean
        else:
            matching_ids = list(suc_id_to_name.keys())
            regex_pat = "Hero.*nas|Calacoto|Recoleta"
            
        # 3. Time Range Logic (Business Day Offset aligned)
        hoy_local = pd.Timestamp.now(tz=LOCAL_TZ).normalize()
        if pd.Timestamp.now(tz=LOCAL_TZ).hour < 4:
            hoy_local = hoy_local - pd.Timedelta(days=1)
            
        if time_range == 'today':
            start_curr = hoy_local.tz_convert('UTC')
            end_curr = (hoy_local + pd.Timedelta(days=1)).tz_convert('UTC')
            delta_prev = pd.Timedelta(days=364)
        elif time_range == 'yesterday':
            start_curr = (hoy_local - pd.Timedelta(days=1)).tz_convert('UTC')
            end_curr = hoy_local.tz_convert('UTC')
            delta_prev = pd.Timedelta(days=364)
        elif time_range == '7days':
            start_curr = (hoy_local - pd.Timedelta(days=7)).tz_convert('UTC')
            end_curr = (hoy_local + pd.Timedelta(days=1)).tz_convert('UTC')
            delta_prev = pd.Timedelta(days=7)
        elif time_range == '30days':
            start_curr = (hoy_local - pd.Timedelta(days=30)).tz_convert('UTC')
            end_curr = (hoy_local + pd.Timedelta(days=1)).tz_convert('UTC')
            delta_prev = pd.Timedelta(days=30)
        elif time_range == 'this_month':
            start_curr = hoy_local.replace(day=1).tz_convert('UTC')
            end_curr = (hoy_local + pd.Timedelta(days=1)).tz_convert('UTC')
            delta_prev = pd.Timedelta(days=30)
        elif time_range == 'this_year':
            start_curr = hoy_local.replace(month=1, day=1).tz_convert('UTC')
            end_curr = (hoy_local + pd.Timedelta(days=1)).tz_convert('UTC')
            delta_prev = pd.Timedelta(days=364)
        elif time_range == 'custom':
            start_curr = pd.to_datetime(start_date, utc=True)
            end_curr_dt_tmp = pd.to_datetime(end_date, utc=True)
            if end_curr_dt_tmp.hour == 0 and end_curr_dt_tmp.minute == 0 and end_curr_dt_tmp.second == 0:
                end_curr = end_curr_dt_tmp + pd.Timedelta(days=1)
            else:
                end_curr = end_curr_dt_tmp
            dias_diff = max((end_curr - start_curr).days, 1)
            delta_prev = pd.Timedelta(days=dias_diff)
        else: # 'all' fallback
            start_curr = (hoy_local - pd.Timedelta(days=365)).tz_convert('UTC')
            end_curr = (hoy_local + pd.Timedelta(days=1)).tz_convert('UTC')
            delta_prev = pd.Timedelta(days=365)
            
        start_curr_dt = start_curr.to_pydatetime()
        end_curr_dt = end_curr.to_pydatetime()
        start_prev_dt = (start_curr - delta_prev).to_pydatetime()
        end_prev_dt = (end_curr - delta_prev).to_pydatetime()
        start_yoy_dt = (start_curr - pd.Timedelta(days=364)).to_pydatetime()
        end_yoy_dt = (end_curr - pd.Timedelta(days=364)).to_pydatetime()

        branches_cases = []
        for k, v in suc_id_to_name.items():
            branches_cases.append({"case": {"$eq": ["$sucursal", k]}, "then": v})
            
        branches_cases.extend([
            {"case": {"$regexMatch": {"input": {"$ifNull": ["$sucursal", ""]}, "regex": "Hero.*nas", "options": "i"}}, "then": "Heroínas"},
            {"case": {"$regexMatch": {"input": {"$ifNull": ["$sucursal", ""]}, "regex": "Calacoto", "options": "i"}}, "then": "Calacoto"},
            {"case": {"$regexMatch": {"input": {"$ifNull": ["$sucursal", ""]}, "regex": "Recoleta", "options": "i"}}, "then": "Recoleta"}
        ])

        test_doc = await db.ventas_historicas_crudas.find_one({"tenant_id": tenant_id})
        print("NUEVO ESQUEMA HISTORICO:", test_doc, flush=True)

        def get_base_pipeline(s_date, e_date):
            sales_match = {
                "tenant_id": tenant_id,
                "created_at": {"$gte": s_date, "$lt": e_date},
                "estado": {"$ne": "anulado"},
                "anulada": {"$ne": True}
            }
            if sucursal_id:
                sales_match["sucursal_id"] = {"$in": matching_ids + [target_clean.upper()]}
                
            return [
                {"$match": {
                    "tenant_id": tenant_id,
                    "fecha_transaccion": {"$gte": s_date, "$lt": e_date},
                    "sucursal": {"$regex": regex_pat, "$options": "i"}
                }},
                {"$project": {
                    "_id": 0,
                    "id_ticket": {"$ifNull": ["$original_sale_id", {"$toString": "$_id"}]},
                    "fecha": "$fecha_transaccion",
                    "monto": "$monto_total_bs",
                    "sucursal": "$sucursal",
                    "producto": "$nombre_producto",
                    "cantidad": "$cantidad_vendida",
                    "cliente": "$cliente",
                    "estado": "$estado"
                }},
                {"$unionWith": {
                    "coll": "sales",
                    "pipeline": [
                        {"$match": sales_match},
                        {"$project": {
                            "_id": 0,
                            "id_ticket": {"$toString": "$_id"},
                            "fecha": "$created_at",
                            "monto": {"$toDouble": "$total"},
                            "costo": {"$literal": 0},
                            "sucursal": "$sucursal_id",
                            "producto": "GENERAL",
                            "cantidad": 1,
                            "cliente": {"$ifNull": ["$cliente.razon_social", "$cliente.nit", ""]},
                            "estado": "$estado"
                        }}
                    ]
                }},
                {"$addFields": {
                    "sucursal_mapped": {
                        "$switch": {
                            "branches": branches_cases,
                            "default": "Desconocido"
                        }
                    }
                }},
                {"$match": {
                    "sucursal_mapped": {"$ne": "Desconocido"}
                }}
            ]
            
        pipeline_current = get_base_pipeline(start_curr_dt, end_curr_dt) + [
            {"$addFields": {
                "fecha_negocio": {
                    "$dateSubtract": {
                        "startDate": "$fecha",
                        "unit": "hour",
                        "amount": 4
                    }
                }
            }},
            {"$addFields": {
                "fecha_str": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$fecha_negocio",
                        "timezone": "-04:00"
                    }
                },
                "hora_str": {
                    "$dateToString": {
                        "format": "%H:00",
                        "date": "$fecha_negocio",
                        "timezone": "-04:00"
                    }
                }
            }},
            {"$facet": {
                "kpis": [
                    {"$group": {
                        "_id": None,
                        "total_ingresos": {"$sum": "$monto"},
                        "tickets_unicos": {"$addToSet": "$id_ticket"},
                        "clientes_raw": {"$addToSet": "$cliente"}
                    }},
                    {"$project": {
                        "total_ingresos": 1,
                        "total_ordenes": {"$size": "$tickets_unicos"},
                        "clientes_activos": {"$size": "$clientes_raw"}
                    }}
                ],
                "tendencia": [
                    {"$group": {
                        "_id": "$fecha_str",
                        "ingresos": {"$sum": "$monto"},
                        "tickets_unicos": {"$addToSet": "$id_ticket"}
                    }},
                    {"$project": {
                        "name": "$_id",
                        "ingresos": 1,
                        "tickets": {"$size": "$tickets_unicos"},
                        "ticket_promedio": {"$divide": ["$ingresos", {"$cond": [{"$eq": [{"$size": "$tickets_unicos"}, 0]}, 1, {"$size": "$tickets_unicos"}]}]},
                        "costo": {"$multiply": ["$ingresos", 0.85]},
                        "margen": {"$multiply": ["$ingresos", 0.15]}
                    }},
                    {"$sort": {"name": 1}}
                ],
                "sucursales": [
                    {"$group": {
                        "_id": "$sucursal_mapped",
                        "ventas": {"$sum": "$monto"},
                        "costo_real": {"$sum": "$costo"},
                        "tickets_unicos": {"$addToSet": "$id_ticket"}
                    }},
                    {"$project": {
                        "name": "$_id",
                        "ventas": 1,
                        "costo_real": 1,
                        "tickets_cliente": {"$size": "$tickets_unicos"},
                        "margen": {"$subtract": ["$ventas", "$costo_real"]}
                    }}
                ],
                "productos": [
                    {"$group": {
                        "_id": {"$toUpper": "$producto"},
                        "ingresos": {"$sum": "$monto"},
                        "cantidad": {"$sum": "$cantidad"}
                    }},
                    {"$sort": {"ingresos": -1}}
                ],
                "tickets_list": [
                    {"$group": {
                        "_id": "$id_ticket",
                        "monto_total": {"$sum": "$monto"}
                    }},
                    {"$project": {"monto_total": 1, "_id": 0}}
                ],
                "horas": [
                    {"$group": {
                        "_id": "$hora_str",
                        "monto_total": {"$sum": "$monto"}
                    }}
                ]
            }}
        ]
        
        pipeline_prev = get_base_pipeline(start_prev_dt, end_prev_dt) + [
            {"$group": {
                "_id": {"$toUpper": "$producto"},
                "ingresos": {"$sum": "$monto"}
            }}
        ]
        
        pipeline_yoy = get_base_pipeline(start_yoy_dt, end_yoy_dt) + [
            {"$addFields": {
                "fecha_negocio": {
                    "$dateSubtract": {
                        "startDate": "$fecha",
                        "unit": "hour",
                        "amount": 4
                    }
                }
            }},
            {"$addFields": {
                "hora_str": {
                    "$dateToString": {
                        "format": "%H:00",
                        "date": "$fecha_negocio",
                        "timezone": "-04:00"
                    }
                }
            }},
            {"$group": {
                "_id": "$hora_str",
                "monto_total": {"$sum": "$monto"}
            }}
        ]
        
        t_mongo_start = time.time()
        curr_task = db.ventas_historicas_crudas.aggregate(pipeline_current).to_list(length=None)
        prev_task = db.ventas_historicas_crudas.aggregate(pipeline_prev).to_list(length=None)
        yoy_task = db.ventas_historicas_crudas.aggregate(pipeline_yoy).to_list(length=None)
        
        curr_res, prev_res, yoy_res = await asyncio.gather(curr_task, prev_task, yoy_task)
        t_mongo_end = time.time()
        print(f"PIPELINES EXECUTED IN: {t_mongo_end - t_mongo_start:.4f}s")
        
        data = curr_res[0] if curr_res else {}
        
        # REUTILIZACIÓN DIRECTA DEL SERVICIO OFICIAL DE VENTAS DIARIAS (SSOT)
        official_daily = await get_official_daily_sales(
            tenant_id=tenant_id,
            start_dt=start_curr_dt,
            end_dt=end_curr_dt,
            sucursal_id=sucursal_id
        )
        ventas_brutas = official_daily["total_ventas"]

        kpis = data.get("kpis", [])
        if kpis:
            k = kpis[0]
            total_ordenes = int(k.get("total_ordenes", 0))
            clientes_activos = int(k.get("clientes_activos", 0))
        else:
            total_ordenes = 0
            clientes_activos = 0
            
        ticket_promedio = ventas_brutas / total_ordenes if total_ordenes > 0 else 0.0
        
        tickets_list = [safe_float(t["monto_total"]) for t in data.get("tickets_list", [])]
        p90_val = float(np.percentile(tickets_list, 90)) if tickets_list else 0.0
        p50_val = float(np.percentile(tickets_list, 50)) if tickets_list else 0.0
        
        sales_by_branch_map = {}
        for b in data.get("sucursales", []):
            n = b["name"]
            if n == "MAP_LIVE" or n == "Desconocido":
                continue 
            if n not in sales_by_branch_map:
                sales_by_branch_map[n] = {"name": n, "ventas": 0.0, "costo": 0.0, "margen": 0.0, "tickets_cliente": 0}
            sales_by_branch_map[n]["ventas"] += safe_float(b.get("ventas", 0))
            sales_by_branch_map[n]["costo"] += safe_float(b.get("costo_real", 0))
            sales_by_branch_map[n]["margen"] += safe_float(b.get("margen", 0))
            sales_by_branch_map[n]["tickets_cliente"] += int(b.get("tickets_cliente", 0))
            
        # Corregir `ventas_brutas` para que incluya las ventas históricas crudas
        total_unificado_sucursales = sum(d["ventas"] for d in sales_by_branch_map.values())
        if total_unificado_sucursales > 0:
            ventas_brutas = total_unificado_sucursales
            
        sales_by_branch = []
        desglose_sucursales = {}
        for n, d in sales_by_branch_map.items():
            if d["ventas"] > 0:
                v = d["ventas"]
                vis = d["tickets_cliente"]
                costo_real = d["costo"]
                
                if costo_real > 0:
                    # Real formula from DB costs:
                    # Comisión Matriz = costo_real × 15% (what the matriz earns on goods)
                    # Margen Retail   = ventas - costo_real (what the branch earns)
                    # Margen Neto     = Comisión + Retail = ventas - 0.85 × costo_real
                    comision = round(costo_real * 0.15, 2)
                    margen_retail = round(v - costo_real, 2)
                    margen_neto = round(comision + margen_retail, 2)
                else:
                    # Fallback for historical records without costo_unitario
                    # Uses the formula: ventas × 0.85 = costo_estimado
                    costo_estimado = v * 0.85
                    comision = round(costo_estimado * 0.15, 2)   # = v × 0.1275
                    margen_retail = round(v * 0.15, 2)           # = v × 0.15
                    margen_neto = round(comision + margen_retail, 2)  # = v × 0.2775
                
                ticket_medio = v / vis if vis > 0 else 0
                
                sales_by_branch.append({
                    "name": n,
                    "ventas": v,
                    "margen": margen_neto,
                    "tickets_cliente": vis
                })
                
                desglose_sucursales[n] = {
                    "ingresos": v,
                    "comision": comision,
                    "margenRetail": margen_retail,
                    "margenNeto": margen_neto,
                    "ticketMedio": ticket_medio,
                    "visitas": vis
                }
                
        sales_by_branch.sort(key=lambda x: x["ventas"], reverse=True)
        
        sucursal_top = None
        if not sucursal_id and sales_by_branch and sales_by_branch[0]["ventas"] > 0:
            top = sales_by_branch[0]
            sucursal_top = {
                "nombre": top["name"],
                "ingresos": top["ventas"],
                "pct": round(top["ventas"] / max(ventas_brutas, 1) * 100, 1)
            }
            
        productos = data.get("productos", [])
        total_cant = sum(safe_float(p.get("cantidad", 0)) for p in productos)
        top_categories = []
        if total_cant > 0:
            top_categories = [
                {"name": str(p["_id"]), "value": round((safe_float(p.get("cantidad", 0))/total_cant)*100, 1)}
                for p in productos[:5]
            ]
            
        top_productos_rentabilidad = [
            {
                "nombre": str(p["_id"]),
                "ingresos": round(safe_float(p.get("ingresos", 0)), 2),
                "costo_85": round(safe_float(p.get("ingresos", 0)) * 0.85, 2),
                "margen_15": round(safe_float(p.get("ingresos", 0)) * 0.15, 2),
                "cantidad": int(safe_float(p.get("cantidad", 0)))
            }
            for p in productos[:10]
        ]
        
        prev_map = {str(p["_id"]): safe_float(p.get("ingresos", 0)) for p in prev_res}
        max_revenue_curr = safe_float(productos[0]["ingresos"]) if productos else 0.0
        
        bcg_data = { "estrellas": [], "vacas": [], "interrogantes": [], "perros": [] }
        for p in productos:
            p_name = str(p["_id"])
            curr_val = safe_float(p.get("ingresos", 0))
            prev_val = prev_map.get(p_name, 0.0)
            
            if curr_val == 0.0 and prev_val == 0.0: continue
            
            cuota_relativa = (curr_val / max_revenue_curr) if max_revenue_curr > 0 else 0.0
            
            if prev_val == 0.0:
                crecimiento = 1.0 if curr_val > 0 else 0.0
                tend_text = "Subió 100% vs periodo pasado (Top)" if curr_val > 0 else "Estable (Sin histórico)"
                badge_type = "up" if curr_val > 0 else "stable"
            else:
                crecimiento = safe_float((curr_val - prev_val) / prev_val)
                val_pct = round(crecimiento * 100, 1)
                if crecimiento > 0:
                    tend_text = f"Subió {val_pct}% vs periodo anterior"
                    badge_type = "up"
                elif crecimiento < 0:
                    tend_text = f"Bajó {abs(val_pct)}% vs periodo anterior"
                    badge_type = "down"
                else:
                    tend_text = "Se mantuvo estable 0%"
                    badge_type = "stable"
                    
            es_alto_crecimiento = crecimiento >= 0.05
            es_alta_cuota = cuota_relativa >= 0.50
            
            if es_alto_crecimiento and es_alta_cuota: cuadrante = "ESTRELLA"
            elif not es_alto_crecimiento and es_alta_cuota: cuadrante = "VACA"
            elif es_alto_crecimiento and not es_alta_cuota: cuadrante = "INTERROGANTE"
            else: cuadrante = "PERRO"
            
            prod_data = {
                "producto_id": p_name,
                "nombre": p_name,
                "ingresos_actuales": curr_val,
                "ingresos_anteriores": prev_val,
                "crecimiento": crecimiento,
                "cuota_relativa": cuota_relativa,
                "cuadrante": cuadrante,
                "tendencia": tend_text,
                "badge": badge_type,
                "nota": "Sugerencia: Liquidación o descontinuar" if cuadrante == "PERRO" else ""
            }
            
            if cuadrante == "ESTRELLA": bcg_data["estrellas"].append(prod_data)
            elif cuadrante == "VACA": bcg_data["vacas"].append(prod_data)
            elif cuadrante == "INTERROGANTE": bcg_data["interrogantes"].append(prod_data)
            elif cuadrante == "PERRO": bcg_data["perros"].append(prod_data)
            
        bcg_data["estrellas"].sort(key=lambda x: x["cuota_relativa"], reverse=True)
        bcg_data["vacas"].sort(key=lambda x: x["cuota_relativa"], reverse=True)
        bcg_data["interrogantes"].sort(key=lambda x: x["crecimiento"], reverse=True)
        bcg_data["perros"].sort(key=lambda x: x["ingresos_actuales"], reverse=True)
        
        factor_ia = 1.0
        if clima_evento:
            ev = clima_evento.lower()
            if 'lluvia' in ev: factor_ia = 0.85
            elif 'madre' in ev or 'festivo' in ev: factor_ia = 1.20
            
        horas_curr = {str(h["_id"]): safe_float(h.get("monto_total", 0)) for h in data.get("horas", [])}
        horas_yoy = {str(h["_id"]): safe_float(h.get("monto_total", 0)) for h in yoy_res}
        
        distribucion_horaria = []
        for h in range(8, 22):
            h_str = f"{h:02d}:00"
            real_v = horas_curr.get(h_str, 0.0)
            pasado_v = horas_yoy.get(h_str, 0.0)
            distribucion_horaria.append({
                "hora": h_str,
                "real": real_v,
                "pasado": pasado_v,
                "prediccion": pasado_v * factor_ia
            })
            
        # ─── Totales globales (sumados desde las sucursales reales) ───────────
        total_comision = round(sum(d["comision"] for d in desglose_sucursales.values()), 2) if desglose_sucursales else round((ventas_brutas * 0.85) * 0.15, 2)
        total_margen_retail = round(sum(d["margenRetail"] for d in desglose_sucursales.values()), 2) if desglose_sucursales else round(ventas_brutas * 0.15, 2)
        margen_liquido_total = round(total_comision + total_margen_retail, 2)
        pct_margen = round((margen_liquido_total / ventas_brutas) * 100, 1) if ventas_brutas > 0 else 0.0
        costo_total_real = round(ventas_brutas - margen_liquido_total, 2)
        
        result = {
            "overview": {
                "ventas_brutas":        ventas_brutas,
                "costo_insumos":        costo_total_real,
                "margen_liquido":       margen_liquido_total,
                "comision_matriz":      total_comision,
                "margen_retail":        total_margen_retail,
                "total_revenue":        ventas_brutas,
                "p90":                  p90_val,
                "p50":                  p50_val,
                "total_orders":         total_ordenes,
                "active_customers":     clientes_activos,
                "recurrent_customers":  0,
                "average_ticket":       ticket_promedio,
                "ticket_medio":         ticket_promedio,
                "revenue_growth":       pct_margen
            },
            "revenue_trend":              [
                {
                    "name": t.get("name"),
                    "ingresos": safe_float(t.get("ingresos")),
                    "tickets": int(t.get("tickets", 0)),
                    "ticket_promedio": safe_float(t.get("ticket_promedio")),
                    "costo": safe_float(t.get("costo")),
                    "margen": safe_float(t.get("margen"))
                }
                for t in data.get("tendencia", [])
            ],
            "sucursal_top":               sucursal_top,
            "sales_by_branch":            sales_by_branch,
            "desgloseSucursales":         desglose_sucursales,
            "top_categories":             top_categories,
            "top_productos_rentabilidad": top_productos_rentabilidad,
            "distribucion_horaria":       distribucion_horaria,
            "bcg_data":                   bcg_data,
            "recent_activity":            []
        }
        
        if ventas_brutas > 0:
            _dashboard_cache[cache_key] = (time.time(), result)
            
        return result
