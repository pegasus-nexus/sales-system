import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from motor.motor_asyncio import AsyncIOMotorClient

BOLIVIA_TZ = ZoneInfo("America/La_Paz")

async def generate_full_sales_report():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    db = c["salessystem"]
    collection = db["sales"]

    all_docs = await collection.find({}).to_list(length=None)

    # Agrupar ventas por fecha
    daily_sales = {}
    for doc in all_docs:
        fb = doc.get("fecha_bolivia")
        ca = doc.get("created_at")
        doc_date = None
        if fb:
            doc_date = str(fb)
        elif isinstance(ca, str):
            doc_date = ca[:10]
        elif isinstance(ca, datetime):
            doc_date = ca.strftime("%Y-%m-%d")

        if not doc_date:
            continue

        if doc_date not in daily_sales:
            daily_sales[doc_date] = []
        daily_sales[doc_date].append(doc)

    sorted_dates = sorted(daily_sales.keys())

    print("\n=======================================================")
    print("      REPORTE CONSOLIDADO DE DÍAS CON VENTAS REGISTRADAS ")
    print(f"      Total de días registrados: {len(sorted_dates)}")
    print("=======================================================\n")

    days_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    total_acumulado_bs = 0.0
    total_tickets_acum = 0

    print("| Fecha | Día de la Semana | Total Ventas (Bs.) | Tickets | Ticket Promedio (Bs.) |")
    print("|---|---|---|---|---|")

    for d in sorted_dates:
        docs = daily_sales[d]
        total_ingresos = sum(float(s.get("total", 0.0) or s.get("total_neto", 0.0)) for s in docs)
        total_ordenes = len(docs)
        ticket_medio = round(total_ingresos / total_ordenes, 2) if total_ordenes > 0 else 0.0

        dt_obj = datetime.strptime(d, "%Y-%m-%d")
        day_name = days_es[dt_obj.weekday()]

        total_acumulado_bs += total_ingresos
        total_tickets_acum += total_ordenes

        print(f"| {d} | {day_name} | Bs. {total_ingresos:,.2f} | {total_ordenes} | Bs. {ticket_medio:,.2f} |")

    print(f"\n💰 Total Acumulado en el Histórico: Bs. {total_acumulado_bs:,.2f} en {total_tickets_acum} tickets.")

if __name__ == "__main__":
    asyncio.run(generate_full_sales_report())
