import os

path = 'frontend/src/hooks/useCaja.ts'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target1 = '''export interface CajaGastoCategoria {
    _id?: string;
    tenant_id: string;
    nombre: string;
    descripcion?: string;
    icono: string;
}'''

replacement1 = '''export interface CajaGastoCategoria {
    _id?: string;
    tenant_id: string;
    nombre: string;
    descripcion?: string;
    icono: string;
    partida?: string;
    padre_id?: string;
}'''
data = data.replace(target1, replacement1)

target2 = '''export interface GastoIn {
    monto: number;
    descripcion: string;
    categoria_id?: string;
}'''

replacement2 = '''export interface GastoIn {
    monto: number;
    descripcion?: string;
    categoria_id?: string;
    subcategoria_id?: string;
}'''
data = data.replace(target2, replacement2)

target3 = '''export interface CategoriaGastoIn {
    nombre: string;
    descripcion?: string;
    icono?: string;
}'''

replacement3 = '''export interface CategoriaGastoIn {
    nombre: string;
    descripcion?: string;
    icono?: string;
    partida?: string;
    padre_id?: string;
}'''
data = data.replace(target3, replacement3)

target4 = '''export interface CajaMovimiento {
    _id: string;
    sesion_id: string;
    subtipo: 'APERTURA' | 'VENTA_EFECTIVO' | 'VENTA_QR' | 'VENTA_TARJETA' | 'CAMBIO' | 'GASTO' | 'AJUSTE' | 'INGRESO_EFECTIVO' | 'INGRESO_QR' | 'INGRESO_TARJETA';
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    descripcion: string;
    cajero_name: string;
    categoria_id?: string;
    sale_id?: string;
    fecha: string;
}'''

replacement4 = '''export interface CajaMovimiento {
    _id: string;
    sesion_id: string;
    subtipo: 'APERTURA' | 'VENTA_EFECTIVO' | 'VENTA_QR' | 'VENTA_TARJETA' | 'CAMBIO' | 'GASTO' | 'AJUSTE' | 'INGRESO_EFECTIVO' | 'INGRESO_QR' | 'INGRESO_TARJETA';
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    descripcion?: string;
    cajero_name: string;
    categoria_id?: string;
    subcategoria_id?: string;
    sale_id?: string;
    fecha: string;
}'''
data = data.replace(target4, replacement4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("useCaja interfaces updated.")
