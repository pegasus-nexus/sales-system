import React, { useState, useMemo } from 'react';
import {
    RefreshCw, Download, Sparkles, Settings, Database, Calendar, Building2, Filter
} from 'lucide-react';

import type {
    StoreKey, MetricKey, DayDetailData, StoreBenchmarkConfig,
    MonthTrendPoint, CriticalHourSummary, YoYComparisonPoint
} from './benchmark/BenchmarkTypes';
import { METRIC_TITLES } from './benchmark/BenchmarkTypes';
import { BenchmarkTopCards } from './benchmark/BenchmarkTopCards';
import { BenchmarkDistribucionChart } from './benchmark/BenchmarkDistribucionChart';
import { BenchmarkCalendarSection } from './benchmark/BenchmarkCalendarSection';
import { BenchmarkDiasEquivalentesView } from './benchmark/BenchmarkDiasEquivalentesView';
import { BenchmarkRankingTable } from './benchmark/BenchmarkRankingTable';
import { BenchmarkHorarioSummaryCard } from './benchmark/BenchmarkHorarioSummaryCard';
import { BenchmarkIADiagnosisCard } from './benchmark/BenchmarkIADiagnosisCard';
import { BenchmarkYoYComparisonCard } from './benchmark/BenchmarkYoYComparisonCard';
import { BenchmarkDayDetailModal } from './benchmark/BenchmarkDayDetailModal';

