import os

path = "backend/app/api/v1/endpoints/reports.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """    desglose_salidas = {}"""
replacement = """    desglose_salidas = {}
    detalles_anomalias = []"""
data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("reports.py detalles_anomalias successfully patched")
