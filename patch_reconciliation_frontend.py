import os

path = 'frontend/src/components/InventoryReconciliationView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target_iface = '''interface ReconciliationData {
    inventario_inicial_costo: number;
    revalorizacion_costos: number;
    ingresos_inventario_costo: number;
    salidas_mermas_costo: number;
    costo_ventas: number;
    ventas_netas: number;
    ganancia_bruta: number;
    inventario_final_costo: number;
}'''

replacement_iface = '''interface ReconciliationData {
    inventario_inicial_costo: number;
    revalorizacion_costos: number;
    ingresos_inventario_costo: number;
    salidas_mermas_costo: number;
    costo_ventas: number;
    ventas_netas: number;
    ventas_promocion?: number;
    ventas_regulares?: number;
    ganancia_bruta: number;
    inventario_final_costo: number;
    desglose_ingresos?: Record<string, number>;
    desglose_salidas?: Record<string, number>;
}'''

data = data.replace(target_iface, replacement_iface)

target_link = '''import { useSearchParams } from 'react-router-dom';'''
replacement_link = '''import { useSearchParams, Link } from 'react-router-dom';'''
data = data.replace(target_link, replacement_link)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
