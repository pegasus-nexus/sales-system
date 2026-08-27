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

// Interfaces de la Sección 4: Clientes y Métodos de Pago (Clean Architecture)
export interface KPIClientesBI {
    ingresos_totales: number;
    total_tickets: number;
    ventas_nominadas_monto: number;
    ventas_nominadas_tickets: number;
    ventas_anonimas_monto: number;
    ventas_anonimas_tickets: number;
    top_cliente_nombre: string;
    top_cliente_monto: number;
}

export interface MetodoPagoItemBI {
    metodo: string;
    monto_neto: number;
    tickets_conteo: number;
    participacion_pct: number;
}

export interface TopClienteItemBI {
    cliente_id: string;
    nombre: string;
    nit_ci: string;
    compras_conteo: number;
    monto_total: number;
    participacion_pct: number;
}

export interface ResumenCreditoBI {
    total_cuentas_credito: number;
    saldo_total_cartera: number;
    cuentas_al_dia: number;
    cuentas_mora: number;
}

export interface BIClientesResponse {
    status: string;
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPIClientesBI;
    metodos_pago: MetodoPagoItemBI[];
    top_clientes: TopClienteItemBI[];
    resumen_credito: ResumenCreditoBI;
    trazabilidad: Record<string, unknown>;
}

// Interfaces de la Sección 5: Sucursales y Desempeño Operativo (Clean Architecture)
export interface KPISucursalesBI {
    ingresos_totales: number;
    total_tickets: number;
    ticket_medio_global: number;
    total_sucursales_activas_con_venta: number;
    sucursal_lider_nombre: string;
    sucursal_lider_ingresos: number;
    sucursal_mayor_ticket_medio_nombre: string;
    sucursal_mayor_ticket_medio_monto: number;
}

export interface SucursalDesempenoItemBI {
    sucursal_id: string;
    nombre: string;
    ciudad: string;
    direccion: string;
    is_active: boolean;
    tickets_conteo: number;
    ingresos_bs: number;
    ticket_medio: number;
    participacion_pct: number;
}

export interface BISucursalesDesempenoResponse {
    status: string;
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPISucursalesBI;
    sucursales: SucursalDesempenoItemBI[];
    trazabilidad: Record<string, unknown>;
}

// Interfaces de la Sección 6: Inventario, Stock y Valorización (Clean Architecture)
export interface KPIInventarioBI {
    total_unidades_stock: number;
    valorizacion_costo_total: number;
    skus_con_stock_disponible: number;
    skus_agotados: number;
    skus_stock_bajo: number;
    sucursal_mayor_inventario_nombre: string;
    sucursal_mayor_inventario_monto: number;
}

export interface SucursalInventarioItemBI {
    sucursal_id: string;
    nombre: string;
    ciudad: string;
    unidades_stock: number;
    skus_conteo: number;
    skus_agotados: number;
    valorizacion_costo: number;
}

export interface ProductoInventarioItemBI {
    producto_id: string;
    nombre: string;
    categoria_nombre: string;
    stock_actual: number;
    costo_unitario: number;
    valor_total_costo: number;
    estado_stock: string;
}

export interface BIInventarioControlResponse {
    status: string;
    fecha_consulta_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPIInventarioBI;
    desglose_sucursales: SucursalInventarioItemBI[];
    top_productos_inventario: ProductoInventarioItemBI[];
    trazabilidad: Record<string, unknown>;
}

// Interfaces de la Sección 7: Rentabilidad Teórica & Margen Bruto (Clean Architecture)
export interface KPIRentabilidadBI {
    ingresos_totales: number;
    costo_directo_total: number;
    margen_bruto_teorico_bs: number;
    margen_bruto_teorico_pct: number;
    total_lineas_procesadas: number;
    producto_mayor_margen_nombre: string;
    producto_mayor_margen_monto: number;
}

export interface CategoriaRentabilidadItemBI {
    categoria_nombre: string;
    ingresos_bs: number;
    costos_bs: number;
    margen_bruto_bs: number;
    margen_bruto_pct: number;
}

