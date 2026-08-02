from typing import List, Dict, Any, Optional
from datetime import datetime
from app.domain.models.daily_summary import DailySalesSummary
from pydantic import BaseModel

class AggregatedMetrics(BaseModel):
    ventas_brutas: float = 0.0
    costo_total: float = 0.0
    margen: float = 0.0
    cantidad_transacciones: int = 0
    cantidad_clientes: int = 0
    tendencia_diaria: List[Dict[str, Any]] = []
    ventas_por_sucursal: List[Dict[str, Any]] = []
    top_categorias: List[Dict[str, Any]] = []
    top_productos: List[Dict[str, Any]] = []
    por_hora: Dict[str, float] = {}
    tickets_list: List[float] = []

class DailyQueryService:
    @staticmethod
    async def get_aggregated_range(
        tenant_id: str,
        start_date_str: str, # "YYYY-MM-DD"
        end_date_str: str,   # "YYYY-MM-DD"
        sucursal_id: Optional[str] = None
    ) -> AggregatedMetrics:
        """
        Agrega múltiples Snapshots diarios usando PyMongo para máxima velocidad.
        """
        match_filter = {
            "tenant_id": tenant_id,
            "fecha": {"$gte": start_date_str, "$lte": end_date_str}
        }
        if sucursal_id:
            match_filter["sucursal_id"] = sucursal_id

        pipeline = [
            {"$match": match_filter},
            {"$facet": {
                "totals": [
                    {"$group": {
                        "_id": None,
                        "ventas_brutas": {"$sum": {"$toDecimal": "$total_bruto"}},
                        "costo_total": {"$sum": {"$toDecimal": "$costo_total"}},
                        "cantidad_transacciones": {"$sum": "$cantidad_transacciones"},
                        "cantidad_clientes": {"$sum": "$cantidad_clientes"},
                        "tickets_list": {"$push": "$tickets_list"} # We will flatten in python
                    }}
                ],
                "tendencia_diaria": [
                    {"$group": {
                        "_id": "$fecha",
                        "ingresos": {"$sum": {"$toDecimal": "$total_bruto"}},
                        "tickets": {"$sum": "$cantidad_transacciones"}
                    }},
                    {"$sort": {"_id": 1}}
                ],
                "por_sucursal": [
                    {"$group": {
                        "_id": "$sucursal_id",
                        "ventas": {"$sum": {"$toDecimal": "$total_bruto"}},
                        "tickets_cliente": {"$sum": "$cantidad_transacciones"},
                        "margen": {"$sum": {"$toDecimal": "$ganancia_sucursal"}}
                    }}
                ],
                "por_categoria": [
                    {"$unwind": "$por_categoria"},
                    {"$group": {
                        "_id": "$por_categoria.nombre",
                        "cantidad": {"$sum": "$por_categoria.cantidad"},
                        "ventas": {"$sum": {"$toDecimal": "$por_categoria.total_ventas"}}
                    }},
                    {"$sort": {"cantidad": -1}}
                ],
                "por_producto": [
                    {"$unwind": "$top_productos"},
                    {"$group": {
                        "_id": "$top_productos.nombre",
                        "cantidad": {"$sum": "$top_productos.cantidad"},
                        "ventas": {"$sum": {"$toDecimal": "$top_productos.total_ventas"}}
                    }},
                    {"$sort": {"ventas": -1}},
                    {"$limit": 50}
                ],
                "por_hora": [
                    {"$unwind": "$por_hora"},
                    {"$group": {
                        "_id": "$por_hora.hora",
                        "ventas": {"$sum": {"$toDecimal": "$por_hora.total_ventas"}}
                    }}
                ]
            }}
        ]

        cursor = DailySalesSummary.get_pymongo_collection().aggregate(pipeline)
        res = await cursor.to_list(length=1)
        
        metrics = AggregatedMetrics()
        
        if not res:
            return metrics
            
        data = res[0]
        
        if data.get("totals"):
            tot = data["totals"][0]
            metrics.ventas_brutas = float(str(tot.get("ventas_brutas", 0)))
            metrics.costo_total = float(str(tot.get("costo_total", 0)))
            metrics.margen = metrics.ventas_brutas - metrics.costo_total
            metrics.cantidad_transacciones = tot.get("cantidad_transacciones", 0)
            metrics.cantidad_clientes = tot.get("cantidad_clientes", 0)
            
            # Flatten tickets
            flat_tickets = []
            for t_list in tot.get("tickets_list", []):
                flat_tickets.extend(t_list)
            metrics.tickets_list = flat_tickets

        for t in data.get("tendencia_diaria", []):
            metrics.tendencia_diaria.append({
                "fecha": str(t["_id"]),
                "ingresos": float(str(t["ingresos"])),
                "tickets": t["tickets"]
            })
            
        for s in data.get("por_sucursal", []):
            metrics.ventas_por_sucursal.append({
                "sucursal_id": str(s["_id"]),
                "ventas": float(str(s["ventas"])),
                "tickets_cliente": s["tickets_cliente"],
                "margen": float(str(s["margen"]))
            })
            
        for c in data.get("por_categoria", []):
            metrics.top_categorias.append({
                "nombre": str(c["_id"]),
                "cantidad": float(c["cantidad"]),
                "ventas": float(str(c["ventas"]))
            })
            
        for p in data.get("por_producto", []):
            metrics.top_productos.append({
                "nombre": str(p["_id"]),
                "cantidad": float(p["cantidad"]),
                "ventas": float(str(p["ventas"]))
            })
            
        for h in data.get("por_hora", []):
            metrics.por_hora[str(h["_id"])] = float(str(h["ventas"]))
            
        return metrics
