import { client } from './client';

export interface DesgloseSucursalBI {
    sucursal_id: string;
    nombre_sucursal: string;
    ingresos: number;
    ordenes: number;
    ticket_medio: number;
    participacion_pct: number;
}

export interface HourlyDistributionItemBI {
    hora: number;
    rango: string;
    ingresos: number;
    ordenes: number;
}

export interface VentaRecienteBI {
    ticket_id: string;
    numero_ticket: string;
    hora_bolivia: string;
    nombre_sucursal: string;
    total_neto: number;
    estado_pago: string;
}

export interface ResumenOperativoBI {
    sucursal_lider: string;
    mejor_hora: string;
    promedio_por_hora: number;
    ultima_venta_hora: string;
}

export interface AlertaOperativaBI {
    tipo: 'info' | 'warning' | 'error';
    titulo: string;
    mensaje: string;
}

export interface BIPanelGeneralResponse {
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    estado_sincronizacion: string;
    ultima_actualizacion: string;
    modo: string;

    ingresos_totales: number;
    cantidad_ordenes: number;
    ticket_medio: number;

    desglose_sucursales: DesgloseSucursalBI[];
    ventas_por_hora: HourlyDistributionItemBI[];
    ventas_recientes: VentaRecienteBI[];
    resumen_operativo: ResumenOperativoBI;
    alertas_operativas: AlertaOperativaBI[];

    trazabilidad: Record<string, unknown>;
}

export interface BISucursalOption {
    sucursal_id: string;
    nombre: string;
    ciudad: string;
    direccion: string;
}

export const getBIPanelGeneral = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string
): Promise<BIPanelGeneralResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIPanelGeneralResponse>(`/bi/panel-general${queryString}`);
};

export const getBISucursales = async (): Promise<BISucursalOption[]> => {
    return client<BISucursalOption[]>('/bi/sucursales');
};

export const checkBIHealth = async (): Promise<{ status: string; module: string; timezone: string }> => {
    return client<{ status: string; module: string; timezone: string }>('/bi/health');
};
