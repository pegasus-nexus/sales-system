import { client } from './client';

export interface DesgloseSucursalBI {
    sucursal_id: string;
    nombre_sucursal: string;
    ingresos: number;
    ordenes: number;
    ticket_medio: number;
}

export interface HourlyDistributionItemBI {
    hora: number;
    rango: string;
    ingresos: number;
    ordenes: number;
}

export interface BIPanelGeneralResponse {
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    estado_sincronizacion: string;
    ultima_actualizacion: string;
    ingresos_totales: number;
    cantidad_ordenes: number;
    ticket_medio: number;
    desglose_sucursales: DesgloseSucursalBI[];
    ventas_por_hora: HourlyDistributionItemBI[];
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
