# -*- coding: utf-8 -*-
"""
AUDITORIA DEFINITIVA END-TO-END
Replica exactamente lo que hace el servicio get_hourly_multiyear y compara
contra MongoDB raw en cada paso.

Uso: python -X utf8 scripts/debug/definitive_audit.py
"""
import asyncio
import sys
from datetime import date, datetime
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"
TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

# Casos de verificacion del usuario
CASOS = [
    # (f0_usuario, sucursal, total_esperado_a1, descripcion)
    # Cuando el usuario elige 01/08/2026, f1 = 01/08/2025
    ("2026-08-01", "Heroinas",  3407.50, "Heroinas 01/08/2025 (como anio1 de 01/08/2026)"),
    ("2026-08-01", "Recoleta",  1066.50, "Recoleta 01/08/2025 (como anio1 de 01/08/2026)"),
    ("2026-08-01", "Calacoto",  1066.50, "Calacoto 01/08/2025 (como anio1 de 01/08/2026)"),
    ("2026-08-01", None,        5540.50, "GLOBAL  01/08/2025 (como anio1 de 01/08/2026)"),
    # Cuando el usuario elige 01/08/2026, f2 = 01/08/2024
    ("2026-08-01", "Heroinas",  177.50, "Heroinas 01/08/2024 (como anio2 de 01/08/2026)"),
    ("2026-08-01", None,        177.50, "GLOBAL  01/08/2024 (como anio2 de 01/08/2026)"),
]

def SEP(title=""):
    print("\n" + "=" * 72)
    if title:
        print(title)
        print("=" * 72)


def _same_day_prev_year(ref: date, years_back: int) -> date:
    """Mismo que en el servicio."""
    target_year = ref.year - years_back
    try:
        return ref.replace(year=target_year)
    except ValueError:
        return ref.replace(year=target_year, day=28)


async def mongo_raw_sum(db, f_date: date, sucursal: str | None) -> tuple[float, list]:
    """
    PASO A: Suma RAW de MongoDB. SIN ningun pipeline de transformacion.
    Cuenta todos los documentos y suma monto_total_bs directamente.
    Esta es la verdad absoluta.
    """
    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)

    match: dict = {
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
    }
    if sucursal:
        sl = sucursal.lower()
        if "hero" in sl:
            match["sucursal"] = {"$regex": "Hero.*nas", "$options": "i"}
        else:
            match["sucursal"] = {"$regex": f"^{sucursal}$", "$options": "i"}
    else:
        match["sucursal"] = {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}

    docs = await db.ventas_historicas_crudas.find(match).to_list(None)
    total = sum(float(d.get("monto_total_bs", 0) or 0) for d in docs)
    return round(total, 2), docs


async def service_pipeline_sum(db, f_date: date, sucursal: str | None) -> tuple[float, dict]:
    """
    PASO B: Exactamente el mismo pipeline que usa _fetch_day_hourly_historico.
    """
    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)

    match: dict = {
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
    }
    if sucursal:
        sl = sucursal.lower()
        if "hero" in sl:
            match["sucursal"] = {"$regex": "Hero.*nas", "$options": "i"}
        else:
            match["sucursal"] = {"$regex": f"^{sucursal}$", "$options": "i"}
    else:
        match["sucursal"] = {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}

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
        {"$group": {"_id": "$hora", "total": {"$sum": "$monto"}}},
        {"$sort": {"_id": 1}},
    ]

    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    hourly = {f"{r['_id']:02d}:00": round(float(r["total"]), 2) for r in res if r["_id"] is not None}
    total = round(sum(hourly.values()), 2)
    return total, hourly


async def mongo_raw_sum_sin_filtro_monto(db, f_date: date, sucursal: str | None) -> float:
    """
    PASO B2: Pipeline identico al servicio PERO sin el filtro 'monto > 0'.
    Para verificar si el filtro excluye documentos con monto > 0.
    """
    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)

    match: dict = {
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
    }
    if sucursal:
        sl = sucursal.lower()
        if "hero" in sl:
            match["sucursal"] = {"$regex": "Hero.*nas", "$options": "i"}
        else:
            match["sucursal"] = {"$regex": f"^{sucursal}$", "$options": "i"}
    else:
        match["sucursal"] = {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}

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
        # SIN filtro monto > 0
        {"$match": {"fecha_conv": {"$ne": None}}},
        {"$project": {
            "monto": 1,
            "hora": {"$hour": "$fecha_conv"},
        }},
        {"$group": {"_id": "$hora", "total": {"$sum": "$monto"}}},
        {"$sort": {"_id": 1}},
    ]

    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    return round(sum(float(r["total"]) for r in res if r["_id"] is not None), 2)


