# -*- coding: utf-8 -*-
"""
Auditoria end-to-end: MongoDB -> Servicio -> API -> Frontend
Traza cada paso de la cadena de datos para 01/08/2025.

Uso: python -X utf8 scripts/debug/full_chain_audit.py
"""
import asyncio
import sys
from datetime import date, datetime
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"
TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

FECHA_AUDITORIA = date(2025, 8, 1)   # fecha que el backend usa como f1 cuando el usuario pide 01/08/2026
FECHA_AUDITORIA_2024 = date(2024, 8, 1)

def SEP(title=""):
    print("\n" + "=" * 70)
    if title:
        print(title)
        print("=" * 70)


async def paso1_mongodb_raw(db, f_date: date, sucursal_regex: str, label: str):
    """
    PASO 1: Consulta RAW a MongoDB sin ningun pipeline de transformacion.
    Esta es la verdad absoluta de la base de datos.
    """
    SEP(f"PASO 1 — MONGODB RAW: {f_date} | {label}")

    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)

    match = {
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
        "sucursal": {"$regex": sucursal_regex, "$options": "i"},
    }

    docs = await db.ventas_historicas_crudas.find(match).sort("fecha_transaccion", 1).to_list(None)
    total_acumulado = 0.0

    print(f"  Documentos encontrados: {len(docs)}")
    print()
    print(f"  {'#':<4}  {'_id':<26}  {'Hora':<8}  {'Monto':>10}  {'Acumulado':>12}  {'Sucursal':<14}")
    print(f"  {'-'*80}")

    for i, doc in enumerate(docs):
        doc_id = str(doc.get("_id", ""))[:24]
        ft = doc.get("fecha_transaccion")
        hora_str = ft.strftime("%H:%M:%S") if isinstance(ft, datetime) else str(ft)[:8]
        monto = float(doc.get("monto_total_bs", 0) or 0)
        suc = str(doc.get("sucursal", ""))[:14]
        total_acumulado += monto
        # Mostrar solo los primeros 20 y ultimos 5 para no llenar la consola
        if i < 20 or i >= len(docs) - 5:
            print(f"  {i+1:<4}  {doc_id:<26}  {hora_str:<8}  {monto:>10.2f}  {total_acumulado:>12.2f}  {suc:<14}")
        elif i == 20:
            print(f"  ... ({len(docs) - 25} documentos intermedios omitidos) ...")

    print()
    print(f"  TOTAL MONGODB RAW ({label}): {total_acumulado:.2f} Bs")
    return total_acumulado, docs


async def paso2_pipeline_servicio(db, f_date: date, sucursal_regex: str, label: str):
    """
    PASO 2: Exactamente el mismo pipeline que usa el servicio corregido.
    Verificar que devuelve el mismo total que PASO 1.
    """
    SEP(f"PASO 2 — PIPELINE SERVICIO: {f_date} | {label}")

    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)

    match = {
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
        "sucursal": {"$regex": sucursal_regex, "$options": "i"},
    }

    pipeline = [
        {"$match": match},
        {"$project": {
            "monto": {"$toDouble": "$monto_total_bs"},
            "fecha_conv": {
                "$convert": {"input": "$fecha_transaccion", "to": "date", "onError": None, "onNull": None}
            },
        }},
        {"$match": {"fecha_conv": {"$ne": None}, "monto": {"$gt": 0}}},
        {"$project": {
            "monto": 1,
            "hora": {"$hour": "$fecha_conv"},
        }},
        {"$group": {"_id": "$hora", "total": {"$sum": "$monto"}}},
        {"$sort": {"_id": 1}},
    ]

    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)

    print(f"  Resultado por hora del pipeline:")
    print(f"  {'Hora':<8}  {'Total Bs':>12}")
    print(f"  {'-'*24}")

    total_pipeline = 0.0
    hourly_map = {}
    for r in res:
        h = r["_id"]
        t = round(float(r["total"]), 2)
        hourly_map[f"{h:02d}:00"] = t
        total_pipeline += t
        print(f"  {h:02d}:00      {t:>12.2f}")

    total_pipeline = round(total_pipeline, 2)
    print(f"\n  TOTAL PIPELINE SERVICIO ({label}): {total_pipeline:.2f} Bs")
    return total_pipeline, hourly_map


async def paso3_json_enviado_al_frontend(hourly_map: dict, label: str):
    """
    PASO 3: Simular exactamente el JSON que el backend envia al frontend.
    El backend coloca los datos en el esqueleto 06:00-23:00.
    """
    SEP(f"PASO 3 — JSON ENVIADO AL FRONTEND: {label}")

    horas_skeleton = [f"{h:02d}:00" for h in range(6, 24)]
    json_enviado = {h: 0.0 for h in horas_skeleton}

    for hora_str, val in hourly_map.items():
        if hora_str in json_enviado:
            json_enviado[hora_str] = val

    total_json = sum(json_enviado.values())
    horas_no_capturadas = {h: v for h, v in hourly_map.items() if h not in horas_skeleton}

    print(f"  Esqueleto del JSON (06:00-23:00):")
    for h in horas_skeleton:
        v = json_enviado[h]
        bar = "=" * int(v / max(max(json_enviado.values()), 0.01) * 30)
        print(f"  {h}: {v:>10.2f} Bs  {bar}")

    print(f"\n  TOTAL JSON ENVIADO ({label}): {round(total_json, 2):.2f} Bs")

    if horas_no_capturadas:
        print(f"\n  [!] HORAS CON VENTAS FUERA DEL ESQUELETO (NO ENVIADAS):")
        for h, v in sorted(horas_no_capturadas.items()):
            print(f"      {h}: {v:.2f} Bs  <-- PERDIDO")
        print(f"  [!] MONTO PERDIDO: {sum(horas_no_capturadas.values()):.2f} Bs")
    else:
        print(f"  [OK] No se pierden datos fuera del esqueleto.")

    return round(total_json, 2), json_enviado


