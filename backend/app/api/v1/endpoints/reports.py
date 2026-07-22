from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from decimal import Decimal
from app.infrastructure.auth import get_current_active_user, require_roles
from app.domain.models.user import User, UserRole
from app.domain.models.sale_item import SaleItem
from app.domain.models.sucursal import Sucursal
from app.domain.models.sale import Sale
from app.domain.models.caja import CajaMovimiento, SubtipoMovimiento, CajaGastoCategoria
from app.domain.models.inventario import Inventario
from app.domain.models.product import Product
from app.domain.models.category import Category
from app.utils.serializers import normalize_bson
from datetime import datetime, timedelta, time, timezone
from app.utils.date_utils import BOLIVIA_TZ, get_day_range_bolivia, get_range_bolivia


_ZERO = Decimal("0")  # Constante DRY para el valor cero monetario

router = APIRouter()

@router.get("/general")
async def get_general_reports(
    days: int = 30,
    sucursal_id: Optional[str] = "all",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
) -> Dict[str, Any]:
    """
    Returns general analytics data (KPIs, sales by branch, top products, daily evolution)
    Only accessible by MATRIZ admins. Over the last `days` days.
    """
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores generales pueden ver los reportes.")
        
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    # 00:00:00 of X days ago in Bolivia time, converted to UTC
    now_bo = datetime.now(BOLIVIA_TZ)
    start_bo = (now_bo - timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = start_bo.astimezone(timezone.utc) # UTC

    
    # ─── 1. KPIs Generales ────────────────────────────────────────────────────────
    # Según CSV estimado: Fábrica = ~72%, Distribuidor = ~85% del PVP final
    kpis_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
                "anulada": False,
                "created_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_ventas": {"$sum": "$total"},
                "total_productos": {
                    "$sum": {
                        "$reduce": {
                            "input": "$items",
                            "initialValue": 0,
                            "in": {"$add": ["$$value", "$$this.cantidad"]}
                        }
                    }
                },
                "costo_total": {
                    "$sum": {
                        "$reduce": {
                            "input": "$items",
                            "initialValue": 0,
                            "in": {"$add": ["$$value", {"$multiply": ["$$this.costo_unitario", "$$this.cantidad"]}]}
                        }
                    }
                },
                "ganancia_matriz": {
                    "$sum": {
                        "$reduce": {
                            "input": "$items",
                            "initialValue": 0,
                            "in": {"$add": ["$$value", {"$multiply": ["$$this.costo_unitario", "$$this.cantidad", 0.15]}]}
                        }
                    }
                }
            }
        },
        {
            "$project": {
                "total_ventas": 1,
                "total_productos": 1,
                "ganancia_matriz": 1,
                # Ganancia Sucursal = (Precio de Venta Total) - (Costo Unitario * Cantidad)
                "ganancia_sucursal": {"$subtract": ["$total_ventas", "$costo_total"]}
            }
        }
    ]
    
    cursor = Sale.get_pymongo_collection().aggregate(kpis_pipeline)
    kpis_cursor = await cursor.to_list(length=1)
    kpis = normalize_bson(kpis_cursor[0]) if kpis_cursor else {
        "total_ventas": 0, "total_productos": 0, "ganancia_matriz": 0, "ganancia_sucursal": 0
    }
    if "_id" in kpis:
        del kpis["_id"]
        
    # ─── 2. Ventas por Sucursal ───────────────────────────────────────────────────
    sucursal_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
                "anulada": False,
                "created_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": "$sucursal_id",
                "total_ventas": {"$sum": "$total"},
                "costo_total": {
                    "$sum": {
                        "$reduce": {
                            "input": "$items",
                            "initialValue": 0,
                            "in": {"$add": ["$$value", {"$multiply": ["$$this.costo_unitario", "$$this.cantidad"]}]}
                        }
                    }
                },
                "ganancia_matriz": {
                    "$sum": {
                        "$reduce": {
                            "input": "$items",
                            "initialValue": 0,
                            "in": {"$add": ["$$value", {"$multiply": ["$$this.costo_unitario", "$$this.cantidad", 0.15]}]}
                        }
                    }
                }
            }
        },
        {
            "$project": {
                "sucursal_id_raw": "$_id",
                "total_ventas": 1,
                "ganancia_matriz": 1,
                "ganancia_sucursal": {"$subtract": ["$total_ventas", "$costo_total"]},
                "_id": 0
            }
        },
        {"$sort": {"total_ventas": -1}}
    ]
    cursor = Sale.get_pymongo_collection().aggregate(sucursal_pipeline)
    ventas_por_sucursal_raw = await cursor.to_list(length=100)
    ventas_por_sucursal_raw = [normalize_bson(r) for r in ventas_por_sucursal_raw]
    
    # Resolver nombres en Python usando el modelo Sucursal (no Tenant)
    todas_sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
    map_sucursales = {str(s.id): s.nombre for s in todas_sucursales}
    
    ventas_por_sucursal = []
    for reg in ventas_por_sucursal_raw:
        sid = reg.get("sucursal_id_raw")
        reg["sucursal"] = map_sucursales.get(str(sid), str(sid))
        
        # Opcional, limpiar
        if "sucursal_id_raw" in reg:
            del reg["sucursal_id_raw"]
            
        ventas_por_sucursal.append(reg)
    
    # ─── 3. Top Productos Mas Vendidos ────────────────────────────────────────────
    top_products_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
                "sale_date": {"$gte": start_date}
            }
        },
        {
            "$lookup": {
                "from": "sales",
                "let": {"sid": "$sale_id"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$sid"]}, "anulada": False}}
                ],
                "as": "sale_parent"
            }
        },
        {"$match": {"sale_parent": {"$ne": []}}},
        {
            "$group": {
                "_id": "$descripcion",
                "cantidad_vendida": {"$sum": "$cantidad"},
                "total_ventas": {"$sum": "$subtotal"},
                "costo_total": {"$sum": {"$multiply": ["$costo_unitario", "$cantidad"]}},
                "ganancia_matriz": {"$sum": {"$multiply": ["$costo_unitario", "$cantidad", 0.15]}}
            }
        },
        {
            "$project": {
                "producto": "$_id",
                "cantidad_vendida": 1,
                "total_ventas": 1,
                "ganancia_matriz": 1,
                "ganancia_sucursal": {"$subtract": ["$total_ventas", "$costo_total"]},
                "_id": 0
            }
        },
        {"$sort": {"cantidad_vendida": -1}},
        {"$limit": 10}
    ]
    cursor = SaleItem.get_pymongo_collection().aggregate(top_products_pipeline)
    top_productos = [normalize_bson(r) for r in await cursor.to_list(length=10)]
    
    # ─── 4. Evolucion Diaria ──────────────────────────────────────────────────────
    diaria_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
                "sale_date": {"$gte": start_date}
            }
        },
        {
            "$lookup": {
                "from": "sales",
                "let": {"sid": "$sale_id"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$sid"]}, "anulada": False}}
                ],
                "as": "sale_parent"
            }
        },
        {"$match": {"sale_parent": {"$ne": []}}},
        {
            "$group": {
                "_id": { "$dateToString": { "format": "%Y-%m-%d", "date": "$sale_date", "timezone": "-04:00" } },
                "total_ventas": {"$sum": "$subtotal"},
                "costo_total": {"$sum": {"$multiply": ["$costo_unitario", "$cantidad"]}},
                "ganancia_matriz": {"$sum": {"$multiply": ["$costo_unitario", "$cantidad", 0.15]}}
            }
        },
        {
            "$project": {
                "fecha": "$_id",
                "total_ventas": 1,
                "ganancia_matriz": 1,
                "ganancia_sucursal": {"$subtract": ["$total_ventas", "$costo_total"]},
                "_id": 0
            }
        },
        {"$sort": {"fecha": 1}}
    ]
    cursor = SaleItem.get_pymongo_collection().aggregate(diaria_pipeline)
    evolucion_diaria = [normalize_bson(r) for r in await cursor.to_list(length=100)]
    
    return {
        "kpis": kpis,
        "por_sucursal": ventas_por_sucursal,
        "top_productos": top_productos,
        "evolucion_diaria": evolucion_diaria
    }