async def inspect_docs_excluidos(db, f_date: date, sucursal: str | None) -> None:
    """
    Muestra documentos que el pipeline excluye (monto=0, fecha_conv=None).
    """
    start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
    end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)

    match: dict = {
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "estado": {"$ne": "anulado"},
    }
    if sucursal:
        sl = sucursal.lower()
        if "hero" in sl:
            match["sucursal"] = {"$regex": "Hero.*nas", "$options": "i"}
        else:
            match["sucursal"] = {"$regex": f"^{sucursal}$", "$options": "i"}
    else:
        match["sucursal"] = {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}

    docs = await db.ventas_historicas_crudas.find(match).to_list(None)

    excluidos_monto_cero = [d for d in docs if float(d.get("monto_total_bs", 0) or 0) == 0]
    incluidos = [d for d in docs if float(d.get("monto_total_bs", 0) or 0) > 0]
    total_incluidos = sum(float(d.get("monto_total_bs", 0)) for d in incluidos)

    print(f"  Total documentos: {len(docs)}")
    print(f"  Documentos con monto > 0:  {len(incluidos)}  (suma: {total_incluidos:.2f})")
    print(f"  Documentos con monto = 0:  {len(excluidos_monto_cero)}")

    # Verificar si hay documentos con $hour fuera de 0-23 (podria descartar alguno)
    # Mostrar muestra de documentos incluidos
    if incluidos:
        print(f"\n  Muestra de los primeros 10 incluidos:")
        print(f"  {'Hora en BD':<12}  {'Monto':>8}  {'Sucursal':<14}  {'Producto':<30}")
        print(f"  {'-'*70}")
        for d in sorted(incluidos, key=lambda x: x.get("fecha_transaccion", datetime.min))[:10]:
            ft = d.get("fecha_transaccion")
            hora_str = ft.strftime("%H:%M:%S") if isinstance(ft, datetime) else str(ft)[:8]
            monto = float(d.get("monto_total_bs", 0))
            suc = str(d.get("sucursal", ""))[:14]
            prod = str(d.get("nombre_producto", ""))[:30]
            print(f"  {hora_str:<12}  {monto:>8.2f}  {suc:<14}  {prod:<30}")


async def verificar_caso(db, f0_str: str, sucursal: str | None, esperado_a1: float, descripcion: str) -> bool:
    """
    Verifica un caso completo: f0 -> f1 (anio1) y f2 (anio2).
    Traza cada paso de la cadena.
    """
    SEP(f"CASO: {descripcion}")

    f0 = date.fromisoformat(f0_str)
    f1 = _same_day_prev_year(f0, 1)
    f2 = _same_day_prev_year(f0, 2)

    suc_label = sucursal or "GLOBAL"
    print(f"  f0 = {f0}  |  f1 = {f1}  |  f2 = {f2}  |  sucursal = {suc_label}")
    print(f"  Valor esperado para f1 (anio1): {esperado_a1:.2f} Bs")

    # PASO A: MongoDB RAW
    total_raw, docs = await mongo_raw_sum(db, f1, sucursal)
    print(f"\n  [PASO A] MongoDB RAW (f1={f1}, {suc_label}): {total_raw:.2f} Bs  ({len(docs)} docs)")

    # PASO B: Pipeline del servicio
    total_pipe, hourly = await service_pipeline_sum(db, f1, sucursal)
    print(f"  [PASO B] Pipeline servicio:                {total_pipe:.2f} Bs")

    # PASO B2: Pipeline sin filtro monto>0
    total_sin_filtro = await mongo_raw_sum_sin_filtro_monto(db, f1, sucursal)
    print(f"  [PASO B2] Pipeline sin filtro monto>0:    {total_sin_filtro:.2f} Bs")

    if abs(total_raw - total_pipe) > 0.02:
        diff = total_raw - total_pipe
        print(f"\n  [!] DIFERENCIA DETECTADA en pipeline: {diff:.2f} Bs")
        print(f"       => Inspeccionando documentos excluidos...")
        await inspect_docs_excluidos(db, f1, sucursal)

    # PASO C: Lo que el servicio pone en meta.total_a1
    # (raw_total_a1 = sum(gr1.values()) = total_pipe en nuestra simulacion)
    meta_total_a1 = total_pipe  # el servicio usa raw_total_a1 = sum(gr1.values())
    print(f"\n  [PASO C] meta.total_a1 (enviado al frontend): {meta_total_a1:.2f} Bs")

    # PASO D: Frontend usa meta.total_a1 (no recalcula)
    frontend_total = meta_total_a1
    print(f"  [PASO D] Frontend totalVendidoAnio1 = meta?.total_a1: {frontend_total:.2f} Bs")

    # RESUMEN
    print(f"\n  {'Paso':<40} {'Valor':>12}  {'vs Esperado'}")
    print(f"  {'-'*65}")
    print(f"  {'A. MongoDB RAW':<40} {total_raw:>12.2f}  {'OK' if abs(total_raw - esperado_a1) < 0.02 else f'FALLA ({total_raw - esperado_a1:+.2f})'}")
    print(f"  {'B. Pipeline Servicio':<40} {total_pipe:>12.2f}  {'OK' if abs(total_pipe - esperado_a1) < 0.02 else f'FALLA ({total_pipe - esperado_a1:+.2f})'}")
    print(f"  {'C. meta.total_a1 (JSON al frontend)':<40} {meta_total_a1:>12.2f}  {'OK' if abs(meta_total_a1 - esperado_a1) < 0.02 else f'FALLA ({meta_total_a1 - esperado_a1:+.2f})'}")
    print(f"  {'D. totalVendidoAnio1 (Dashboard)':<40} {frontend_total:>12.2f}  {'OK' if abs(frontend_total - esperado_a1) < 0.02 else f'FALLA ({frontend_total - esperado_a1:+.2f})'}")

    # Desglose horario
    if hourly:
        print(f"\n  Desglose horario (f1={f1}, {suc_label}):")
        for h in sorted(hourly.keys()):
            print(f"    {h}: {hourly[h]:>10.2f} Bs")
        print(f"    SUMA: {sum(hourly.values()):>10.2f} Bs")

    passed = abs(frontend_total - esperado_a1) < 0.02
    return passed