def paso4_frontend_chartdata(json_enviado: dict, label: str):
    """
    PASO 4: Simular exactamente lo que hace el frontend con el JSON.
    HORAS_OPERACION = ["06:00", "07:00", ... "23:00"]
    totalVendidoAnio1 = chartData.reduce((acc, curr) => acc + (curr.anio1 || 0), 0)
    """
    SEP(f"PASO 4 — FRONTEND chartData.reduce(): {label}")

    # HORAS_OPERACION del frontend (despues del fix)
    HORAS_OPERACION = [f"{h:02d}:00" for h in range(6, 24)]

    total_frontend = 0.0
    print(f"  chartData despues de filtrar por HORAS_OPERACION:")
    print(f"  {'Hora':<8}  {'En JSON':>10}  {'En chartData':>12}")
    print(f"  {'-'*36}")

    for hora in HORAS_OPERACION:
        val = json_enviado.get(hora, 0.0)
        total_frontend += val
        in_chart = val
        print(f"  {hora}:  {val:>10.2f}  {in_chart:>12.2f}")

    total_frontend = round(total_frontend, 2)
    print(f"\n  TOTAL MOSTRADO EN DASHBOARD ({label}): {total_frontend:.2f} Bs")
    return total_frontend


async def resumen_final(db, f_date: date, sucursal_regex: str, label: str):
    """Ejecuta toda la cadena y muestra el resumen comparativo."""
    total_mongo, _ = await paso1_mongodb_raw(db, f_date, sucursal_regex, label)
    total_pipeline, hourly_map = await paso2_pipeline_servicio(db, f_date, sucursal_regex, label)
    total_json, json_enviado = await paso3_json_enviado_al_frontend(hourly_map, label)
    total_frontend = paso4_frontend_chartdata(json_enviado, label)

    SEP(f"RESUMEN FINAL: {f_date} | {label}")
    print(f"  TOTAL MONGODB RAW:           {total_mongo:>12.2f} Bs")
    print(f"  TOTAL PIPELINE SERVICIO:     {total_pipeline:>12.2f} Bs   ", end="")
    print("OK" if abs(total_mongo - total_pipeline) < 0.02 else f"DIFERENCIA: {abs(total_mongo - total_pipeline):.2f}")
    print(f"  TOTAL JSON AL FRONTEND:      {total_json:>12.2f} Bs   ", end="")
    print("OK" if abs(total_mongo - total_json) < 0.02 else f"DIFERENCIA: {abs(total_mongo - total_json):.2f}")
    print(f"  TOTAL MOSTRADO EN DASHBOARD: {total_frontend:>12.2f} Bs   ", end="")
    print("OK" if abs(total_mongo - total_frontend) < 0.02 else f"DIFERENCIA: {abs(total_mongo - total_frontend):.2f}")
    return total_mongo, total_pipeline, total_json, total_frontend


async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # === AUDITORIA: 01/08/2025 por sucursal ===
    SEP("INICIO AUDITORIA COMPLETA END-TO-END")
    print(f"  Fecha de referencia usuario: 01/08/2026")
    print(f"  Fecha f1 (comparacion anio -1): {FECHA_AUDITORIA}")
    print(f"  Fecha f2 (comparacion anio -2): {FECHA_AUDITORIA_2024}")

    configs = [
        ("Hero.*nas|Calacoto|Recoleta", "GLOBAL"),
        ("Hero.*nas", "Heroinas"),
        ("^Recoleta$", "Recoleta"),
        ("^Calacoto$", "Calacoto"),
    ]

    print()
    totals_mongo = {}
    for regex, label in configs:
        t_mongo, t_pipe, t_json, t_dash = await resumen_final(db, FECHA_AUDITORIA, regex, f"2025/{label}")
        totals_mongo[label] = t_mongo

    # Verificar que Heroinas + Recoleta + Calacoto == GLOBAL
    SEP("VERIFICACION: Heroinas + Recoleta + Calacoto == GLOBAL")
    suma_suc = totals_mongo.get("Heroinas", 0) + totals_mongo.get("Recoleta", 0) + totals_mongo.get("Calacoto", 0)
    total_global = totals_mongo.get("GLOBAL", 0)
    print(f"  Heroinas:    {totals_mongo.get('Heroinas', 0):>10.2f}")
    print(f"  Recoleta:    {totals_mongo.get('Recoleta', 0):>10.2f}")
    print(f"  Calacoto:    {totals_mongo.get('Calacoto', 0):>10.2f}")
    print(f"  SUMA:        {suma_suc:>10.2f}")
    print(f"  GLOBAL BD:   {total_global:>10.2f}")
    diff = abs(suma_suc - total_global)
    print(f"  RESULTADO:   {'OK' if diff < 0.02 else f'DIFERENCIA {diff:.2f} Bs'}")

    # Auditoria para 01/08/2024
    SEP("AUDITORIA: 01/08/2024 GLOBAL")
    await resumen_final(db, FECHA_AUDITORIA_2024, "Hero.*nas|Calacoto|Recoleta", "2024/GLOBAL")

    client.close()
    print()
    print("Auditoria completada.")


if __name__ == "__main__":
    asyncio.run(run())
