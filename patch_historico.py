'
import os

path = "backend/app/application/services/compra_service.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

# Replace the item processing loop
target = """                # 3. Procesar cada A-tem recibido (Inventario, KArdex, Precios)
                for item in reception.detalles:
                    if reception.es_historico:
                        continue

                    # Fix Bug 2: Resolver almacen_id real de la sucursal"""

replacement = """                # 3. Procesar cada item recibido (Inventario, KArdex, Precios)
                for item in reception.detalles:
                    # Fix Bug 2: Resolver almacen_id real de la sucursal"""

data = data.replace(target.replace("A-", "í").replace("A", "á"), replacement.replace("A", "á"))

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Removed continue for es_historico")
'
