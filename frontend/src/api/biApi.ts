import client from './client';

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
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (sucursalId && sucursalId !== 'all') params.sucursal_id = sucursalId;

    const response = await client.get<BIPanelGeneralResponse>('/bi/panel-general', { params });
    return response.data;
};

export const getBISucursales = async (): Promise<BISucursalOption[]> => {
    const response = await client.get<BISucursalOption[]>('/bi/sucursales');
    return response.data;
};