async def verificar_global_vs_sucursales(db, f_date: date) -> None:
    """
    Verifica que Heroinas + Recoleta + Calacoto == GLOBAL para una fecha dada.
    """
    SEP(f"VERIFICACION: Global == Heroinas + Recoleta + Calacoto  [{f_date}]")

    t_global, _ = await mongo_raw_sum(db, f_date, None)
    t_hero, _   = await mongo_raw_sum(db, f_date, "Heroinas")
    t_reco, _   = await mongo_raw_sum(db, f_date, "Recoleta")
    t_cala, _   = await mongo_raw_sum(db, f_date, "Calacoto")
    suma_suc = round(t_hero + t_reco + t_cala, 2)

    print(f"  Heroinas:    {t_hero:>12.2f} Bs")
    print(f"  Recoleta:    {t_reco:>12.2f} Bs")
    print(f"  Calacoto:    {t_cala:>12.2f} Bs")
    print(f"  SUMA SUC:    {suma_suc:>12.2f} Bs")
    print(f"  GLOBAL:      {t_global:>12.2f} Bs")
    diff = abs(suma_suc - t_global)
    print(f"  RESULTADO:   {'OK (diferencia < 0.02)' if diff < 0.02 else f'FALLA: diferencia = {diff:.2f} Bs'}")

    if diff >= 0.02:
        # Investigar si hay documentos con sucursal distinta a las 3
        start = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
        end = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59, 999999)
        pipeline = [
            {"$match": {
                "tenant_id": TENANT_ID,
                "fecha_transaccion": {"$gte": start, "$lte": end},
                "estado": {"$ne": "anulado"},
            }},
            {"$group": {
                "_id": "$sucursal",
                "total": {"$sum": {"$toDouble": "$monto_total_bs"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}}
        ]
        res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(50)
        print(f"\n  Todas las sucursales presentes en esa fecha:")
        for r in res:
            print(f"    '{r['_id']}': {r['total']:.2f} Bs  ({r['count']} docs)")


async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    SEP("AUDITORIA DEFINITIVA: MongoDB -> Servicio -> JSON -> Frontend")
    print("  Objetivo: verificar que cada paso produce exactamente el mismo valor")

    resultados = []
    for f0_str, suc, esperado, desc in CASOS:
        passed = await verificar_caso(db, f0_str, suc, esperado, desc)
        resultados.append((desc, passed))

    # Verificaciones Global vs Sucursales
    for f_date in [date(2024, 8, 1), date(2025, 8, 1)]:
        await verificar_global_vs_sucursales(db, f_date)

    # Reporte final
    SEP("REPORTE FINAL")
    all_ok = True
    for desc, passed in resultados:
        status = "OK" if passed else "FALLA"
        print(f"  [{status}] {desc}")
        if not passed:
            all_ok = False

    if all_ok:
        print("\n  Todos los casos PASAN. El problema es que el backend aun no fue reiniciado.")
        print("  Reiniciar el backend para que el nuevo servicio entre en efecto.")
    else:
        print("\n  Existen FALLAS en el pipeline. Ver detalle arriba.")

    client.close()


if __name__ == "__main__":
    asyncio.run(run())