@router.get("/daily-report")
async def get_daily_report(
    date: str, # YYYY-MM-DD
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns a detailed daily report for a specific branch.
    Accessible by Matriz admins (for any branch) or Branch admins (only for their branch).
    """
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    # Permission check
    target_sucursal = sucursal_id
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        target_sucursal = current_user.sucursal_id
    elif not target_sucursal:
         # For general admins, if no sucursal is provided, they might want a global daily report or it might be an error.
         # Let's assume they MUST provide one or we take a default one like "CENTRAL".
         target_sucursal = "CENTRAL"

    try:
        start_dt, end_dt = get_day_range_bolivia(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")


    # 1. Sales summary (Pagos)
    sales = await Sale.find(
        Sale.tenant_id == tenant_id,
        Sale.sucursal_id == target_sucursal,
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt
    ).to_list()

    ventas_por_metodo: Dict[str, Decimal] = {
        "EFECTIVO": _ZERO, "QR": _ZERO, "TARJETA": _ZERO, "TRANSFERENCIA": _ZERO
    }
    total_ventas    = _ZERO
    total_descuentos = _ZERO
    total_creditos   = _ZERO
    anuladas_count  = 0
    anuladas_monto  = _ZERO
    
    for s in sales:
        if s.anulada:
            anuladas_count += 1
            anuladas_monto += s.total
            continue
            
        total_ventas += s.total
        total_descuentos += s.get_total_descuento()

        if s.estado_pago in ["PENDIENTE", "PARCIAL"]:
            pagado = sum((p.monto for p in s.pagos), _ZERO)
            credito_otorgado = s.total - pagado
            total_creditos += credito_otorgado
            
        for p in s.pagos:
            metodo = p.metodo.upper()
            ventas_por_metodo[metodo] = ventas_por_metodo.get(metodo, _ZERO) + p.monto

    # 2. Expenses (Gastos) from CajaMovimiento
    movimientos = await CajaMovimiento.find(
        CajaMovimiento.tenant_id == tenant_id,
        CajaMovimiento.sucursal_id == target_sucursal,
        CajaMovimiento.fecha >= start_dt,
        CajaMovimiento.fecha <= end_dt
    ).to_list()

    total_gastos = _ZERO
    total_cambio = _ZERO
    gastos_list = []
    
    for m in movimientos:
        if m.tipo == "EGRESO":
            if m.subtipo == SubtipoMovimiento.GASTO:
                total_gastos += m.monto
                gastos_list.append({
                    "descripcion": m.descripcion,
                    "monto": float(m.monto),
                    "cajero": m.cajero_name,
                    "hora": m.fecha.strftime("%H:%M")
                })
            elif m.subtipo == SubtipoMovimiento.CAMBIO:
                total_cambio += m.monto

    # Ajustar el total en efectivo restando los cambios entregados (vueltos)
    ventas_por_metodo["EFECTIVO"] = max(_ZERO, ventas_por_metodo.get("EFECTIVO", _ZERO) - total_cambio)

    # 3. Simple inventory items sold count
    items_vendidos_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
                "sucursal_id": target_sucursal,
                "sale_date": {"$gte": start_dt, "$lte": end_dt}
            }
        },
        {
            "$lookup": {
                "from": "sales",
                "let": {"sid": "$sale_id"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$sid"]}, "anulada": False}}
                ],
                "as": "sale_parent"
            }
        },
        {"$match": {"sale_parent": {"$ne": []}}},
        {
            "$group": {
                "_id": "$descripcion",
                "cantidad": {"$sum": "$cantidad"},
                "subtotal": {"$sum": "$subtotal"}
            }
        },
        {"$sort": {"cantidad": -1}}
    ]
    cursor = SaleItem.get_pymongo_collection().aggregate(items_vendidos_pipeline)
    items_summary = await cursor.to_list(length=100)
    items_list = [
        {
            "producto": i["_id"],
            "cantidad": i["cantidad"],
            "total": float(i["subtotal"].to_decimal()) if type(i["subtotal"]).__name__ == "Decimal128" else float(i["subtotal"])
        }
        for i in items_summary
    ]

    return {
        "fecha": date,
        "sucursal_id": target_sucursal,
        "resumen_ventas": {
            "total_bruto":      float(total_ventas),
            "total_descuentos": float(total_descuentos),
            "total_cambio":     float(total_cambio),
            "total_creditos":   float(total_creditos),
            "por_metodo":       {k: float(v) for k, v in ventas_por_metodo.items()},
            "anuladas": {
                "cantidad": anuladas_count,
                "monto":    float(anuladas_monto)
            }
        },
        "gastos": {
            "total":   float(total_gastos),
            "detalle": gastos_list
        },
        "items_vendidos": items_list,
        "balance_neto": float(ventas_por_metodo.get("EFECTIVO", _ZERO) - total_gastos)
    }

@router.get("/financial-report")
async def get_financial_report(
    start_date: str, # YYYY-MM-DD
    end_date: str,   # YYYY-MM-DD
    sucursal_id: Optional[str] = "all", 
    category: Optional[str] = None,
    proveedor: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns a financial detail report for General Admins.
    Shows Público, Fábrica, Margen 15%, Margen Retail and Margen Total.
    Supports optional category and proveedor filters.
    """
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores generales pueden ver este reporte.")
        
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    try:
        start_dt, _ = get_day_range_bolivia(start_date)
        _, end_dt = get_day_range_bolivia(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    match_filter = {
        "tenant_id": tenant_id,
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }
    
    if sucursal_id and sucursal_id != "all":
        match_filter["sucursal_id"] = sucursal_id

    matching_ids = []
    matching_names = []
    if category or proveedor:
        prod_query: dict = {"tenant_id": tenant_id, "is_active": True}
        if category:
            cat_docs = await Category.find({"$or": [{"name": category}, {"nombre": category}]}).to_list()
            cat_ids = [str(c.id) for c in cat_docs]
            prod_query["$or"] = [
                {"categoria_nombre": category},
                {"categoria": category},
                {"categoria_id": {"$in": cat_ids}}
            ]
        if proveedor:
            prov_conditions = [
                {"proveedor_nombre": proveedor},
                {"proveedor": proveedor}
            ]
            if "$or" in prod_query:
                prod_query["$and"] = [{"$or": prod_query.pop("$or")}, {"$or": prov_conditions}]
            else:
                prod_query["$or"] = prov_conditions

        matching_products = await Product.find(prod_query).to_list()
        matching_ids = [str(p.id) for p in matching_products]
        matching_names = [p.descripcion for p in matching_products if p.descripcion]

        if not matching_ids and not matching_names:
            return []

        match_filter["$or"] = [
            {"items.producto_id": {"$in": matching_ids}},
            {"items.nombre": {"$in": matching_names}}
        ]

    filtered_items_expr = {
        "$filter": {
            "input": "$items",
            "as": "item",
            "cond": {
                "$or": [
                    {"$in": ["$$item.producto_id", matching_ids]},
                    {"$in": ["$$item.nombre", matching_names]}
                ]
            }
        }
    } if (category or proveedor) else "$items"

    pipeline = [
        {"$match": match_filter},
        {
            "$group": {
                "_id": {
                    "fecha": { "$dateToString": { "format": "%Y-%m-%d", "date": "$created_at", "timezone": "-04:00" } },
                    "sucursal_id": "$sucursal_id"
                },

                "total_publico": {
                    "$sum": {
                        "$reduce": {
                            "input": filtered_items_expr,
                            "initialValue": 0,
                            "in": {"$add": ["$$value", {"$multiply": [{"$ifNull": ["$$this.precio_unitario", 0]}, {"$ifNull": ["$$this.cantidad", 0]}]}]}
                        }
                    }
                },
                "total_fabrica": {
                    "$sum": {
                        "$reduce": {
                            "input": filtered_items_expr,
                            "initialValue": 0,
                            "in": {"$add": ["$$value", {"$multiply": [{"$ifNull": ["$$this.costo_unitario", 0]}, {"$ifNull": ["$$this.cantidad", 0]}]}]}
                        }
                    }
                },
            }
        },
        {
            "$project": {
                "fecha": "$_id.fecha",
                "sucursal_id": "$_id.sucursal_id",
                "total_publico": 1,
                "total_fabrica": 1,
                "margen_distribuidor": {"$multiply": ["$total_fabrica", 0.15]},
                "margen_retail": {"$subtract": ["$total_publico", "$total_fabrica"]},
                "_id": 0
            }
        },
        {
            "$project": {
                "fecha": 1,
                "sucursal_id": 1,
                "total_publico": 1,
                "total_fabrica": 1,
                "margen_distribuidor": 1,
                "margen_retail": 1,
                "margen_total": {"$add": ["$margen_distribuidor", "$margen_retail"]}
            }
        },
        {"$sort": {"fecha": 1, "sucursal_id": 1}}
    ]
    cursor = Sale.get_pymongo_collection().aggregate(pipeline)
    results = [normalize_bson(r) for r in await cursor.to_list(length=2000)]

    # Resolve sucursal names
    todas_sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
    map_sucursales = {str(s.id): s.nombre for s in todas_sucursales}
    
    for r in results:
        r["sucursal_nombre"] = map_sucursales.get(r["sucursal_id"], r["sucursal_id"])

    return results

from app.domain.models.inventario import Inventario, InventoryLog

@router.get("/anulaciones")
async def get_anulaciones_report(
    start_date: str, # YYYY-MM-DD
    end_date: str,   # YYYY-MM-DD
    sucursal_id: Optional[str] = "all",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns a detailed report of all cancelled (anulada) sales.
    """
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    target_sucursal = sucursal_id
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        target_sucursal = current_user.sucursal_id

    try:
        start_dt, _ = get_day_range_bolivia(start_date)
        _, end_dt = get_day_range_bolivia(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    match_filter = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "anulada": True,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }
    
    if target_sucursal and target_sucursal != "all":
        match_filter["sucursal_id"] = target_sucursal

    pipeline = [
        {"$match": match_filter},
        {"$sort": {"created_at": -1}}
    ]

    cursor = Sale.get_pymongo_collection().aggregate(pipeline)
    raw_results = await cursor.to_list(length=2000)
    
    # Resolve sucursal names
    todas_sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
    map_sucursales = {str(s.id): s.nombre for s in todas_sucursales}
    map_sucursales["CENTRAL"] = "Almacén Central (Matriz)"

    results = []
    for r in raw_results:
        norm = normalize_bson(r)
        sid = norm.get("sucursal_id")
        
        results.append({
            "_id": norm["_id"],
            "created_at": norm["created_at"],
            "total": float(str(norm.get("total", 0))),
            "sucursal_nombre": map_sucursales.get(str(sid), str(sid)),
            "cashier_name": norm.get("cashier_name", "Desconocido"),
            "anulada_por_nombre": norm.get("anulada_por_nombre", "N/A"),
            "motivo_anulacion": norm.get("motivo_anulacion", "Sin motivo especificado"),
            "notas_anulacion": norm.get("notas_anulacion", ""),
            "cliente": norm.get("cliente", {})
        })

    return results

@router.get("/valued-inventory")
async def get_valued_inventory(
    date: Optional[str] = None, # YYYY-MM-DD
    sucursal_id: Optional[str] = "all",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns the total value of inventory (cantidad * costo_producto)
    grouped by branch, plus a detailed breakdown.
    If 'date' is provided, it reconstructs the stock using historical logs.
    """
    tenant_id = current_user.tenant_id or ""
    
    match_filter = {"tenant_id": tenant_id}
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        match_filter["sucursal_id"] = current_user.sucursal_id
    elif sucursal_id and sucursal_id != "all":
        match_filter["sucursal_id"] = sucursal_id

    if date:
        # ─── HISTORICAL MODE (Using InventoryLogs) ──────────────────────────
        try:
            _, end_dt = get_day_range_bolivia(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

        # Historical match filter
        hist_match = {"tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}), "created_at": {"$lte": end_dt}}
        if "sucursal_id" in match_filter:
            hist_match["sucursal_id"] = match_filter["sucursal_id"]

        pipeline = [
            {"$match": hist_match},
            {"$sort": {"created_at": -1}},
            {
                "$group": {
                    "_id": {
                        "sucursal_id": "$sucursal_id",
                        "producto_id": "$producto_id"
                    },
                    "last_log": {"$first": "$$ROOT"}
                }
            },
            {
                "$project": {
                    "sucursal_id": "$_id.sucursal_id",
                    "producto_id": "$_id.producto_id",
                    "cantidad": "$last_log.stock_resultante",
                    "producto_nombre": "$last_log.descripcion",
                    "costo_producto": {"$ifNull": ["$last_log.costo_unitario_momento", 0]},
                    "precio_venta": {"$ifNull": ["$last_log.precio_venta_momento", 0]},
                    "valor_fabrica": {
                        "$multiply": ["$last_log.stock_resultante", {"$ifNull": ["$last_log.costo_unitario_momento", 0]}]
                    },
                    "valor_publico": {
                        "$multiply": ["$last_log.stock_resultante", {"$ifNull": ["$last_log.precio_venta_momento", 0]}]
                    }
                }
            },
            # Skip items with 0 stock to keep report clean
            {"$match": {"cantidad": {"$gt": 0}}},
            {
                "$lookup": {
                    "from": "products",
                    "let": {"pid": "$producto_id"},
                    "pipeline": [
                        {"$match": {
                            "$expr": {"$eq": [{"$toString": "$_id"}, "$$pid"]}
                        }}
                    ],
                    "as": "product_info"
                }
            },
            {"$unwind": { "path": "$product_info", "preserveNullAndEmptyArrays": True }},
            {
                "$lookup": {
                    "from": "categories",
                    "let": {"cid": "$product_info.categoria_id"},
                    "pipeline": [
                        {"$match": {
                            "$expr": {"$eq": [{"$toString": "$_id"}, "$$cid"]}
                        }}
                    ],
                    "as": "category_info"
                }
            },
            {"$unwind": { "path": "$category_info", "preserveNullAndEmptyArrays": True }},
            {
                "$addFields": {
                    "producto_nombre": {
                        "$cond": [
                            {"$and": [{"$ne": ["$producto_nombre", ""]}, {"$ne": ["$producto_nombre", None]}]},
                            "$producto_nombre",
                            {"$ifNull": ["$product_info.descripcion", "Producto Desconocido"]}
                        ]
                    },
                    "categoria_nombre": {"$ifNull": ["$category_info.nombre", "Sin Categoría"]}
                }
            },
            {
                "$group": {
                    "_id": "$sucursal_id",
                    "total_items": {"$sum": "$cantidad"},
                    "valor_total_fabrica_sucursal": {"$sum": "$valor_fabrica"},
                    "valor_total_publico_sucursal": {"$sum": "$valor_publico"},
                    "desglose": {
                        "$push": {
                            "producto_id": "$producto_id",
                            "producto_nombre": "$producto_nombre",
                            "categoria_nombre": "$categoria_nombre",
                            "cantidad": "$cantidad",
                            "costo_unitario": "$costo_producto",
                            "precio_publico_unitario": "$precio_venta",
                            "valor_fabrica": "$valor_fabrica",
                            "valor_publico": "$valor_publico"
                        }
                    }
                }
            },
            {"$sort": {"valor_total_fabrica_sucursal": -1}}
        ]
        cursor = InventoryLog.get_pymongo_collection().aggregate(pipeline)
    else:
        # ─── REAL-TIME MODE (Current Stock) ──────────────────────────────────
        pipeline = [
            {"$match": match_filter},
            {
                "$lookup": {
                    "from": Product.get_collection_name(),
                    "let": {"pid": "$producto_id"},
                    "pipeline": [
                        {"$match": {
                            "$expr": {"$eq": [{"$toString": "$_id"}, "$$pid"]}
                        }}
                    ],
                    "as": "product_info"
                }
            },
            {"$unwind": { "path": "$product_info", "preserveNullAndEmptyArrays": True }},
            {
                "$lookup": {
                    "from": "categories",
                    "let": {"cid": "$product_info.categoria_id"},
                    "pipeline": [
                        {"$match": {
                            "$expr": {"$eq": [{"$toString": "$_id"}, "$$cid"]}
                        }}
                    ],
                    "as": "category_info"
                }
            },
            {"$unwind": { "path": "$category_info", "preserveNullAndEmptyArrays": True }},
            {
                "$project": {
                    "sucursal_id": 1,
                    "producto_id": 1,
                    "cantidad": 1,
                    "producto_nombre": {"$ifNull": ["$product_info.descripcion", "Producto Desconocido"]},
                    "categoria_nombre": {"$ifNull": ["$category_info.nombre", "Sin Categoría"]},
                    "costo_producto": {"$ifNull": ["$product_info.costo_producto", 0]},
                    "precio_venta": {
                        "$ifNull": [
                            "$precio_sucursal", 
                            {"$ifNull": ["$product_info.precio_venta", 0]}
                        ]
                    },
                    "valor_fabrica": {
                        "$multiply": ["$cantidad", {"$ifNull": ["$product_info.costo_producto", 0]}]
                    },
                    "valor_publico": {
                        "$multiply": [
                            "$cantidad", 
                            {
                                "$ifNull": [
                                    "$precio_sucursal", 
                                    {"$ifNull": ["$product_info.precio_venta", 0]}
                                ]
                            }
                        ]
                    }
                }
            },
            {"$group": {
                "_id": "$sucursal_id",
                "total_items": {"$sum": "$cantidad"},
                "valor_total_fabrica_sucursal": {"$sum": "$valor_fabrica"},
                "valor_total_publico_sucursal": {"$sum": "$valor_publico"},
                "desglose": {
                    "$push": {
                        "producto_id": "$producto_id",
                        "producto_nombre": "$producto_nombre",
                        "categoria_nombre": "$categoria_nombre",
                        "cantidad": "$cantidad",
                        "costo_unitario": "$costo_producto",
                        "precio_publico_unitario": "$precio_venta",
                        "valor_fabrica": "$valor_fabrica",
                        "valor_publico": "$valor_publico"
                    }
                }
            }},
            {"$sort": {"valor_total_fabrica_sucursal": -1}}
        ]
        cursor = Inventario.get_pymongo_collection().aggregate(pipeline)

    raw_results = await cursor.to_list(length=100)
    
    # Resolve sucursal names
    todas_sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
    map_sucursales = {str(s.id): s.nombre for s in todas_sucursales}
    map_sucursales["CENTRAL"] = "Almacén Central (Matriz)"

    results = []
    total_general_fabrica = Decimal("0")
    total_general_publico = Decimal("0")

    for r in raw_results:
        norm = normalize_bson(r)
        sid = norm.get("_id")
        norm["sucursal_id"] = sid
        norm["sucursal_nombre"] = map_sucursales.get(str(sid), str(sid))
        total_general_fabrica += Decimal(str(norm.get("valor_total_fabrica_sucursal", 0)))
        total_general_publico += Decimal(str(norm.get("valor_total_publico_sucursal", 0)))
        del norm["_id"]
        results.append(norm)

    return {
        "total_general_fabrica": float(total_general_fabrica),
        "total_general_publico": float(total_general_publico),
        "ganancia_potencial": float(total_general_publico - total_general_fabrica),
        "por_sucursal": results,
        "historical": bool(date),
        "date": date
    }

import pandas as pd
import io
from fastapi.responses import StreamingResponse

@router.get("/valued-inventory/export")
async def export_valued_inventory(
    date: Optional[str] = None, # YYYY-MM-DD
    sucursal_id: Optional[str] = "all",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Exports the valued inventory report to Excel.
    """
    report_data = await get_valued_inventory(date=date, sucursal_id=sucursal_id, current_user=current_user)
    
    rows = []
    for sucursal in report_data.get("por_sucursal", []):
        sucursal_nombre = sucursal.get("sucursal_nombre", "")
        for item in sucursal.get("desglose", []):
            rows.append({
                "SUCURSAL": sucursal_nombre,
                "PRODUCTO": item.get("producto_nombre", ""),
                "CANTIDAD": item.get("cantidad", 0),
                "P. COSTO": float(item.get("costo_unitario", 0)),
                "P. PÚBLICO": float(item.get("precio_publico_unitario", 0)),
                "VALOR COSTO TOTAL": float(item.get("valor_fabrica", 0)),
                "VALOR PÚBLICO TOTAL": float(item.get("valor_publico", 0)),
            })
            
    df = pd.DataFrame(rows)
    
    if not df.empty:
        pivot_df = df.pivot_table(
            index=['PRODUCTO', 'P. COSTO', 'P. PÚBLICO'],
            columns='SUCURSAL',
            values='CANTIDAD',
            aggfunc='sum',
            fill_value=0
        ).reset_index()
        sucursales_cols = df['SUCURSAL'].unique().tolist()
        pivot_df['TOTAL CANTIDAD'] = pivot_df[sucursales_cols].sum(axis=1)
        pivot_df['VALOR COSTO TOTAL'] = pivot_df['TOTAL CANTIDAD'] * pivot_df['P. COSTO']
        pivot_df['VALOR PÚBLICO TOTAL'] = pivot_df['TOTAL CANTIDAD'] * pivot_df['P. PÚBLICO']
    else:
        pivot_df = pd.DataFrame(columns=["PRODUCTO", "P. COSTO", "P. PÚBLICO", "TOTAL CANTIDAD", "VALOR COSTO TOTAL", "VALOR PÚBLICO TOTAL"])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Inventario Detallado', index=False)
        pivot_df.to_excel(writer, sheet_name='Saldos por Sucursal', index=False)
        
    output.seek(0)
    
    filename_date = date if date else datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    filename = f"inventario_valorado_{filename_date}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/sales-by-hour")
async def get_sales_by_hour(
    date: str, # YYYY-MM-DD
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns total sales grouped by hour for a specific day.
    """
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    target_sucursal = sucursal_id
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        target_sucursal = current_user.sucursal_id

    try:
        start_dt, end_dt = get_day_range_bolivia(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    match_filter = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }
    
    if target_sucursal and target_sucursal != "all":
        match_filter["sucursal_id"] = target_sucursal

    pipeline = [
        {"$match": match_filter},
        {
            "$project": {
                # Convertir a hora Bolivia (-04:00) para agrupar correctamente
                "hour": {"$hour": {"date": "$created_at", "timezone": "-04:00"}},
                "total": 1
            }
        },
        {
            "$group": {
                "_id": "$hour",
                "total_ventas": {"$sum": "$total"},
                "cantidad_ventas": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    cursor = Sale.get_pymongo_collection().aggregate(pipeline)
    raw_results = await cursor.to_list(length=24)
    
    # Generar un arreglo con todas las horas (0-23) para que el gráfico no tenga huecos
    hourly_data = {i: {"hour": f"{i:02d}:00", "total_ventas": 0.0, "cantidad_ventas": 0} for i in range(24)}
    
    for r in raw_results:
        h = r["_id"]
        hourly_data[h]["total_ventas"] = float(r["total_ventas"].to_decimal()) if type(r["total_ventas"]).__name__ == "Decimal128" else float(r["total_ventas"])
        hourly_data[h]["cantidad_ventas"] = r["cantidad_ventas"]

    # Filtrar solo desde la primera hora con ventas hasta la última (o 8am a 10pm por defecto si prefieres)
    # Por ahora devolvemos todo y el frontend decide si mostrar las 24 hrs
    return list(hourly_data.values())

@router.get("/staff-performance")
async def get_staff_performance(
    date: Optional[str] = None, # YYYY-MM-DD (para un solo día)
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns sales grouped by cashier and by vendor for a specific day or date range.
    """
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    target_sucursal = sucursal_id
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        target_sucursal = current_user.sucursal_id

    try:
        if start_date and end_date:
            start_dt, end_dt = get_range_bolivia(start_date, end_date)
        elif date:
            start_dt, end_dt = get_day_range_bolivia(date)
        else:
            # Por defecto hoy
            today_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
            start_dt, end_dt = get_day_range_bolivia(today_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    match_filter = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }
    
    if target_sucursal and target_sucursal != "all":
        match_filter["sucursal_id"] = target_sucursal

    # Pipeline para obtener el desglose de productos y categorías por staff
    def get_details_pipeline(staff_field):
        return [
            {"$match": match_filter},
            {"$unwind": "$items"},
            # Lookup de productos para obtener categoría
            {"$addFields": {
                "tmp_prod_id": {
                    "$cond": [
                        {"$and": [
                            {"$ne": ["$items.producto_id", None]},
                            {"$eq": [{"$strLenCP": "$items.producto_id"}, 24]}
                        ]},
                        {"$toObjectId": "$items.producto_id"},
                        None
                    ]
                }
            }},
            {"$lookup": {
                "from": "products",
                "localField": "tmp_prod_id",
                "foreignField": "_id",
                "as": "product_info"
            }},
            {"$unwind": {"path": "$product_info", "preserveNullAndEmptyArrays": True}},
            # Lookup de categorías
            {"$addFields": {
                "tmp_cat_id": {
                    "$cond": [
                        {"$and": [
                            {"$ne": ["$product_info.categoria_id", None]},
                            {"$eq": [{"$strLenCP": "$product_info.categoria_id"}, 24]}
                        ]},
                        {"$toObjectId": "$product_info.categoria_id"},
                        None
                    ]
                }
            }},
            {"$lookup": {
                "from": "categories",
                "localField": "tmp_cat_id",
                "foreignField": "_id",
                "as": "category_info"
            }},
            {"$unwind": {"path": "$category_info", "preserveNullAndEmptyArrays": True}},
            # Agrupar por Staff -> Categoría -> Producto
            {"$group": {
                "_id": {
                    "staff": {"$ifNull": [f"${staff_field}", "Desconocido"]},
                    "categoria": {"$ifNull": ["$category_info.name", "Sin Categoría"]},
                    "producto": "$items.descripcion"
                },
                "cantidad": {"$sum": "$items.cantidad"},
                "total": {"$sum": "$items.subtotal"}
            }},
            # Anidar productos en categorías
            {"$group": {
                "_id": {
                    "staff": "$_id.staff",
                    "categoria": "$_id.categoria"
                },
                "productos": {"$push": {
                    "nombre": "$_id.producto",
                    "cantidad": "$cantidad",
                    "total": "$total"
                }},
                "total_categoria": {"$sum": "$total"}
            }},
            # Anidar categorías en staff
            {"$group": {
                "_id": "$_id.staff",
                "categorias": {"$push": {
                    "nombre": "$_id.categoria",
                    "total": "$total_categoria",
                    "productos": "$productos"
                }},
                "total_items": {"$sum": "$total_categoria"}
            }},
            {"$sort": {"total_items": -1}}
        ]

    pipeline = [
        {"$match": match_filter},
        {"$facet": {
            "resumen_cajeros": [
                {"$group": {
                    "_id": {"$ifNull": ["$cashier_name", "Cajero Desconocido"]},
                    "total_ventas": {"$sum": "$total"},
                    "cantidad_ventas": {"$sum": 1}
                }},
                {"$sort": {"total_ventas": -1}}
            ],
            "resumen_vendedores": [
                {"$group": {
                    "_id": {"$ifNull": ["$vendedor_name", "Sin Vendedor Asignado"]},
                    "total_ventas": {"$sum": "$total"},
                    "cantidad_ventas": {"$sum": 1}
                }},
                {"$sort": {"total_ventas": -1}}
            ],
            "detalles_cajeros": get_details_pipeline("cashier_name"),
            "detalles_vendedores": get_details_pipeline("vendedor_name")
        }}
    ]

    cursor = Sale.get_pymongo_collection().aggregate(pipeline)
    raw_results = await cursor.to_list(length=1)
    
    if not raw_results:
        return {"cajeros": [], "vendedores": []}
        
    facet = raw_results[0]
    
    # Helper para formatear Decimal128
    def fmt_val(v):
        if v is None: return 0.0
        return float(v.to_decimal()) if type(v).__name__ == "Decimal128" else float(v)

    # Mapear detalles para acceso rápido
    detalles_caj_map = {d["_id"]: d["categorias"] for d in facet.get("detalles_cajeros", [])}
    detalles_ven_map = {d["_id"]: d["categorias"] for d in facet.get("detalles_vendedores", [])}

    # Formatear Cajeros
    cajeros = []
    for c in facet.get("resumen_cajeros", []):
        nombre = c["_id"]
        cajeros.append({
            "nombre": nombre,
            "total_ventas": fmt_val(c["total_ventas"]),
            "cantidad_ventas": c["cantidad_ventas"],
            "categorias": [
                {
                    "nombre": cat["nombre"],
                    "total": fmt_val(cat["total"]),
                    "productos": [
                        {
                            "nombre": p["nombre"],
                            "cantidad": p["cantidad"],
                            "total": fmt_val(p["total"])
                        } for p in cat["productos"]
                    ]
                } for cat in detalles_caj_map.get(nombre, [])
            ]
        })
        
    # Formatear Vendedores
    vendedores = []
    for v in facet.get("resumen_vendedores", []):
        nombre = v["_id"]
        vendedores.append({
            "nombre": nombre,
            "total_ventas": fmt_val(v["total_ventas"]),
            "cantidad_ventas": v["cantidad_ventas"],
            "categorias": [
                {
                    "nombre": cat["nombre"],
                    "total": fmt_val(cat["total"]),
                    "productos": [
                        {
                            "nombre": p["nombre"],
                            "cantidad": p["cantidad"],
                            "total": fmt_val(p["total"])
                        } for p in cat["productos"]
                    ]
                } for cat in detalles_ven_map.get(nombre, [])
            ]
        })

    return {
        "cajeros": cajeros,
        "vendedores": vendedores
    }


@router.get("/sales-matrix")
async def get_sales_matrix(
    start_date: str, # YYYY-MM-DD
    end_date: str, # YYYY-MM-DD
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns sales matrix grouped by product and day.
    """
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    target_sucursal = sucursal_id
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        target_sucursal = current_user.sucursal_id

    try:
        start_dt, end_dt = get_range_bolivia(start_date, end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    match_filter = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "sale_date": {"$gte": start_dt, "$lte": end_dt}
    }
    
    if target_sucursal and target_sucursal != "all":
        match_filter["sucursal_id"] = target_sucursal

    pipeline = [
        {"$match": match_filter},
        {
            "$lookup": {
                "from": "sales",
                "let": {"sid": "$sale_id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$eq": [{"$toString": "$_id"}, "$$sid"]
                            },
                            "anulada": False
                        }
                    }
                ],
                "as": "sale_parent"
            }
        },
        {"$match": {"sale_parent": {"$ne": []}}},
        {
            "$project": {
                "producto_id": 1,
                "descripcion": 1,
                "cantidad": 1,
                "date_str": {
                    "$dateToString": {
                        "format": "%Y-%m-%d", 
                        "date": "$sale_date", 
                        "timezone": "-04:00"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "producto_id": "$producto_id",
                    "descripcion": "$descripcion",
                    "date": "$date_str"
                },
                "cantidad": {"$sum": "$cantidad"}
            }
        }
    ]

    cursor = SaleItem.get_pymongo_collection().aggregate(pipeline)
    raw_results = await cursor.to_list(length=None)
    
    # We need to construct the matrix payload
    # { "products": { "prod_id": { "descripcion": "xxx", "days": { "YYYY-MM-DD": cant } } } }
    
    products = {}
    for r in raw_results:
        _id = r["_id"]
        p_id = _id["producto_id"]
        desc = _id["descripcion"]
        date_str = _id["date"]
        cant = r["cantidad"]
        
        if p_id not in products:
            products[p_id] = {
                "producto_id": p_id,
                "descripcion": desc,
                "days": {}
            }
        
        products[p_id]["days"][date_str] = products[p_id]["days"].get(date_str, 0) + cant

    return {
        "products": list(products.values())
    }

@router.get("/conciliacion-inventario")
async def get_inventory_reconciliation(
    start_date: str,
    end_date: str,
    sucursal_id: str = "all",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
) -> Dict[str, Any]:
    from app.domain.models.inventario import InventoryLog
    from app.domain.models.sale import Sale
    
    tenant_id = current_user.tenant_id or ""
    start_dt, end_dt = get_range_bolivia(start_date, end_date)
    
    inv_query = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }
    if sucursal_id != "all":
        inv_query["sucursal_id"] = sucursal_id
        
    logs_pipeline = [
        {"$match": inv_query},
        {
            "$group": {
                "_id": "$tipo_movimiento",
                "cantidad": {"$sum": "$cantidad_movida"},
                "valor_costo": {"$sum": {"$multiply": ["$cantidad_movida", {"$toDouble": "$costo_unitario_momento"}]}}
            }
        }
    ]
    cursor_logs = InventoryLog.get_pymongo_collection().aggregate(logs_pipeline)
    raw_logs = await cursor_logs.to_list(length=None)
    
    ingresos_costo = Decimal("0.0")
    salidas_mermas_costo = Decimal("0.0")
    costo_ventas_kardex = Decimal("0.0")
    
    for r in raw_logs:
        tipo = r["_id"]
        valor = Decimal(str(r["valor_costo"]))
        if valor > 0: 
            ingresos_costo += valor
        else: 
            if tipo == "VENTA":
                costo_ventas_kardex += abs(valor)
            else:
                salidas_mermas_costo += abs(valor)
                
    sale_query = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }
    if sucursal_id != "all":
        sale_query["sucursal_id"] = sucursal_id
        
    sales_pipeline = [
        {"$match": sale_query},
        {
            "$group": {
                "_id": None,
                "total_ventas": {"$sum": {"$toDouble": "$total"}}
            }
        }
    ]
    cursor_sales = Sale.get_pymongo_collection().aggregate(sales_pipeline)
    raw_sales = await cursor_sales.to_list(length=1)
    
    ventas_netas = Decimal(str(raw_sales[0]["total_ventas"])) if raw_sales else Decimal("0.0")
    ganancia_bruta = ventas_netas - costo_ventas_kardex
    
    # Calculate inventario_final_costo strictly at end_dt using InventoryLog to ensure 100% match with valued-inventory
    hist_match = {"tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}), "created_at": {"$lte": end_dt}}
    if sucursal_id != "all":
        hist_match["sucursal_id"] = sucursal_id
        
    inv_final_pipeline = [
        {"$match": hist_match},
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": {"sucursal_id": "$sucursal_id", "producto_id": "$producto_id"},
                "last_log": {"$first": "$$ROOT"}
            }
        },
        {"$match": {"last_log.stock_resultante": {"$gt": 0}}},
        {
            "$group": {
                "_id": None,
                "inventario_final_costo": {
                    "$sum": {"$multiply": ["$last_log.stock_resultante", {"$toDouble": {"$ifNull": ["$last_log.costo_unitario_momento", 0]}}]}
                }
            }
        }
    ]
    cursor_inv = InventoryLog.get_pymongo_collection().aggregate(inv_final_pipeline)
    raw_inv = await cursor_inv.to_list(length=1)
    inventario_final_costo = Decimal(str(raw_inv[0]["inventario_final_costo"])) if raw_inv else Decimal("0.0")
    
    # Calculate TRUE inventario_inicial_costo strictly BEFORE start_dt
    hist_start_match = {"tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}), "created_at": {"$lt": start_dt}}
    if sucursal_id != "all":
        hist_start_match["sucursal_id"] = sucursal_id
        
    inv_inicial_pipeline = [
        {"$match": hist_start_match},
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": {"sucursal_id": "$sucursal_id", "producto_id": "$producto_id"},
                "last_log": {"$first": "$$ROOT"}
            }
        },
        {"$match": {"last_log.stock_resultante": {"$gt": 0}}},
        {
            "$group": {
                "_id": None,
                "inventario_inicial_costo": {
                    "$sum": {"$multiply": ["$last_log.stock_resultante", {"$toDouble": {"$ifNull": ["$last_log.costo_unitario_momento", 0]}}]}
                }
            }
        }
    ]
    cursor_inv_ini = InventoryLog.get_pymongo_collection().aggregate(inv_inicial_pipeline)
    raw_inv_ini = await cursor_inv_ini.to_list(length=1)
    true_inventario_inicial_costo = Decimal(str(raw_inv_ini[0]["inventario_inicial_costo"])) if raw_inv_ini else Decimal("0.0")
    
    # Calculate revaluation (difference between expected final and actual final)
    expected_final = true_inventario_inicial_costo + ingresos_costo - salidas_mermas_costo - costo_ventas_kardex
    revalorizacion_costos = inventario_final_costo - expected_final
    
    return {
        "inventario_inicial_costo": float(true_inventario_inicial_costo),
        "revalorizacion_costos": float(revalorizacion_costos),
        "ingresos_inventario_costo": float(ingresos_costo),
        "salidas_mermas_costo": float(salidas_mermas_costo),
        "costo_ventas": float(costo_ventas_kardex),
        "ventas_netas": float(ventas_netas),
        "ganancia_bruta": float(ganancia_bruta),
        "inventario_final_costo": float(inventario_final_costo)
    }

@router.get("/expenses-report")
async def get_expenses_report(
    start_date: str, # YYYY-MM-DD
    end_date: str,   # YYYY-MM-DD
    sucursal_id: Optional[str] = None,
    categoria_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns a detailed expenses report filtered by date range, branch and category.
    """
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    # Permission check: Branch admins only see their branch
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]:
        target_sucursal = current_user.sucursal_id
    else:
        target_sucursal = sucursal_id if sucursal_id and sucursal_id != "all" else None

    # Parse dates
    try:
        s_dt, _ = get_day_range_bolivia(start_date)
        _, e_dt = get_day_range_bolivia(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    # Build query
    query: Dict[str, Any] = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "tipo": "EGRESO",
        "subtipo": SubtipoMovimiento.GASTO,
        "fecha": {"$gte": s_dt, "$lte": e_dt}
    }
    if target_sucursal:
        query["sucursal_id"] = target_sucursal
    if categoria_id and categoria_id != "all":
        query["categoria_id"] = categoria_id

    # Get movements
    movimientos = await CajaMovimiento.find(query).sort("-fecha").to_list()
    
    # Get categories to map IDs to names
    categories = await CajaGastoCategoria.find(CajaGastoCategoria.tenant_id == tenant_id).to_list()
    cat_map = {str(c.id): c.nombre for c in categories}
    
    # Format response
    total_monto = _ZERO
    detalle = []
    
    for m in movimientos:
        total_monto += m.monto
        detalle.append({
            "id": str(m.id),
            "fecha": m.fecha.isoformat(),
            "hora": m.fecha.strftime("%H:%M"),
            "monto": float(m.monto),
            "descripcion": m.descripcion,
            "categoria": cat_map.get(m.categoria_id, "Sin Categoría"),
            "cajero": m.cajero_name,
            "sucursal_id": m.sucursal_id
        })

    # Summary by category
    por_categoria = {}
    for d in detalle:
        cat = d["categoria"]
        por_categoria[cat] = por_categoria.get(cat, 0.0) + d["monto"]

    return {
        "total": float(total_monto),
        "count": len(detalle),
        "detalle": detalle,
        "por_categoria": por_categoria
    }

from pydantic import BaseModel
from typing import List, Literal

class ProductStatsRequest(BaseModel):
    producto_ids: List[str]
    start_date: str # YYYY-MM-DD
    end_date: str   # YYYY-MM-DD
    intervalo: Literal["dia", "semana", "mes"] = "dia"
    sucursal_id: Optional[str] = "all"

@router.post("/product-stats")
async def get_product_stats(
    req: ProductStatsRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id
    
    # Permission check for branch
    target_sucursal = req.sucursal_id
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        target_sucursal = current_user.sucursal_id

    try:
        start_dt, _ = get_day_range_bolivia(req.start_date)
        _, end_dt = get_day_range_bolivia(req.end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    if not req.producto_ids:
        return []

    # Format string for Mongo dateToString based on interval
    if req.intervalo == "dia":
        date_format = "%Y-%m-%d"
    elif req.intervalo == "semana":
        date_format = "%Y-%U" # Year and Week number
    elif req.intervalo == "mes":
        date_format = "%Y-%m"
    else:
        date_format = "%Y-%m-%d"

    match_filter = {
        "tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),
        "sale_date": {"$gte": start_dt, "$lte": end_dt}
    }
    
    if target_sucursal and target_sucursal != "all":
        match_filter["sucursal_id"] = target_sucursal

    pipeline = [
        {"$match": match_filter},
        {
            "$lookup": {
                "from": "sales",
                "let": {"sid": "$sale_id"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$sid"]}, "anulada": False}}
                ],
                "as": "sale_parent"
            }
        },
        {"$match": {"sale_parent": {"$ne": []}}},
        {"$match": {"producto_id": {"$in": req.producto_ids}}},
        {
            "$group": {
                "_id": {
                    "fecha": { "$dateToString": { "format": date_format, "date": "$sale_date", "timezone": "-04:00" } },
                    "producto_id": "$producto_id",
                    "descripcion": "$descripcion"
                },
                "cantidad": {"$sum": "$cantidad"},
                "subtotal": {"$sum": "$subtotal"}
            }
        },
        {
            "$project": {
                "fecha": "$_id.fecha",
                "producto_id": "$_id.producto_id",
                "producto_nombre": "$_id.descripcion",
                "cantidad": 1,
                "ingreso_bruto": "$subtotal",
                "_id": 0
            }
        },
        {"$sort": {"fecha": 1}}
    ]

    cursor = SaleItem.get_pymongo_collection().aggregate(pipeline)
    raw_results = await cursor.to_list(length=5000)
    
    # We must format the data in a way that is easily consumable by Recharts.
    # Typically: [{ fecha: "2023-01-01", "Prod A Unidades": 5, "Prod A Ingreso": 100, "Prod B Unidades": 2 ... }]
    # But we can just return the raw aggregated list and let the frontend pivot it, or we can pivot it here.
    # Returning raw is often better so the frontend has full flexibility.
    
    results = []
    for r in raw_results:
        norm = normalize_bson(r)
        norm["cantidad"] = int(norm.get("cantidad", 0))
        norm["ingreso_bruto"] = float(str(norm.get("ingreso_bruto", 0)))
        results.append(norm)

    return results


@router.get("/purchases-by-client")
async def get_purchases_by_client(
    start_date: str,
    end_date: str,
    sucursal_id: Optional[str] = "all",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Returns a detailed purchases report grouped by client.
    Shows: total purchases, ticket average, payment methods breakdown (EFECTIVO/QR/TARJETA/TRANSFERENCIA/CREDITO),
    number of unique clients, and per-client detail.
    """
    tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id

    target_sucursal = sucursal_id
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        target_sucursal = current_user.sucursal_id

    try:
        start_dt, end_dt = get_range_bolivia(start_date, end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    match_filter = {
        "tenant_id": tenant_id,
        "anulada": False,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }

    if target_sucursal and target_sucursal != "all":
        match_filter["sucursal_id"] = target_sucursal

    pipeline = [
        {"$match": match_filter},
        {
            "$group": {
                "_id": {
                    "cliente_id": {"$ifNull": ["$cliente_id", {"$ifNull": ["$cliente.nit", "$cliente.razon_social"]}]},
                    "nit": {"$ifNull": ["$cliente.nit", None]},
                    "razon_social": {"$ifNull": ["$cliente.razon_social", "Cliente Sin Identificar"]},
                    "telefono": {"$ifNull": ["$cliente.telefono", None]}
                },
                "cantidad_compras": {"$sum": 1},
                "total_comprado": {"$sum": "$total"},
                "pagos": {"$push": "$pagos"}
            }
        },
        {
            "$project": {
                "cliente_id": "$_id.cliente_id",
                "nit": "$_id.nit",
                "razon_social": "$_id.razon_social",
                "telefono": "$_id.telefono",
                "cantidad_compras": 1,
                "total_comprado": 1,
                "pagos": 1,
                "_id": 0
            }
        },
        {"$sort": {"total_comprado": -1}}
    ]

    cursor = Sale.get_pymongo_collection().aggregate(pipeline)
    raw_results = await cursor.to_list(length=5000)

    def fmt_val(v):
        if v is None:
            return Decimal("0")
        if hasattr(v, 'to_decimal'):
            return v.to_decimal()
        return Decimal(str(v))

    client_data = {}
    total_global = Decimal("0")
    total_efectivo = Decimal("0")
    total_qr = Decimal("0")
    total_tarjeta = Decimal("0")
    total_transferencia = Decimal("0")
    total_credito = Decimal("0")
    total_transacciones = 0

    for r in raw_results:
        nit = r.get("nit") or r.get("razon_social", "Cliente Sin Identificar")
        if nit not in client_data:
            client_data[nit] = {
                "nit": r.get("nit"),
                "razon_social": r.get("razon_social", "Cliente Sin Identificar"),
                "telefono": r.get("telefono"),
                "cantidad_compras": 0,
                "total_comprado": Decimal("0"),
                "efectivo": Decimal("0"),
                "qr": Decimal("0"),
                "tarjeta": Decimal("0"),
                "transferencia": Decimal("0"),
                "credito": Decimal("0")
            }

        total_comprado = fmt_val(r.get("total_comprado", 0))
        client_data[nit]["cantidad_compras"] += r.get("cantidad_compras", 0)
        client_data[nit]["total_comprado"] += total_comprado
        total_global += total_comprado
        total_transacciones += r.get("cantidad_compras", 0)

        pagos_list = r.get("pagos", []) or []
        for pago_group in pagos_list:
            if not pago_group:
                continue
            items_to_process = pago_group if isinstance(pago_group, list) else [pago_group]
            for p in items_to_process:
                if isinstance(p, dict):
                    metodo = (p.get("metodo") or "CREDITO").upper()
                    monto = fmt_val(p.get("monto", 0))
                    if metodo == "EFECTIVO":
                        client_data[nit]["efectivo"] += monto
                        total_efectivo += monto
                    elif metodo == "QR":
                        client_data[nit]["qr"] += monto
                        total_qr += monto
                    elif metodo == "TARJETA":
                        client_data[nit]["tarjeta"] += monto
                        total_tarjeta += monto
                    elif metodo == "TRANSFERENCIA":
                        client_data[nit]["transferencia"] += monto
                        total_transferencia += monto
                    elif metodo == "CREDITO":
                        client_data[nit]["credito"] += monto
                        total_credito += monto

    unique_clients = len(client_data)
    ticket_promedio = total_global / unique_clients if unique_clients > 0 else Decimal("0")

    clientes_list = []
    for client_info in client_data.values():
        clientes_list.append({
            "nit": client_info["nit"],
            "razon_social": client_info["razon_social"],
            "telefono": client_info["telefono"],
            "cantidad_compras": client_info["cantidad_compras"],
            "total_comprado": float(client_info["total_comprado"]),
            "ticket_promedio": float(client_info["total_comprado"] / client_info["cantidad_compras"]) if client_info["cantidad_compras"] > 0 else 0,
            "efectivo": float(client_info["efectivo"]),
            "qr": float(client_info["qr"]),
            "tarjeta": float(client_info["tarjeta"]),
            "transferencia": float(client_info["transferencia"]),
            "credito": float(client_info["credito"]),
            "metodo_preferido": (
                "EFECTIVO" if client_info["efectivo"] >= max(client_info["qr"], client_info["tarjeta"], client_info["transferencia"], client_info["credito"])
                else "QR" if client_info["qr"] >= max(client_info["tarjeta"], client_info["transferencia"], client_info["credito"])
                else "TARJETA" if client_info["tarjeta"] >= max(client_info["transferencia"], client_info["credito"])
                else "TRANSFERENCIA" if client_info["transferencia"] >= client_info["credito"]
                else "CREDITO"
            )
        })

    clientes_list.sort(key=lambda x: x["total_comprado"], reverse=True)

    por_metodo = {
        "EFECTIVO": float(total_efectivo),
        "QR": float(total_qr),
        "TARJETA": float(total_tarjeta),
        "TRANSFERENCIA": float(total_transferencia),
        "CREDITO": float(total_credito)
    }

    return {
        "resumen": {
            "total_comprado": float(total_global),
            "clientes_unicos": unique_clients,
            "total_transacciones": total_transacciones,
            "ticket_promedio_general": float(ticket_promedio),
            "por_metodo": por_metodo
        },
        "por_cliente": clientes_list,
        "filtros": {
            "start_date": start_date,
            "end_date": end_date,
            "sucursal_id": target_sucursal if target_sucursal and target_sucursal != "all" else "todas"
        }
    }


# ─── GET /monthly-evolution ───────────────────────────────────────────────────

@router.get("/monthly-evolution")
async def get_monthly_evolution(
    months: int = 12,
    sucursal_id: Optional[str] = None,
    categoria_id: Optional[str] = None,
    producto_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL, UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """
    Reporte de Evolución Mensual (Month-over-Month - MoM).
    Proporciona desgloses y filtros por Sucursal, Categoría y Producto.
    """
    tenant_id = current_user.tenant_id or "default"
    
    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR]:
        sucursal_id = current_user.sucursal_id

    # 1. Mapeos
    sucursales_list = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
    sucursal_names_map = {str(s.id): s.nombre for s in sucursales_list}

    categories_list = await Category.find(Category.tenant_id == tenant_id).to_list()
    cat_names_map = {str(c.id): c.name for c in categories_list}

    products_list = await Product.find(Product.tenant_id == tenant_id).to_list()
    product_cat_map = {str(p.id): str(p.categoria_id) if p.categoria_id else "" for p in products_list}
    product_names_map = {str(p.id): p.descripcion for p in products_list}

    # 2. Calcular rango de fechas para los meses solicitados
    now = datetime.now(BOLIVIA_TZ)
    year = now.year
    month = now.month - months + 1
    while month <= 0:
        month += 12
        year -= 1
    start_date = datetime(year, month, 1, 0, 0, 0, tzinfo=BOLIVIA_TZ)

    # 3. Consultar ventas activas del tenant en el periodo
    filters = [
        Sale.tenant_id == tenant_id,
        Sale.anulada == False,
        Sale.created_at >= start_date
    ]
    if sucursal_id and sucursal_id != "all":
        filters.append(Sale.sucursal_id == sucursal_id)

    from pydantic import BaseModel
    class SaleLightProjection(BaseModel):
        created_at: datetime
        sucursal_id: Optional[str] = None
        items: list = []
        pagos: list = []

    sales = await Sale.find(*filters).project(SaleLightProjection).sort(Sale.created_at).to_list()

    # 4. Agrupar por mes (%Y-%m)
    monthly_data: Dict[str, Dict[str, Any]] = {}
    curr_yr, curr_mo = start_date.year, start_date.month
    while (curr_yr < now.year) or (curr_yr == now.year and curr_mo <= now.month):
        key = f"{curr_yr:04d}-{curr_mo:02d}"
        monthly_data[key] = {
            "periodo": key,
            "total_ventas": 0.0,
            "transacciones": 0,
            "unidades": 0,
            "por_sucursal": {}
        }
        curr_mo += 1
        if curr_mo > 12:
            curr_mo = 1
            curr_yr += 1

    all_period_keys = sorted(list(monthly_data.keys()))
    latest_month_key = all_period_keys[-1] if all_period_keys else f"{now.year:04d}-{now.month:02d}"
    prev_month_key = all_period_keys[-2] if len(all_period_keys) >= 2 else None

    sucursal_totals_latest_month: Dict[str, Dict[str, Any]] = {}
    sucursal_totals_prev_month: Dict[str, Dict[str, Any]] = {}

    category_totals_latest_month: Dict[str, Dict[str, Any]] = {}
    category_totals_prev_month: Dict[str, Dict[str, Any]] = {}

    product_totals_latest_month: Dict[str, Dict[str, Any]] = {}
    product_totals_prev_month: Dict[str, Dict[str, Any]] = {}

    for sale in sales:
        m_key = sale.created_at.strftime("%Y-%m")
        if m_key not in monthly_data:
            monthly_data[m_key] = {
                "periodo": m_key,
                "total_ventas": 0.0,
                "transacciones": 0,
                "unidades": 0,
                "por_sucursal": {}
            }

        # Filtrado de ítems por categoría o producto si se solicitó
        sale_items_matching = []
        for item in sale.items:
            item_prod_id = str(item.producto_id) if item.producto_id else None
            item_cat_id = product_cat_map.get(item_prod_id, "") if item_prod_id else ""

            if categoria_id and categoria_id != "all" and item_cat_id != categoria_id:
                continue
            if producto_id and producto_id != "all" and item_prod_id != producto_id:
                continue

            sale_items_matching.append((item, item_prod_id, item_cat_id))

        if (categoria_id and categoria_id != "all" or producto_id and producto_id != "all") and not sale_items_matching:
            continue

        m_obj = monthly_data[m_key]

        if (categoria_id and categoria_id != "all") or (producto_id and producto_id != "all"):
            sale_total = sum(float(i[0].subtotal or (i[0].precio_unitario * i[0].cantidad)) for i in sale_items_matching)
            sum_items = sum(float(i[0].cantidad) for i in sale_items_matching)
        else:
            sale_total = float(sale.total)
            sum_items = sum(float(i.cantidad) for i in sale.items)

        m_obj["total_ventas"] += sale_total
        m_obj["transacciones"] += 1
        m_obj["unidades"] += sum_items

        suc_name = sucursal_names_map.get(str(sale.sucursal_id), str(sale.sucursal_id) if sale.sucursal_id else "Central")
        m_obj["por_sucursal"][suc_name] = m_obj["por_sucursal"].get(suc_name, 0.0) + sale_total

        # Acumuladores de sucursales
        if m_key == latest_month_key:
            if suc_name not in sucursal_totals_latest_month:
                sucursal_totals_latest_month[suc_name] = {"total": 0.0, "transacciones": 0}
            sucursal_totals_latest_month[suc_name]["total"] += sale_total
            sucursal_totals_latest_month[suc_name]["transacciones"] += 1
        elif prev_month_key and m_key == prev_month_key:
            if suc_name not in sucursal_totals_prev_month:
                sucursal_totals_prev_month[suc_name] = {"total": 0.0, "transacciones": 0}
            sucursal_totals_prev_month[suc_name]["total"] += sale_total
            sucursal_totals_prev_month[suc_name]["transacciones"] += 1

        # Acumuladores de categorías y productos
        items_to_aggregate = sale_items_matching if ((categoria_id and categoria_id != "all") or (producto_id and producto_id != "all")) else [(i, str(i.producto_id) if i.producto_id else None, product_cat_map.get(str(i.producto_id), "") if i.producto_id else "") for i in sale.items]

        for item_obj, item_prod_id, item_cat_id in items_to_aggregate:
            item_total = float(item_obj.subtotal or (item_obj.precio_unitario * item_obj.cantidad))
            item_qty = float(item_obj.cantidad)
            
            c_name = cat_names_map.get(item_cat_id, "General")
            p_name = product_names_map.get(item_prod_id, item_obj.descripcion)

            if m_key == latest_month_key:
                if c_name not in category_totals_latest_month:
                    category_totals_latest_month[c_name] = {"total": 0.0, "unidades": 0.0}
                category_totals_latest_month[c_name]["total"] += item_total
                category_totals_latest_month[c_name]["unidades"] += item_qty

                if p_name not in product_totals_latest_month:
                    product_totals_latest_month[p_name] = {"total": 0.0, "unidades": 0.0}
                product_totals_latest_month[p_name]["total"] += item_total
                product_totals_latest_month[p_name]["unidades"] += item_qty

            elif prev_month_key and m_key == prev_month_key:
                if c_name not in category_totals_prev_month:
                    category_totals_prev_month[c_name] = {"total": 0.0, "unidades": 0.0}
                category_totals_prev_month[c_name]["total"] += item_total
                category_totals_prev_month[c_name]["unidades"] += item_qty

                if p_name not in product_totals_prev_month:
                    product_totals_prev_month[p_name] = {"total": 0.0, "unidades": 0.0}
                product_totals_prev_month[p_name]["total"] += item_total
                product_totals_prev_month[p_name]["unidades"] += item_qty

    # Lista ordenada de evolución
    evolution_list = []
    for k in sorted(monthly_data.keys()):
        item = monthly_data[k]
        tx = item["transacciones"]
        item["ticket_promedio"] = round(item["total_ventas"] / tx, 2) if tx > 0 else 0.0
        item["total_ventas"] = round(item["total_ventas"], 2)
        evolution_list.append(item)

    # Variaciones MoM globales del último mes
    latest = monthly_data.get(latest_month_key, {"total_ventas": 0.0, "transacciones": 0, "ticket_promedio": 0.0})
    prev = monthly_data.get(prev_month_key, {"total_ventas": 0.0, "transacciones": 0, "ticket_promedio": 0.0}) if prev_month_key else {"total_ventas": 0.0, "transacciones": 0, "ticket_promedio": 0.0}

    total_latest = float(latest["total_ventas"])
    total_prev = float(prev["total_ventas"])
    diff_abs = total_latest - total_prev
    diff_pct = ((total_latest - total_prev) / total_prev * 100.0) if total_prev > 0 else (100.0 if total_latest > 0 else 0.0)

    tx_latest = int(latest["transacciones"])
    tx_prev = int(prev["transacciones"])
    diff_tx_pct = ((tx_latest - tx_prev) / tx_prev * 100.0) if tx_prev > 0 else (100.0 if tx_latest > 0 else 0.0)

    tkt_latest = float(latest.get("ticket_promedio", 0.0))
    tkt_prev = float(prev.get("ticket_promedio", 0.0))
    diff_tkt_pct = ((tkt_latest - tkt_prev) / tkt_prev * 100.0) if tkt_prev > 0 else (100.0 if tkt_latest > 0 else 0.0)

    # 1. Participación y MoM por sucursal
    participacion_sucursales = []
    all_suc_names = set(list(sucursal_totals_latest_month.keys()) + list(sucursal_totals_prev_month.keys()))
    for s_name in sorted(all_suc_names):
        curr_data = sucursal_totals_latest_month.get(s_name, {"total": 0.0, "transacciones": 0})
        prev_data = sucursal_totals_prev_month.get(s_name, {"total": 0.0, "transacciones": 0})
        s_total = float(curr_data["total"])
        s_prev_total = float(prev_data["total"])
        share_pct = (s_total / total_latest * 100.0) if total_latest > 0 else 0.0
        suc_mom_pct = ((s_total - s_prev_total) / s_prev_total * 100.0) if s_prev_total > 0 else (100.0 if s_total > 0 else 0.0)
        s_tx = int(curr_data["transacciones"])
        s_tkt = (s_total / s_tx) if s_tx > 0 else 0.0

        participacion_sucursales.append({
            "sucursal_nombre": s_name,
            "total_ventas": round(s_total, 2),
            "participacion_porcentaje": round(share_pct, 1),
            "variacion_mom_porcentaje": round(suc_mom_pct, 1),
            "variacion_mom_abs": round(s_total - s_prev_total, 2),
            "transacciones": s_tx,
            "ticket_promedio": round(s_tkt, 2)
        })
    participacion_sucursales.sort(key=lambda x: x["total_ventas"], reverse=True)

    # 2. Participación y MoM por categoría
    participacion_categorias = []
    all_cat_names = set(list(category_totals_latest_month.keys()) + list(category_totals_prev_month.keys()))
    for c_name in sorted(all_cat_names):
        c_curr = category_totals_latest_month.get(c_name, {"total": 0.0, "unidades": 0.0})
        c_prev = category_totals_prev_month.get(c_name, {"total": 0.0, "unidades": 0.0})
        c_total = float(c_curr["total"])
        c_prev_total = float(c_prev["total"])
        share_pct = (c_total / total_latest * 100.0) if total_latest > 0 else 0.0
        c_mom_pct = ((c_total - c_prev_total) / c_prev_total * 100.0) if c_prev_total > 0 else (100.0 if c_total > 0 else 0.0)

        participacion_categorias.append({
            "categoria_nombre": c_name,
            "total_ventas": round(c_total, 2),
            "participacion_porcentaje": round(share_pct, 1),
            "variacion_mom_porcentaje": round(c_mom_pct, 1),
            "variacion_mom_abs": round(c_total - c_prev_total, 2),
            "unidades": round(c_curr["unidades"], 2)
        })
    participacion_categorias.sort(key=lambda x: x["total_ventas"], reverse=True)

    # 3. Participación y MoM por producto
    participacion_productos = []
    all_prod_names = set(list(product_totals_latest_month.keys()) + list(product_totals_prev_month.keys()))
    for p_name in sorted(all_prod_names):
        p_curr = product_totals_latest_month.get(p_name, {"total": 0.0, "unidades": 0.0})
        p_prev = product_totals_prev_month.get(p_name, {"total": 0.0, "unidades": 0.0})
        p_total = float(p_curr["total"])
        p_prev_total = float(p_prev["total"])
        share_pct = (p_total / total_latest * 100.0) if total_latest > 0 else 0.0
        p_mom_pct = ((p_total - p_prev_total) / p_prev_total * 100.0) if p_prev_total > 0 else (100.0 if p_total > 0 else 0.0)

        participacion_productos.append({
            "producto_nombre": p_name,
            "total_ventas": round(p_total, 2),
            "participacion_porcentaje": round(share_pct, 1),
            "variacion_mom_porcentaje": round(p_mom_pct, 1),
            "variacion_mom_abs": round(p_total - p_prev_total, 2),
            "unidades": round(p_curr["unidades"], 2)
        })
    participacion_productos.sort(key=lambda x: x["total_ventas"], reverse=True)

    return {
        "resumen_mom": {
            "periodo_actual": latest_month_key,
            "periodo_anterior": prev_month_key,
            "ingresos_actual": round(total_latest, 2),
            "ingresos_anterior": round(total_prev, 2),
            "diferencia_abs": round(diff_abs, 2),
            "diferencia_pct": round(diff_pct, 1),
            "transacciones_actual": tx_latest,
            "transacciones_anterior": tx_prev,
            "diferencia_tx_pct": round(diff_tx_pct, 1),
            "ticket_promedio_actual": round(tkt_latest, 2),
            "ticket_promedio_anterior": round(tkt_prev, 2),
            "diferencia_tkt_pct": round(diff_tkt_pct, 1)
        },
        "evolucion_mensual": evolution_list,
        "participacion_sucursales": participacion_sucursales,
        "participacion_categorias": participacion_categorias,
        "participacion_productos": participacion_productos[:25]
    }


