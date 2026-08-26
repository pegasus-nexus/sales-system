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

// Interfaces de la Sección 2: Comparativas Históricas
export interface PeriodoMetricBI {
    start_date: string;
    end_date: string;
    ingresos: number;
    ordenes: number;
    ticket_medio: number;
}

export interface VariacionMetricBI {
    diferencia_ingresos: number;
    variacion_ingresos_pct: number | null;
    estado_ingresos: string;

    diferencia_ordenes: number;
    variacion_ordenes_pct: number | null;
    estado_ordenes: string;

    diferencia_ticket: number;
    variacion_ticket_pct: number | null;
    estado_ticket: string;
}

export interface SerieTiempoItemBI {
    fecha_bolivia: string;
    dia_semana: string;
    ingresos: number;
    ordenes: number;
    ticket_medio: number;
}

export interface DesgloseSucursalComparativaBI {
    sucursal_id: string;
    nombre_sucursal: string;
    ingresos_actual: number;
    ingresos_comparativo: number;
    variacion_ingresos_pct: number | null;
    ordenes_actual: number;
    ordenes_comparativo: number;
    variacion_ordenes_pct: number | null;
    ticket_medio_actual: number;
    ticket_medio_comparativo: number;
}

export interface BIComparativaResponse {
    status: string;
    timezone: string;
    modo_comparativo: string;
    ultima_actualizacion: string;

    periodo_actual: PeriodoMetricBI;
    periodo_comparativo: PeriodoMetricBI;
    variaciones: VariacionMetricBI;

    serie_actual: SerieTiempoItemBI[];
    serie_comparativa: SerieTiempoItemBI[];
    desglose_sucursales: DesgloseSucursalComparativaBI[];
    fuente: Record<string, unknown>;
}

// Interfaces de la Sección 3: Productos y Categorías (Clean Architecture)
export interface KPIProductosBI {
    producto_mas_vendido: string;
    unidades_producto_mas_vendido: number;
    producto_mayor_recaudacion: string;
    ingresos_producto_mayor_recaudacion: number;
    skus_distintos: number;
    unidades_promedio_por_ticket: number;
}

export interface TopProductoItemBI {
    producto_id: string;
    nombre: string;
    categoria_id: string;
    categoria_nombre: string;
    unidades_vendidas: number;
    ingresos_bs: number;
    precio_promedio_efectivo: number;
    participacion_pct: number;
}

export interface CategoriaProductosItemBI {
    categoria_id: string;
    categoria_nombre: string;
    unidades_vendidas: number;
    ingresos_bs: number;
    participacion_pct: number;
}

export interface BIProductosResponse {
    status: string;
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPIProductosBI;
    top_productos: TopProductoItemBI[];
    categorias: CategoriaProductosItemBI[];
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

export const getBIComparativas = async (
    startDate?: string,
    endDate?: string,
    compararContra: string = 'ayer',
    sucursalId?: string
): Promise<BIComparativaResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('comparar_contra', compararContra);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIComparativaResponse>(`/bi/comparativas${queryString}`);
};

export const getBIProductos = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string
): Promise<BIProductosResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIProductosResponse>(`/bi-productos/productos${queryString}`);
};

export const getBISucursales = async (): Promise<BISucursalOption[]> => {
    return client<BISucursalOption[]>('/bi/sucursales');
};

export const checkBIHealth = async (): Promise<{ status: string; module: string; timezone: string }> => {
    return client<{ status: string; module: string; timezone: string }>('/bi/health');
};