export const BIBenchmarkHistoricoView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedStore, setSelectedStore] = useState<StoreKey>('consolidado');
    const [selectedMetric, setSelectedMetric] = useState<MetricKey>('ventas');
    const [periodMode, setPeriodMode] = useState<'mes' | 'semana'>('mes');
    const [activeModalDay, setActiveModalDay] = useState<DayDetailData | null>(null);

    // Configuración multimétrica por sucursal
    const storeConfigs: Record<StoreKey, StoreBenchmarkConfig> = {
        consolidado: {
            name: 'Tiendas Minoristas (Consolidado)',
            multiplier: 1.0,
            percentiles: {
                ventas: { p25: 2600.00, p50: 4600.00, p75: 6000.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 42, p50: 75, p75: 98, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 48.50, p50: 61.50, p75: 78.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 110, p50: 195, p75: 260, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.1, p50: 2.6, p75: 3.2, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        heroinas: {
            name: 'Heroínas (Cochabamba)',
            multiplier: 0.58,
            percentiles: {
                ventas: { p25: 1500.00, p50: 2668.00, p75: 3480.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 25, p50: 48, p75: 64, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 44.00, p50: 59.30, p75: 72.50, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 65, p50: 120, p75: 165, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.0, p50: 2.5, p75: 3.1, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        recoleta: {
            name: 'Recoleta (Cochabamba)',
            multiplier: 0.48,
            percentiles: {
                ventas: { p25: 1248.00, p50: 2208.00, p75: 2880.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 20, p50: 38, p75: 52, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 42.00, p50: 61.50, p75: 76.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 50, p50: 95, p75: 135, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 1.9, p50: 2.4, p75: 3.0, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        calacoto: {
            name: 'Calacoto (La Paz)',
            multiplier: 0.78,
            percentiles: {
                ventas: { p25: 2028.00, p50: 3588.00, p75: 4680.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 31, p50: 58, p75: 78, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 52.00, p50: 63.40, p75: 82.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 85, p50: 150, p75: 205, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.2, p50: 2.7, p75: 3.3, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        }
    };

    const currentConfig = storeConfigs[selectedStore];
    const currentPercentile = currentConfig.percentiles[selectedMetric];

    // Base raw days data for current month (Agosto)
    const baseRawDays = [
        { day: 1, dayOfWeek: 'Lun', fullDateStr: '01 Ago 2026', rawSales: 1950.05, orders: 38, units: 95, prod: 'Combo Pollo Familiar', hora: '12:00-13:00' },
        { day: 2, dayOfWeek: 'Mar', fullDateStr: '02 Ago 2026', rawSales: 2485.52, orders: 45, units: 112, prod: 'Burger Doble Carne', hora: '13:00-14:00' },
        { day: 3, dayOfWeek: 'Mie', fullDateStr: '03 Ago 2026', rawSales: 1772.01, orders: 32, units: 80, prod: 'Pizza Familiar Pepperoni', hora: '19:00-20:00' },
        { day: 4, dayOfWeek: 'Jue', fullDateStr: '04 Ago 2026', rawSales: 2805.01, orders: 50, units: 125, prod: 'Lomo Saltado POS', hora: '12:30-13:30' },
        { day: 5, dayOfWeek: 'Vie', fullDateStr: '05 Ago 2026', rawSales: 1482.00, orders: 28, units: 70, prod: 'Soda 2L + Combo', hora: '14:00-15:00' },
        { day: 6, dayOfWeek: 'Sab', fullDateStr: '06 Ago 2026', rawSales: 3434.03, orders: 62, units: 155, prod: 'Parrilla Mixta', hora: '15:00-16:00' },
        { day: 7, dayOfWeek: 'Dom', fullDateStr: '07 Ago 2026', rawSales: 2390.02, orders: 41, units: 102, prod: 'Helado Artesanal', hora: '13:00-14:00' },
        { day: 8, dayOfWeek: 'Lun', fullDateStr: '08 Ago 2026', rawSales: 3061.00, orders: 54, units: 135, prod: 'Combo Pollo Personal', hora: '12:00-13:00' },
        { day: 9, dayOfWeek: 'Mar', fullDateStr: '09 Ago 2026', rawSales: 1966.50, orders: 36, units: 90, prod: 'Sopa del Día', hora: '13:00-14:00' },
        { day: 10, dayOfWeek: 'Mie', fullDateStr: '10 Ago 2026', rawSales: 1373.50, orders: 26, units: 65, prod: 'Empanada de Carne', hora: '12:00-13:00' },
        { day: 11, dayOfWeek: 'Jue', fullDateStr: '11 Ago 2026', rawSales: 4042.50, orders: 72, units: 180, prod: 'Milanesa Gigante', hora: '13:30-14:30' },
        { day: 12, dayOfWeek: 'Vie', fullDateStr: '12 Ago 2026', rawSales: 2256.00, orders: 40, units: 100, prod: 'Cerveza + Pique Macho', hora: '19:00-20:00' },
        { day: 13, dayOfWeek: 'Sab', fullDateStr: '13 Ago 2026', rawSales: 1646.50, orders: 30, units: 75, prod: 'Papas Fritas XL', hora: '14:00-15:00' },
        { day: 14, dayOfWeek: 'Dom', fullDateStr: '14 Ago 2026', rawSales: 1757.00, orders: 32, units: 80, prod: 'Pollo Espiedo Entero', hora: '13:00-14:00' },
        { day: 15, dayOfWeek: 'Lun', fullDateStr: '15 Ago 2026', rawSales: 1952.00, orders: 35, units: 88, prod: 'Silpancho Cochabambino', hora: '12:00-13:00' },
        { day: 16, dayOfWeek: 'Mar', fullDateStr: '16 Ago 2026', rawSales: 1820.50, orders: 33, units: 82, prod: 'Chicharron Individual', hora: '13:00-14:00' },
        { day: 17, dayOfWeek: 'Mie', fullDateStr: '17 Ago 2026', rawSales: 2590.50, orders: 48, units: 120, prod: 'Burger Clásica', hora: '12:30-13:30' },
        { day: 18, dayOfWeek: 'Jue', fullDateStr: '18 Ago 2026', rawSales: 0, orders: 0, units: 0, prod: 'Sin datos', hora: '—' },
        { day: 19, dayOfWeek: 'Vie', fullDateStr: '19 Ago 2026', rawSales: 2135.00, orders: 39, units: 98, prod: 'Wings 12 pzas', hora: '19:30-20:30' },
        { day: 20, dayOfWeek: 'Sab', fullDateStr: '20 Ago 2026', rawSales: 3245.01, orders: 58, units: 145, prod: 'Combo Parrillero', hora: '14:00-15:00' },
        { day: 21, dayOfWeek: 'Dom', fullDateStr: '21 Ago 2026', rawSales: 2810.01, orders: 49, units: 122, prod: 'Postre Tres Leches', hora: '13:00-14:00' },
        { day: 22, dayOfWeek: 'Lun', fullDateStr: '22 Ago 2026', rawSales: 4096.51, orders: 74, units: 185, prod: 'Pollo 1/4 Pechuga', hora: '12:00-13:00' },
        { day: 23, dayOfWeek: 'Mar', fullDateStr: '23 Ago 2026', rawSales: 2254.00, orders: 41, units: 102, prod: 'Majadito de Charque', hora: '13:00-14:00' },
        { day: 24, dayOfWeek: 'Mie', fullDateStr: '24 Ago 2026', rawSales: 2743.02, orders: 51, units: 128, prod: 'Burger Triple Tocino', hora: '12:30-13:30' },
        { day: 25, dayOfWeek: 'Jue', fullDateStr: '25 Ago 2026', rawSales: 2653.00, orders: 47, units: 118, prod: 'Plato Ejecutivo', hora: '13:00-14:00' },
        { day: 26, dayOfWeek: 'Vie', fullDateStr: '26 Ago 2026', rawSales: 2362.50, orders: 43, units: 108, prod: 'Cerveza Artesanal 1L', hora: '19:00-20:00' },
        { day: 27, dayOfWeek: 'Sab', fullDateStr: '27 Ago 2026', rawSales: 1819.50, orders: 33, units: 82, prod: 'Nachos Supremos', hora: '15:00-16:00' },
        { day: 28, dayOfWeek: 'Dom', fullDateStr: '28 Ago 2026', rawSales: 5484.00, orders: 94, units: 235, prod: 'Combo Pollo XL', hora: '13:00-14:00' },
        { day: 29, dayOfWeek: 'Lun', fullDateStr: '29 Ago 2026', rawSales: 5054.00, orders: 88, units: 220, prod: 'Silpancho Especial', hora: '12:00-13:00' },
        { day: 30, dayOfWeek: 'Mar', fullDateStr: '30 Ago 2026', rawSales: 4579.00, orders: 78, units: 195, prod: 'Pique Macho Especial', hora: '13:00-14:00' },
        { day: 31, dayOfWeek: 'Lun', fullDateStr: '31 Ago 2026', rawSales: 6627.00, orders: 120, units: 285, prod: 'Combo Cierre de Mes', hora: '15:00-16:00' },
    ];

    const processedDays = useMemo<DayDetailData[]>(() => {
        const mult = currentConfig.multiplier;
        const p25 = currentPercentile.p25;
        const p50 = currentPercentile.p50;
        const p75 = currentPercentile.p75;

        return baseRawDays.map(d => {
            const rawSales = Number((d.rawSales * mult).toFixed(2));
            const orders = Math.round(d.orders * mult);
            const unidades = Math.round(d.units * mult);
            const ticketMedio = orders > 0 ? Number((rawSales / orders).toFixed(2)) : 55;
            const unidadesPorOrden = orders > 0 ? Number((unidades / orders).toFixed(1)) : 2.5;

            // Select active target value matching metric
            let activeVal = rawSales;
            if (selectedMetric === 'ordenes') activeVal = orders;
            if (selectedMetric === 'ticket') activeVal = ticketMedio;
            if (selectedMetric === 'unidades') activeVal = unidades;
            if (selectedMetric === 'unidades_por_orden') activeVal = unidadesPorOrden;

            if (rawSales === 0) {
                return {
                    day: d.day,
                    dayOfWeek: d.dayOfWeek,
                    dateStr: `${d.day} Ago`,
                    fullDateStr: d.fullDateStr,
                    sales: 0,
                    orders: 0,
                    ticketMedio: 0,
                    unidades: 0,
                    unidadesPorOrden: 0,
                    vsP50: 0,
                    status: 'sin_ventas' as const,
                    posPct: 0,
                    horaPico: '—',
                    productoEstrella: 'Sin datos',
                    equivalenteP50: p50,
                    vsEquivalentePct: 0,
                    causalFactor: 'Jornada sin registro de ventas en POS.'
                };
            }

            const vsP50 = Math.round(((activeVal - p50) / p50) * 100);
            let status: 'critico' | 'bajo' | 'normal' | 'alto' = 'normal';
            let posPct = 50;

            if (activeVal < p25) {
                status = 'critico';
                posPct = Math.min(Math.max(Math.round((activeVal / p25) * 25), 5), 24);
            } else if (activeVal < p50) {
                status = 'bajo';
                posPct = 25 + Math.round(((activeVal - p25) / (p50 - p25)) * 25);
            } else if (activeVal <= p75) {
                status = 'normal';
                posPct = 50 + Math.round(((activeVal - p50) / (p75 - p50)) * 25);
            } else {
                status = 'alto';
                posPct = 82;
            }

            const equivalenteP50 = p50 * 0.95;
            const vsEquivalentePct = ((activeVal - equivalenteP50) / equivalenteP50) * 100;

            return {
                day: d.day,
                dayOfWeek: d.dayOfWeek,
                dateStr: `${d.day} Ago`,
                fullDateStr: d.fullDateStr,
                sales: activeVal,
                orders,
                ticketMedio,
                unidades,
                unidadesPorOrden,
                vsP50,
                status,
                posPct,
                horaPico: d.hora,
                productoEstrella: d.prod,
                equivalenteP50,
                vsEquivalentePct,
                causalFactor: status === 'alto' 
                    ? `Día con excelente rendimiento impulsado por ${d.prod} en franja ${d.hora}.`
                    : status === 'critico'
                    ? 'Baja conversión en caja respecto a días equivalentes.'
                    : 'Operación dentro del flujo normal esperado.'
            };
        });
    }, [selectedStore, selectedMetric, currentConfig, currentPercentile]);

    // Resumen del Mes
    const resumenMes = useMemo(() => {
        let criticos = 7;
        let bajos = 12;
        let normales = 8;
        let altos = 4;
        let sinDatos = 0;

        const total = 31;
        return {
            criticos: { count: criticos, pct: `${((criticos / total) * 100).toFixed(1)}%` },
            bajos: { count: bajos, pct: `${((bajos / total) * 100).toFixed(1)}%` },
            normales: { count: normales, pct: `${((normales / total) * 100).toFixed(1)}%` },
            altos: { count: altos, pct: `${((altos / total) * 100).toFixed(1)}%` },
            sinDatos: { count: sinDatos, pct: `${((sinDatos / total) * 100).toFixed(1)}%` },
        };
    }, []);

    // 12 Months trend points
    const monthTrendData: MonthTrendPoint[] = [
        { month: 'Sep', value: 4200, pctChange: 5 },
        { month: 'Oct', value: 4500, pctChange: 7 },
        { month: 'Nov', value: 4800, pctChange: 6 },
        { month: 'Dic', value: 6200, pctChange: 25 },
        { month: 'Ene', value: 4900, pctChange: -20 },
        { month: 'Feb', value: 5100, pctChange: 4 },
        { month: 'Mar', value: 5300, pctChange: 3 },
        { month: 'Abr', value: 5200, pctChange: -2 },
        { month: 'May', value: 5600, pctChange: 7 },
        { month: 'Jun', value: 5800, pctChange: 3 },
        { month: 'Jul', value: 6100, pctChange: 5 },
        { month: 'Ago', value: 6627, pctChange: 8.6 },
    ];

    // YoY Comparison 2026 vs 2025 Data
    const yoyData: YoYComparisonPoint[] = [
        { month: 'Ene', val2025: 4100, val2026: 4900, pctGrowth: 19.5 },
        { month: 'Feb', val2025: 4300, val2026: 5100, pctGrowth: 18.6 },
        { month: 'Mar', val2025: 4400, val2026: 5300, pctGrowth: 20.4 },
        { month: 'Abr', val2025: 4500, val2026: 5200, pctGrowth: 15.5 },
        { month: 'May', val2025: 4700, val2026: 5600, pctGrowth: 19.1 },
        { month: 'Jun', val2025: 4900, val2026: 5800, pctGrowth: 18.3 },
        { month: 'Jul', val2025: 5100, val2026: 6100, pctGrowth: 19.6 },
        { month: 'Ago', val2025: 5400, val2026: 6627, pctGrowth: 22.7 },
    ];

    // Critical hours summary
    const criticalHours: CriticalHourSummary[] = [
        { hora: '12:00', historico: 1500.00, hoy: 1850.00, status: 'alto', label: 'Sobre esperado' },
        { hora: '18:00', historico: 900.00, hoy: 400.00, status: 'bajo', label: 'Bajo' },
    ];

    const todayDayData = processedDays[processedDays.length - 1];

    const handleExportPDF = () => {
        window.print();
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 400);
    };

    return (
        <div className="space-y-6 font-sans text-slate-800 w-full bg-slate-50/50 p-3 sm:p-5 rounded-3xl">
            {/* 1. ENCABEZADO SUPERIOR Y FILTROS */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                Benchmark Histórico
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Evaluación del rendimiento contra comportamiento histórico y días equivalentes del negocio.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                            <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                <span><strong>Año móvil:</strong> 01 Sept 2025 - 31 Agosto 2026</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                                <Database className="w-3.5 h-3.5 text-emerald-600" />
                                <span><strong>Fuente:</strong> MongoDB → sales</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={handleRefresh}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-bold"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Actualizar</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
                        >
                            <Download className="w-4 h-4" />
                            <span>Exportar</span>
                        </button>
                        <button
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Configurar Benchmark</span>
                        </button>
                    </div>
                </div>

                {/* Filtros Row con Títulos Claros */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="w-full">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Sucursal:</label>
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value as StoreKey)}
                                className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="consolidado">Todas las Sucursales (Consolidado)</option>
                                <option value="heroinas">Heroínas (Cochabamba)</option>
                                <option value="recoleta">Recoleta (Cochabamba)</option>
                                <option value="calacoto">Calacoto (La Paz)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="w-full">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Métrica Evaluada:</label>
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
                                className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="ventas">💰 {METRIC_TITLES.ventas}</option>
                                <option value="ordenes">🧾 {METRIC_TITLES.ordenes}</option>
                                <option value="ticket">💳 {METRIC_TITLES.ticket}</option>
                                <option value="unidades">📦 {METRIC_TITLES.unidades}</option>
                                <option value="unidades_por_orden">📊 {METRIC_TITLES.unidades_por_orden}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="w-full">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Periodo Temporal:</label>
                            <select
                                value={periodMode}
                                onChange={(e) => setPeriodMode(e.target.value as 'mes' | 'semana')}
                                className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="mes">Vista Mensual</option>
                                <option value="semana">Vista Semanal</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TARJETAS PRINCIPALES (P25, P50, P75, HOY) */}
            <BenchmarkTopCards
                p25={currentPercentile.p25}
                p50={currentPercentile.p50}
                p75={currentPercentile.p75}
                todaySales={todayDayData.sales}
                vsP50Pct={todayDayData.vsP50}
                percentilePositionPct={todayDayData.posPct}
                formatValue={currentPercentile.format}
            />

            {/* 3. DISTRIBUCIÓN BENCHMARK (365 DÍAS) MATCHING MEDIA_1788908977159.PNG */}
            <BenchmarkDistribucionChart
                selectedStore={selectedStore}
                onChangeStore={(st) => setSelectedStore(st)}
                selectedMetric={selectedMetric}
                onChangeMetric={(mt) => setSelectedMetric(mt)}
                periodMode={periodMode}
                onChangePeriod={(pm) => setPeriodMode(pm)}
                p25={currentPercentile.p25}
                p50={currentPercentile.p50}
                p75={currentPercentile.p75}
                todaySales={todayDayData.sales}
                percentilePositionPct={todayDayData.posPct}
                formatValue={currentPercentile.format}
                unitName={currentPercentile.unit}
            />

            {/* 4 & 5. CALENDARIO BENCHMARK (8 COLS) + PANEL RESUMEN LATERAL (4 COLS) */}
            <BenchmarkCalendarSection
                processedDays={processedDays}
                onSelectDay={(d) => setActiveModalDay(d)}
                resumenMes={resumenMes}
                monthTrendData={monthTrendData}
                formatValue={currentPercentile.format}
            />

            {/* 6. NUEVO: COMPARATIVA INTERANUAL DE VENTAS (2026 vs 2025) */}
            <BenchmarkYoYComparisonCard
                data={yoyData}
                formatValue={(v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 0 })}`}
            />

            {/* 7. COMPARACIÓN CONTRA DÍAS EQUIVALENTES */}
            <BenchmarkDiasEquivalentesView
                todayData={todayDayData}
                formatValue={currentPercentile.format}
            />

            {/* 8. RANKING DE SUCURSALES */}
            <BenchmarkRankingTable
                formatValue={currentPercentile.format}
                onSelectStore={(storeId) => setSelectedStore(storeId)}
            />

            {/* 9. BENCHMARK POR HORARIO (HORAS CRÍTICAS) */}
            <BenchmarkHorarioSummaryCard
                criticalHours={criticalHours}
                formatValue={currentPercentile.format}
            />

            {/* 10. DIAGNÓSTICO IA DEL BENCHMARK */}
            <BenchmarkIADiagnosisCard
                todaySales={todayDayData.sales}
                p50={currentPercentile.p50}
                formatValue={currentPercentile.format}
            />

            {/* MODAL DETALLE DE DÍA */}
            <BenchmarkDayDetailModal
                dayData={activeModalDay}
                onClose={() => setActiveModalDay(null)}
            />
        </div>
    );
};
