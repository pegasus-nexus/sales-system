import asyncio
import json
from bson import Decimal128, ObjectId
from app.db import init_db, get_raw_db

def safe_float_audit(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, Decimal128):
        return float(val.to_decimal())
    if hasattr(val, "to_decimal"):
        try:
            return float(val.to_decimal())
        except Exception:
            pass
    try:
        return float(val)
    except Exception:
        return 0.0

def bson_default(obj):
    if isinstance(obj, Decimal128):
        return float(obj.to_decimal())
    if isinstance(obj, ObjectId):
        return str(obj)
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)

async def audit_phase8_discounts_sources():
    await init_db()
    db = await get_raw_db()

    print("=" * 90)
    print("AUDITORÍA DE FUENTES REALES Y ANÁLISIS DE TRAZABILIDAD EN MONGODB — FASE 8")
    print("SECCIÓN BI N.º 8: DESCUENTOS, PROMOCIONES E IMPACTO COMERCIAL")
    print("=" * 90)

    # 1. AUDITORÍA DE LA COLECCIÓN db.descuentos
    total_descuentos_cnt = await db.descuentos.count_documents({})
    descuentos_docs = await db.descuentos.find({}).to_list(length=1000)

    print(f"\n1. RESUMEN DE LA COLECCIÓN db.descuentos ({total_descuentos_cnt} registros):")

    activos_cnt = 0
    inactivos_cnt = 0
    uso_actual_sum = 0
    uso_maximo_sum = 0

    promociones_summary = []

    for d in descuentos_docs:
        d_id = str(d.get("_id"))
        nombre = d.get("nombre", "Sin Nombre")
        tipo = d.get("tipo", "PORCENTAJE")
        valor = safe_float_audit(d.get("valor"))
        is_active = d.get("is_active", True)
        uso_actual = int(d.get("uso_actual") or 0)
        uso_maximo = int(d.get("uso_maximo") or 0)
        f_inicio = str(d.get("fecha_inicio") or "Sin Fecha")
        f_fin = str(d.get("fecha_fin") or "Sin Fecha")

        if is_active:
            activos_cnt += 1
        else:
            inactivos_cnt += 1

        uso_actual_sum += uso_actual
        uso_maximo_sum += uso_maximo

        promociones_summary.append({
            "id": d_id,
            "nombre": nombre,
            "tipo": tipo,
            "valor": valor,
            "is_active": is_active,
            "uso_actual": uso_actual,
            "uso_maximo": uso_maximo,
            "fecha_inicio": f_inicio[:10],
            "fecha_fin": f_fin[:10]
        })

    print(f"   - Promociones Activas (`is_active = true`): {activos_cnt}")
    print(f"   - Promociones Inactivas / Vencidas: {inactivos_cnt}")
    print(f"   - Usos Registrados Acumulados (`SUM(uso_actual)`): {uso_actual_sum} usos")

    print("\n   Detalle de Promociones Configuradas en db.descuentos:")
    print(f"   {'ID':<26} | {'Nombre Promoción':<28} | {'Tipo':<10} | {'Valor':<8} | {'Usos':<10} | {'Estado'}")
    print("   " + "-" * 95)
    for p in promociones_summary[:10]:
        st_str = "ACTIVA" if p["is_active"] else "INACTIVA"
        print(f"   {p['id']:<26} | {p['nombre']:<28} | {p['tipo']:<10} | {p['valor']:<8.2f} | {p['uso_actual']}/{p['uso_maximo'] if p['uso_maximo']>0 else '∞':<6} | {st_str}")

    # 2. AUDITORÍA DE CAMPOS DE DESCUENTO EN VENTAS OPERACIONALES (db.sales)
    print("\n2. AUDITORÍA DE CAMPOS DE DESCUENTO EN VENTAS OPERACIONALES (db.sales):")
    total_sales_cnt = await db.sales.count_documents({})
    sales_with_discount_cnt = await db.sales.count_documents({
        "descuento": {"$exists": True, "$ne": None}
    })

    print(f"   - Total Tickets Registrados en db.sales: {total_sales_cnt} tickets")
    print(f"   - Tickets con Subdocumento 'descuento' Registrado: {sales_with_discount_cnt} tickets")

    # Analizar muestra de tickets con descuento registrado
    sample_disc_sales = await db.sales.find({
        "descuento": {"$exists": True, "$ne": None}
    }).limit(100).to_list(length=100)

    monto_descuento_acumulado = 0.0
    descuentos_por_nombre_map = {}

    for s in sample_disc_sales:
        d_obj = s.get("descuento")
        if isinstance(d_obj, dict):
            d_nombre = d_obj.get("nombre") or "Descuento Sin Nombre"
            d_tipo = d_obj.get("tipo") or "PORCENTAJE"
            d_val = safe_float_audit(d_obj.get("valor"))
            subt = safe_float_audit(s.get("subtotal") or s.get("total"))

            monto_desc = 0.0
            if d_tipo == "MONTO":
                monto_desc = d_val
            elif d_tipo == "PORCENTAJE":
                monto_desc = round(subt * (d_val / 100.0), 2)

            monto_descuento_acumulado += monto_desc

            if d_nombre not in descuentos_por_nombre_map:
                descuentos_por_nombre_map[d_nombre] = {"conteo": 0, "monto_total": 0.0}

            descuentos_por_nombre_map[d_nombre]["conteo"] += 1
            descuentos_por_nombre_map[d_nombre]["monto_total"] += monto_desc

    print(f"\n3. ANÁLISIS DE MUESTRA DE VENTAS CON DESCUENTO APLICADO:")
    print(f"   - Suma de Descuentos Otorgados en Muestra (100 ventas): Bs. {monto_descuento_acumulado:,.2f}")
    print(f"   - Desglose por Nombre de Promoción / Regla:")
    print(f"     {'Nombre Descuento':<35} | {'Tickets':<10} | {'Monto Descuento Tot.':<18}")
    print("     " + "-" * 70)
    for d_name, d_info in descuentos_por_nombre_map.items():
        print(f"     {d_name:<35} | {d_info['conteo']:<10} | Bs. {d_info['monto_total']:>14,.2f}")

    print("\n" + "=" * 90)
    print("FIN DE LA AUDITORÍA FORENSE FASE 8")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(audit_phase8_discounts_sources())