export interface ProductoRentabilidadItemBI {
    producto_id: string;
    nombre: string;
    categoria_nombre: string;
    unidades_vendidas: number;
    ingresos_bs: number;
    costos_bs: number;
    margen_bruto_bs: number;
    margen_bruto_pct: number;
}

export interface BIRentabilidadMargenResponse {
    status: string;
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPIRentabilidadBI;
    categorias: CategoriaRentabilidadItemBI[];
    top_productos: ProductoRentabilidadItemBI[];
    trazabilidad: Record<string, unknown>;
}

// Interfaces de la Sección 8: Descuentos y Promociones (Clean Architecture)
export interface KPIDescuentosBI {
    promociones_configuradas: number;
    promociones_activas: number;
    tickets_con_descuento: number;
    monto_total_descuentos_otorgados: number;
    promocion_mas_usada_nombre: string;
    promocion_mas_usada_monto: number;
}

export interface PromocionDetalleItemBI {
    promocion_id: string;
    nombre: string;
    tipo: string;
    valor: number;
    is_active: boolean;
    tickets_aplicados: number;
    monto_descuento_total: number;
}

export interface BIDescuentosImpactoResponse {
    status: string;
    fecha_consulta_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPIDescuentosBI;
    promociones: PromocionDetalleItemBI[];
    trazabilidad: Record<string, unknown>;
}

// Interfaces de la Sección 9: Productividad de Cajeros y Auditoría Operacional (Clean Architecture)
export interface KPIProductividadBI {
    ingresos_totales: number;
    total_tickets: number;
    cajeros_activos_con_venta: number;
    cajero_lider_nombre: string;
    cajero_lider_ingresos: number;
    cajero_mayor_ticket_medio_nombre: string;
    cajero_mayor_ticket_medio_monto: number;
    total_eventos_auditoria: number;
}

export interface CajeroProductividadItemBI {
    cajero_nombre: string;
    tickets_conteo: number;
    ingresos_bs: number;
    ticket_medio: number;
    participacion_pct: number;
}

export interface EventoAuditoriaItemBI {
    accion: string;
    total_eventos: number;
}

export interface BIProductividadDesempenoResponse {
    status: string;
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPIProductividadBI;
    cajeros: CajeroProductividadItemBI[];
    auditoria_eventos: EventoAuditoriaItemBI[];
    trazabilidad: Record<string, unknown>;
}

// Interfaces de la Sección 10: Resumen Ejecutivo Global Consolidado (Clean Architecture)
export interface KPIEjecutivoBI {
    ingresos_totales: number;
    costo_directo_total: number;
    margen_bruto_teorico_bs: number;
    margen_bruto_teorico_pct: number;
    total_tickets: number;
    ticket_medio: number;
    total_unidades_stock: number;
    valorizacion_costo_stock: number;
    promociones_configuradas: number;
    monto_total_descuentos: number;
    tickets_con_descuento: number;
    sucursal_lider_nombre: string;
    sucursal_lider_ingresos: number;
    cajero_lider_nombre: string;
    cajero_lider_ingresos: number;
}

export interface ResumenSucursalEjecutivoBI {
    sucursal_id: string;
    nombre: string;
    ingresos_bs: number;
    tickets_conteo: number;
    participacion_pct: number;
}

export interface BIEjecutivoResumenResponse {
    status: string;
    fecha_inicio_bolivia: string;
    fecha_fin_bolivia: string;
    timezone: string;
    ultima_actualizacion: string;

    kpis: KPIEjecutivoBI;
    sucursales: ResumenSucursalEjecutivoBI[];
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
    sucursalId?: string,
    options?: { signal?: AbortSignal }
): Promise<BIPanelGeneralResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId) params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIPanelGeneralResponse>(`/bi/panel-general${queryString}`, { signal: options?.signal });
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

export const getBIClientes = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string
): Promise<BIClientesResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIClientesResponse>(`/bi-clientes/clientes${queryString}`);
};

export const getBISucursalesDesempeno = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string
): Promise<BISucursalesDesempenoResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BISucursalesDesempenoResponse>(`/bi-sucursales/desempeno${queryString}`);
};

