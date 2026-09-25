import { client } from './client';

export interface ConteoItem {
    producto_id: string;
    codigo_corto?: string;
    descripcion?: string;
    categoria_id?: string;
    categoria_nombre?: string;
    proveedores?: string[];
    stock_sistema: number;
    stock_fisico: number | null;
    diferencia: number;
    costo_unitario: number;
    valor_diferencia: number;
}

export interface ConteoFisico {
    id: string;
    tenant_id: string;
    sucursal_id: string;
    estado: 'BORRADOR' | 'FINALIZADO';
    fecha_inicio: string;
    fecha_cierre?: string;
    creado_por: string;
    creado_por_nombre?: string;
    notas?: string;
    items: ConteoItem[];
}

export interface ConteoListInfo {
    id: string;
    tenant_id: string;
    sucursal_id: string;
    estado: 'BORRADOR' | 'FINALIZADO';
    fecha_inicio: string;
    fecha_cierre?: string;
    creado_por_nombre?: string;
    notas?: string;
    total_items: number;
    total_diferencia_items: number;
    total_diferencia_monetaria: number;
}

export const getConteos = (sucursal_id?: string) => {
    const params = new URLSearchParams();
    if (sucursal_id) params.append('sucursal_id', sucursal_id);
    return client<ConteoListInfo[]>(`/conteos-fisicos?${params.toString()}`);
};

export const iniciarConteo = (sucursal_id: string, notas?: string) => {
    return client<ConteoFisico>(`/conteos-fisicos/iniciar`, {
        method: 'POST',
        body: { sucursal_id, notas }
    });
};

export const getConteo = (conteo_id: string) => {
    return client<ConteoFisico>(`/conteos-fisicos/${conteo_id}`);
};

export const guardarProgresoConteo = (conteo_id: string, items: ConteoItem[], notas?: string) => {
    return client<ConteoFisico>(`/conteos-fisicos/${conteo_id}`, {
        method: 'PUT',
        body: { items, notas }
    });
};

export const finalizarConteo = (conteo_id: string) => {
    return client<ConteoFisico>(`/conteos-fisicos/${conteo_id}/finalizar`, {
        method: 'POST'
    });
};
