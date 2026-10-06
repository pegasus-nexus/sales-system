import os
import re

path = 'backend/app/api/v1/endpoints/reports.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# We need to fetch detailed anomaly logs
target1 = '''    logs_pipeline = [
        {"": inv_query},
        {
            "": {
                "_id": "",
                "cantidad": {"": ""},
                "valor_costo": {"": {"": ["", {"": ""}]}}
            }
        }
    ]
    cursor_logs = InventoryLog.get_pymongo_collection().aggregate(logs_pipeline)
    raw_logs = await cursor_logs.to_list(length=100)  # Tipos de movimiento son pocos'''

replacement1 = '''    logs_pipeline = [
        {"": inv_query},
        {
            "": {
                "_id": "",
                "cantidad": {"": ""},
                "valor_costo": {"": {"": ["", {"": ""}]}}
            }
        }
    ]
    cursor_logs = InventoryLog.get_pymongo_collection().aggregate(logs_pipeline)
    raw_logs = await cursor_logs.to_list(length=100)
    
    # Extraer detalles específicos para auditoría (anomalías)
    anomaly_query = inv_query.copy()
    anomaly_query["tipo_movimiento"] = {"": ["AJUSTE_FISICO", "SALIDA_MANUAL", "ENTRADA_MANUAL", "ANULACION"]}
    anomaly_pipeline = [
        {"": anomaly_query},
        {"": {"created_at": -1}},
        {"": 300},
        {
            "": {
                "_id": {"": ""},
                "tipo_movimiento": 1,
                "producto": "",
                "cantidad_movida": 1,
                "costo_total": {"": ["", {"": ""}]},
                "fecha": "",
                "usuario_id": 1
            }
        }
    ]
    cursor_anomalies = InventoryLog.get_pymongo_collection().aggregate(anomaly_pipeline)
    raw_anomalies = await cursor_anomalies.to_list(length=300)
    
    # Format anomalies for JSON serialization
    detalles_anomalias = []
    for a in raw_anomalies:
        detalles_anomalias.append({
            "id": a["_id"],
            "tipo": a["tipo_movimiento"],
            "producto": a["producto"],
            "cantidad": float(a["cantidad_movida"]),
            "costo": float(a["costo_total"]),
            "fecha": a["fecha"].isoformat() if hasattr(a["fecha"], "isoformat") else str(a["fecha"]),
            "usuario_id": a.get("usuario_id", "Sistema")
        })'''

data = data.replace(target1, replacement1)

target2 = '''        "desglose_ingresos": desglose_ingresos,
        "desglose_salidas": desglose_salidas
    }'''

replacement2 = '''        "desglose_ingresos": desglose_ingresos,
        "desglose_salidas": desglose_salidas,
        "detalles_anomalias": detalles_anomalias
    }'''

data = data.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Backend reports.py patched for anomalies.")
