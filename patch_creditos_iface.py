import os
import re

path = 'frontend/src/pages/CreditosPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''export interface Deuda {
    id: string;
    sale_id_corto: string;
    estado: string;
    fecha_emision: string;
    monto_original: number;
    saldo_pendiente: number;
}'''

replacement = '''export interface Deuda {
    id: string;
    sale_id_corto: string;
    numero_ticket?: string;
    resumen_items?: string;
    estado: string;
    fecha_emision: string;
    monto_original: number;
    saldo_pendiente: number;
}'''

data = data.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("Deuda interface patched")