export const getBIInventarioControl = async (
    sucursalId?: string
): Promise<BIInventarioControlResponse> => {
    const params = new URLSearchParams();
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIInventarioControlResponse>(`/bi-inventario/control${queryString}`);
};

export const getBIRentabilidadMargen = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string
): Promise<BIRentabilidadMargenResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIRentabilidadMargenResponse>(`/bi-rentabilidad/margen${queryString}`);
};

export const getBIDescuentosImpacto = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string
): Promise<BIDescuentosImpactoResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIDescuentosImpactoResponse>(`/bi-descuentos/impacto${queryString}`);
};

export const getBIProductividadDesempeno = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string
): Promise<BIProductividadDesempenoResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId && sucursalId !== 'all') params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIProductividadDesempenoResponse>(`/bi-productividad/desempeno${queryString}`);
};

export const getBIEjecutivoResumen = async (
    startDate?: string,
    endDate?: string,
    sucursalId?: string,
    options?: { signal?: AbortSignal }
): Promise<BIEjecutivoResumenResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sucursalId) params.append('sucursal_id', sucursalId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client<BIEjecutivoResumenResponse>(`/bi-ejecutivo/resumen${queryString}`, { signal: options?.signal });
};

export const getBISucursales = async (): Promise<BISucursalOption[]> => {
    return client<BISucursalOption[]>('/bi/sucursales');
};

export const checkBIHealth = async (): Promise<{ status: string; module: string; timezone: string }> => {
    return client<{ status: string; module: string; timezone: string }>('/bi/health');
};

// --- INTERFACES Y FETCHERS BI IA / ANALÍTICA AVANZADA (AVANCE 13) ---
export interface BIAIForecastItem {
    horizon_step: number;
    prediccion_monto: number;
    lower_bound_95: number;
    upper_bound_95: number;
    confianza_pct: number;
    categoria_dato: string;
}

export interface BIAIForecastResponse {
    status: string;
    model_champion: string;
    backtesting_evaluated_days: number;
    metrics: {
        holt_winters: {
            mae: number;
            rmse: number;
            mape: number;
        }
    };
    sample_forecast_comparison: Array<{
        fecha: string;
        real_mongodb: number;
        prediccion_ml: number;
        error_bs: number;
    }>;
}

export interface BIAIProductDemandItem {
    producto_id: string;
    nombre: string;
    estado_ml: string;
    unidades_historicas: number;
    promedio_diario_unidades?: number;
    demanda_estimada_horizonte?: number;
    intervalo_confianza_95?: {
        limite_inferior: number;
        limite_superior: number;
    };
    horizonte_dias?: number;
    mensaje?: string;
}

export interface BIAIProductDemandResponse {
    status: string;
    horizon_days: number;
    total_skus_evaluados: number;
    skus_prediccion_confiable: number;
    skus_datos_insuficientes: number;
    productos: BIAIProductDemandItem[];
}

export interface BIAIAnomalyItem {
    fecha: string;
    tipo_anomalia: string;
    severidad: string;
    ingresos_reales_bs: number;
    tickets_reales: number;
    z_score_ingresos: number;
    z_score_tickets: number;
    explicacion_tecnica: string;
    categoria_dato: string;
}

export interface BIAIAnomalyResponse {
    status: string;
    total_days_analyzed: number;
    media_historica_ingresos: number;
    desviacion_estandar_ingresos: number;
    total_anomalies_found: number;
    anomalies_summary: BIAIAnomalyItem[];
}

export const getBIAIForecast = async (horizonDays: number = 14): Promise<BIAIForecastResponse> => {
    return client<BIAIForecastResponse>(`/bi-ai/forecast?horizon_days=${horizonDays}`);
};

export const getBIAIProductDemand = async (horizonDays: number = 7): Promise<BIAIProductDemandResponse> => {
    return client<BIAIProductDemandResponse>(`/bi-ai/product-demand?horizon_days=${horizonDays}`);
};

export const getBIAIAnomalies = async (thresholdZScore: number = 2.0): Promise<BIAIAnomalyResponse> => {
    return client<BIAIAnomalyResponse>(`/bi-ai/anomalies?threshold_zscore=${thresholdZScore}`);
};
