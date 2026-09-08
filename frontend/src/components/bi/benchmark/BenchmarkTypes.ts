export type StoreKey = 'consolidado' | 'heroinas' | 'recoleta' | 'calacoto';

export type MetricKey = 'ventas' | 'ordenes' | 'ticket' | 'unidades' | 'unidades_por_orden';

export type HorizonKey = '30dias' | '90dias' | '365dias';

export type RankingSortKey = 'rendimiento' | 'caida' | 'oportunidad';

export interface DayDetailData {
    day: number;
    dayOfWeek: string;
    dateStr: string;
    fullDateStr: string;
    sales: number;
    orders: number;
    ticketMedio: number;
    unidades: number;
    unidadesPorOrden: number;
    vsP50: number;
    status: 'critico' | 'bajo' | 'normal' | 'alto' | 'sin_ventas' | 'pronostico';
    posPct: number;
    horaPico: string;
    productoEstrella: string;
    equivalenteP50: number;
    vsEquivalentePct: number;
    causalFactor: string;
    isPronostico?: boolean;
    minSales?: number;
    maxSales?: number;
}

export interface StoreBenchmarkConfig {
    name: string;
    multiplier: number;
    percentiles: Record<MetricKey, { p25: number; p50: number; p75: number; unit: string; format: (val: number) => string }>;
}

export interface HourlyBenchmarkItem {
    hora: string;
    promedioHistorico: number;
    ventaHoy: number;
    variacionPct: number;
    status: 'alto' | 'normal' | 'bajo';
    isPico: boolean;
    isDebil: boolean;
}

export interface StoreRankingItem {
    id: StoreKey;
    nombre: string;
    ventaActual: number;
    p50Historico: number;
    variacionPct: number;
    status: 'alto' | 'normal' | 'bajo' | 'critico';
    statusEmoji: string;
    opportunityText: string;
}
