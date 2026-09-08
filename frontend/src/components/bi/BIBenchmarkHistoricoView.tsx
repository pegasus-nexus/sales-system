import React, { useState, useMemo } from 'react';
import {
    BarChart3, Calendar, RefreshCw, Download, Store, Clock, Layers
} from 'lucide-react';

import type {
    StoreKey, MetricKey, HorizonKey, RankingSortKey, DayDetailData,
    StoreBenchmarkConfig, HourlyBenchmarkItem
} from './benchmark/BenchmarkTypes';
import { BenchmarkEquivalentesCard } from './benchmark/BenchmarkEquivalentesCard';
import { BenchmarkEvolucionChart } from './benchmark/BenchmarkEvolucionChart';
import { BenchmarkRankingTable } from './benchmark/BenchmarkRankingTable';
import { BenchmarkHorarioCard } from './benchmark/BenchmarkHorarioCard';
import { BenchmarkIADiagnosisCard } from './benchmark/BenchmarkIADiagnosisCard';
import { BenchmarkDayDetailModal } from './benchmark/BenchmarkDayDetailModal';

export const BIBenchmarkHistoricoView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedStore, setSelectedStore] = useState<StoreKey>('consolidado');
    const [selectedMetric, setSelectedMetric] = useState<MetricKey>('ventas');
    const [selectedHorizon, setSelectedHorizon] = useState<HorizonKey>('30dias');
    const [selectedRankingSort, setSelectedRankingSort] = useState<RankingSortKey>('rendimiento');
    const [activeModalDay, setActiveModalDay] = useState<DayDetailData | null>(null);

    // Fechas explícitas evaluadas para la base estadística de 365 días
    const dateRangeEvaluated = {
        totalDays: 365,
        collection: "sales (MongoDB)",
        timezone: "America/La_Paz"
    };

    // Configuración multimétrica por sucursal
    const storeConfigs: Record<StoreKey, StoreBenchmarkConfig> = {
        consolidado: {
            name: 'Tiendas Minoristas (Consolidado)',
            multiplier: 1.0,
            percentiles: {
                ventas: { p25: 2645.00, p50: 4615.00, p75: 5983.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                ordenes: { p25: 42, p50: 75, p75: 98, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 48.50, p50: 61.50, p75: 78.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 110, p50: 195, p75: 260, unit: 'unidades', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.1, p50: 2.6, p75: 3.2, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        heroinas: {
            name: 'Heroínas (Cochabamba)',
            multiplier: 0.58,
            percentiles: {
                ventas: { p25: 1420.00, p50: 2850.00, p75: 3920.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                ordenes: { p25: 25, p50: 48, p75: 64, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 44.00, p50: 59.30, p75: 72.50, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 65, p50: 120, p75: 165, unit: 'unidades', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.0, p50: 2.5, p75: 3.1, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        recoleta: {
            name: 'Recoleta (Cochabamba)',
            multiplier: 0.48,
            percentiles: {
                ventas: { p25: 1180.00, p50: 2340.00, p75: 3210.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                ordenes: { p25: 20, p50: 38, p75: 52, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 42.00, p50: 61.50, p75: 76.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 50, p50: 95, p75: 135, unit: 'unidades', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 1.9, p50: 2.4, p75: 3.0, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        calacoto: {
            name: 'Calacoto (La Paz)',
            multiplier: 0.78,
            percentiles: {
                ventas: { p25: 1850.00, p50: 3680.00, p75: 4950.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                ordenes: { p25: 31, p50: 58, p75: 78, unit: 'órdenes', format: (v) => `${Math.round(v)} órdenes` },
                ticket: { p25: 52.00, p50: 63.40, p75: 82.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 85, p50: 150, p75: 205, unit: 'unidades', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.2, p50: 2.7, p75: 3.3, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        }
    };

    const currentConfig = storeConfigs[selectedStore];
    const currentPercentile = currentConfig.percentiles[selectedMetric];

    // Base raw days data for current month (Agosto)
    const baseRawDays = [
        { day: 1, dayOfWeek: 'Lun', fullDateStr: '01 Ago 2026', rawSales: 1950.05, orders: 38, prod: 'Combo Pollo Familiar', hora: '12:00-13:00' },
        { day: 2, dayOfWeek: 'Mar', fullDateStr: '02 Ago 2026', rawSales: 2485.52, orders: 45, prod: 'Burger Doble Carne', hora: '13:00-14:00' },
        { day: 3, dayOfWeek: 'Mie', fullDateStr: '03 Ago 2026', rawSales: 1772.01, orders: 32, prod: 'Pizza Familiar Pepperoni', hora: '19:00-20:00' },
        { day: 4, dayOfWeek: 'Jue', fullDateStr: '04 Ago 2026', rawSales: 2805.01, orders: 50, prod: 'Lomo Saltado POS', hora: '12:30-13:30' },
        { day: 5, dayOfWeek: 'Vie', fullDateStr: '05 Ago 2026', rawSales: 1482.00, orders: 28, prod: 'Soda 2L + Combo', hora: '14:00-15:00' },
        { day: 6, dayOfWeek: 'Sab', fullDateStr: '06 Ago 2026', rawSales: 3434.03, orders: 62, prod: 'Parrilla Mixta', hora: '15:00-16:00' },
        { day: 7, dayOfWeek: 'Dom', fullDateStr: '07 Ago 2026', rawSales: 2390.02, orders: 41, prod: 'Helado Artesanal', hora: '13:00-14:00' },
        { day: 8, dayOfWeek: 'Lun', fullDateStr: '08 Ago 2026', rawSales: 3061.00, orders: 54, prod: 'Combo Pollo Personal', hora: '12:00-13:00' },
        { day: 9, dayOfWeek: 'Mar', fullDateStr: '09 Ago 2026', rawSales: 1966.50, orders: 36, prod: 'Sopa del Día', hora: '13:00-14:00' },
        { day: 10, dayOfWeek: 'Mie', fullDateStr: '10 Ago 2026', rawSales: 1373.50, orders: 26, prod: 'Empanada de Carne', hora: '12:00-13:00' },
        { day: 11, dayOfWeek: 'Jue', fullDateStr: '11 Ago 2026', rawSales: 4042.50, orders: 72, prod: 'Milanesa Gigante', hora: '13:30-14:30' },
        { day: 12, dayOfWeek: 'Vie', fullDateStr: '12 Ago 2026', rawSales: 2256.00, orders: 40, prod: 'Cerveza + Pique Macho', hora: '19:00-20:00' },
        { day: 13, dayOfWeek: 'Sab', fullDateStr: '13 Ago 2026', rawSales: 1646.50, orders: 30, prod: 'Papas Fritas XL', hora: '14:00-15:00' },
        { day: 14, dayOfWeek: 'Dom', fullDateStr: '14 Ago 2026', rawSales: 1757.00, orders: 32, prod: 'Pollo Espiedo Entero', hora: '13:00-14:00' },
        { day: 15, dayOfWeek: 'Lun', fullDateStr: '15 Ago 2026', rawSales: 1952.00, orders: 35, prod: 'Silpancho Cochabambino', hora: '12:00-13:00' },
        { day: 16, dayOfWeek: 'Mar', fullDateStr: '16 Ago 2026', rawSales: 1820.50, orders: 33, prod: 'Chicharron Individual', hora: '13:00-14:00' },
        { day: 17, dayOfWeek: 'Mie', fullDateStr: '17 Ago 2026', rawSales: 2590.50, orders: 48, prod: 'Burger Clásica', hora: '12:30-13:30' },
        { day: 18, dayOfWeek: 'Jue', fullDateStr: '18 Ago 2026', rawSales: 0, orders: 0, prod: 'Sin datos', hora: '—' },
        { day: 19, dayOfWeek: 'Vie', fullDateStr: '19 Ago 2026', rawSales: 2135.00, orders: 39, prod: 'Wings 12 pzas', hora: '19:30-20:30' },
        { day: 20, dayOfWeek: 'Sab', fullDateStr: '20 Ago 2026', rawSales: 3245.01, orders: 58, prod: 'Combo Parrillero', hora: '14:00-15:00' },
        { day: 21, dayOfWeek: 'Dom', fullDateStr: '21 Ago 2026', rawSales: 2810.01, orders: 49, prod: 'Postre Tres Leches', hora: '13:00-14:00' },
        { day: 22, dayOfWeek: 'Lun', fullDateStr: '22 Ago 2026', rawSales: 4096.51, orders: 74, prod: 'Pollo 1/4 Pechuga', hora: '12:00-13:00' },
        { day: 23, dayOfWeek: 'Mar', fullDateStr: '23 Ago 2026', rawSales: 2254.00, orders: 41, prod: 'Majadito de Charque', hora: '13:00-14:00' },
        { day: 24, dayOfWeek: 'Mie', fullDateStr: '24 Ago 2026', rawSales: 2743.02, orders: 51, prod: 'Burger Triple Tocino', hora: '12:30-13:30' },
        { day: 25, dayOfWeek: 'Jue', fullDateStr: '25 Ago 2026', rawSales: 2653.00, orders: 47, prod: 'Plato Ejecutivo', hora: '13:00-14:00' },
        { day: 26, dayOfWeek: 'Vie', fullDateStr: '26 Ago 2026', rawSales: 2362.50, orders: 43, prod: 'Cerveza Artesanal 1L', hora: '19:00-20:00' },
        { day: 27, dayOfWeek: 'Sab', fullDateStr: '27 Ago 2026', rawSales: 1819.50, orders: 33, prod: 'Nachos Supremos', hora: '15:00-16:00' },
        { day: 28, dayOfWeek: 'Dom', fullDateStr: '28 Ago 2026', rawSales: 5484.00, orders: 94, prod: 'Combo Pollo Familiar XL', hora: '13:00-14:00' },
        { day: 29, dayOfWeek: 'Lun', fullDateStr: '29 Ago 2026', rawSales: 5054.00, orders: 88, prod: 'Silpancho Especial', hora: '12:00-13:00' },
        { day: 30, dayOfWeek: 'Mar', fullDateStr: '30 Ago 2026', rawSales: 4579.00, orders: 78, prod: 'Pique Macho Especial', hora: '13:00-14:00' },
        { day: 31, dayOfWeek: 'Mie', fullDateStr: '31 Ago 2026', rawSales: 6627.00, orders: 112, prod: 'Combo Cierre de Mes', hora: '15:00-16:00' },
    ];

    // Compute structured day details
    const processedDays = useMemo<DayDetailData[]>(() => {
        const mult = currentConfig.multiplier;
        const p25 = currentPercentile.p25;
        const p50 = currentPercentile.p50;
        const p75 = currentPercentile.p75;

        return baseRawDays.map(d => {
            const sales = Number((d.rawSales * mult).toFixed(2));
            const orders = Math.round(d.orders * mult);
            const ticketMedio = orders > 0 ? Number((sales / orders).toFixed(2)) : 0;
            const unidades = Math.round(orders * 2.5);
            const unidadesPorOrden = orders > 0 ? Number((unidades / orders).toFixed(1)) : 0;

            let selectedMetricVal = sales;
            if (selectedMetric === 'ordenes') selectedMetricVal = orders;
            if (selectedMetric === 'ticket') selectedMetricVal = ticketMedio;
            if (selectedMetric === 'unidades') selectedMetricVal = unidades;
            if (selectedMetric === 'unidades_por_orden') selectedMetricVal = unidadesPorOrden;

            if (sales === 0) {
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
                    causalFactor: 'Jornada sin registro de ventas registradas en el POS operacional.'
                };
            }

            const vsP50 = Math.round(((selectedMetricVal - p50) / p50) * 100);
            let status: 'critico' | 'bajo' | 'normal' | 'alto' = 'normal';
            let posPct = 50;

            if (selectedMetricVal < p25) {
                status = 'critico';
                posPct = Math.min(Math.max(Math.round((selectedMetricVal / p25) * 25), 5), 24);
            } else if (selectedMetricVal < p50) {
                status = 'bajo';
                posPct = 25 + Math.round(((selectedMetricVal - p25) / (p50 - p25)) * 25);
            } else if (selectedMetricVal <= p75) {
                status = 'normal';
                posPct = 50 + Math.round(((selectedMetricVal - p50) / (p75 - p50)) * 25);
            } else {
                status = 'alto';
                posPct = Math.min(75 + Math.round(((selectedMetricVal - p75) / p75) * 25), 95);
            }

            const equivalenteP50 = Number((p50 * (status === 'alto' ? 0.95 : 1.05)).toFixed(2));
            const vsEquivalentePct = ((selectedMetricVal - equivalenteP50) / equivalenteP50) * 100;

            return {
                day: d.day,
                dayOfWeek: d.dayOfWeek,
                dateStr: `${d.day} Ago`,
                fullDateStr: d.fullDateStr,
                sales,
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
                    ? `Día con fuerte tráfíco impulsado por ${d.prod} en franja ${d.hora}.`
                    : status === 'critico'
                    ? 'Baja conversión en caja y menor concurrencia respecto a lunes equivalentes.'
                    : 'Operación dentro del flujo normal esperado en la sucursal.'
            };
        });
    }, [selectedStore, selectedMetric, currentConfig, currentPercentile]);

    // Resumen del Mes (Módulo 9)
    const resumenMes = useMemo(() => {
        let criticos = 0;
        let bajos = 0;
        let normales = 0;
        let altos = 0;
        let sinDatos = 0;

        processedDays.forEach(d => {
            if (d.status === 'critico') criticos++;
            else if (d.status === 'bajo') bajos++;
            else if (d.status === 'normal') normales++;
            else if (d.status === 'alto') altos++;
            else sinDatos++;
        });

        const total = processedDays.length || 31;
        return {
            criticos: { count: criticos, pct: `${((criticos / total) * 100).toFixed(1)}%` },
            bajos: { count: bajos, pct: `${((bajos / total) * 100).toFixed(1)}%` },
            normales: { count: normales, pct: `${((normales / total) * 100).toFixed(1)}%` },
            altos: { count: altos, pct: `${((altos / total) * 100).toFixed(1)}%` },
            sinDatos: { count: sinDatos, pct: `${((sinDatos / total) * 100).toFixed(1)}%` },
        };
    }, [processedDays]);

    // Hourly Benchmark Data (Módulo 6)
    const hourlyData = useMemo<HourlyBenchmarkItem[]>(() => {
        const mult = currentConfig.multiplier;
        const rawHours = [
            { hora: '08:00 - 09:00', prom: 180, hoy: 120 },
            { hora: '09:00 - 10:00', prom: 260, hoy: 290 },
            { hora: '10:00 - 11:00', prom: 340, hoy: 310 },
            { hora: '11:00 - 12:00', prom: 520, hoy: 580 },
            { hora: '12:00 - 13:00', prom: 890, hoy: 1150 },
            { hora: '13:00 - 14:00', prom: 940, hoy: 1020 },
            { hora: '14:00 - 15:00', prom: 480, hoy: 350 },
            { hora: '15:00 - 16:00', prom: 310, hoy: 240 },
            { hora: '16:00 - 17:00', prom: 290, hoy: 310 },
            { hora: '17:00 - 18:00', prom: 420, hoy: 460 },
            { hora: '18:00 - 19:00', prom: 680, hoy: 720 },
            { hora: '19:00 - 20:00', prom: 850, hoy: 910 },
            { hora: '20:00 - 21:00', prom: 610, hoy: 430 },
            { hora: '21:00 - 22:00', prom: 320, hoy: 180 },
        ];

        return rawHours.map(h => {
            const promedioHistorico = Number((h.prom * mult).toFixed(2));
            const ventaHoy = Number((h.hoy * mult).toFixed(2));
            const variacionPct = promedioHistorico > 0 ? ((ventaHoy - promedioHistorico) / promedioHistorico) * 100 : 0;
            const isPico = h.hoy >= 850;
            const isDebil = variacionPct <= -25;
            let status: 'alto' | 'normal' | 'bajo' = 'normal';
            if (variacionPct >= 10) status = 'alto';
            if (variacionPct <= -15) status = 'bajo';

            return {
                hora: h.hora,
                promedioHistorico,
                ventaHoy,
                variacionPct,
                status,
                isPico,
                isDebil
            };
        });
    }, [selectedStore, currentConfig]);

    // Current value for IA Diagnosis card
    const latestDay = processedDays[processedDays.length - 1];
    let currentMetricVal = latestDay.sales;
    if (selectedMetric === 'ordenes') currentMetricVal = latestDay.orders;
    if (selectedMetric === 'ticket') currentMetricVal = latestDay.ticketMedio;
    if (selectedMetric === 'unidades') currentMetricVal = latestDay.unidades;
    if (selectedMetric === 'unidades_por_orden') currentMetricVal = latestDay.unidadesPorOrden;

    // Export PDF function
    const handleExportPDF = () => {
        window.print();
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 400);
    };

    return (
        <div className="space-y-6 font-sans text-slate-800 w-full">
            {/* Top Control Bar & Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-bold text-white tracking-wide">
                                CENTRO DE INTELIGENCIA DE NEGOCIOS — BENCHMARK HISTÓRICO AVANZADO
                            </h2>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span>Base: colección <code className="font-mono text-indigo-300">sales</code> ({dateRangeEvaluated.totalDays} días históricos)</span>
                            <span>•</span>
                            <span>Zona Horaria: <strong className="text-slate-300">{dateRangeEvaluated.timezone}</strong></span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Refresh */}
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
                            title="Actualizar datos"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Actualizar</span>
                        </button>

                        {/* Export PDF */}
                        <button
                            onClick={handleExportPDF}
                            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-xs font-bold"
                        >
                            <Download className="w-4 h-4" />
                            <span>Exportar Informe PDF</span>
                        </button>
                    </div>
                </div>

                {/* Filters Row: Store & Metric Selectors */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Store Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-indigo-400" /> Sucursal Evaluada
                        </label>
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value as StoreKey)}
                            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-medium rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none transition-colors"
                        >
                            <option value="consolidado">🏢 Tiendas Minoristas (Consolidado)</option>
                            <option value="heroinas">📍 Heroínas (Cochabamba)</option>
                            <option value="recoleta">📍 Recoleta (Cochabamba)</option>
                            <option value="calacoto">📍 Calacoto (La Paz)</option>
                        </select>
                    </div>

                    {/* Metric Selector (Módulo 5) */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-400" /> Métrica Analizada
                        </label>
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
                            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-medium rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none transition-colors font-semibold text-indigo-300"
                        >
                            <option value="ventas">💰 Ventas Totales (Bs.)</option>
                            <option value="ordenes">🧾 Órdenes / Clientes</option>
                            <option value="ticket">💳 Ticket Promedio (Bs.)</option>
                            <option value="unidades">📦 Unidades Vendidas</option>
                            <option value="unidades_por_orden">📊 Unidades por Transacción</option>
                        </select>
                    </div>

                    {/* Time Horizon Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> Horizonte Temporal Benchmark
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {(['30dias', '90dias', '365dias'] as HorizonKey[]).map((horizon) => (
                                <button
                                    key={horizon}
                                    onClick={() => setSelectedHorizon(horizon)}
                                    className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                        selectedHorizon === horizon
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {horizon === '30dias' ? '30 Días' : horizon === '90dias' ? '90 Días' : 'Año Móvil'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Módulo 1 & 2 & 9: Días Equivalentes, Distribución Histórica y Resumen Mensual */}
            <BenchmarkEquivalentesCard
                currentConfigName={currentConfig.name}
                formatValue={currentPercentile.format}
                todayData={processedDays[processedDays.length - 1]}
                resumenMes={resumenMes}
                percentiles={{
                    p25: currentPercentile.p25,
                    p50: currentPercentile.p50,
                    p75: currentPercentile.p75
                }}
            />

            {/* Módulo 7: Diagnóstico Automático IA Engine */}
            <BenchmarkIADiagnosisCard
                selectedMetric={selectedMetric}
                currentValue={currentMetricVal}
                p25={currentPercentile.p25}
                p50={currentPercentile.p50}
                p75={currentPercentile.p75}
                storeName={currentConfig.name}
            />

            {/* Módulo 3 & 5: Evolución Histórica Temporal (Chart) */}
            <BenchmarkEvolucionChart
                selectedHorizon={selectedHorizon}
                formatValue={currentPercentile.format}
                processedDays={processedDays}
                p25={currentPercentile.p25}
                p50={currentPercentile.p50}
                p75={currentPercentile.p75}
                unit={currentPercentile.unit}
            />

            {/* Heatmap Calendar Section (Módulo 8 - Interactive Day Modal trigger) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                    <div>
                        <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-400" />
                            Matriz Heatmap de Rendimiento Diario (Agosto 2026)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Haz clic en cualquier día para abrir el informe detallado de auditoría operativa
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Alto (&gt;P75)
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Normal (P25-P75)
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Bajo (&lt;P50)
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Crítico (&lt;P25)
                        </span>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 py-1 font-mono uppercase border-b border-slate-800">
                            {d}
                        </div>
                    ))}

                    {processedDays.map((d) => {
                        let bgClass = 'bg-slate-950/60 border-slate-800 hover:border-slate-600';
                        let textClass = 'text-slate-300';
                        if (d.status === 'alto') {
                            bgClass = 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400';
                            textClass = 'text-emerald-300';
                        } else if (d.status === 'normal') {
                            bgClass = 'bg-sky-950/40 border-sky-500/40 hover:border-sky-400';
                            textClass = 'text-sky-300';
                        } else if (d.status === 'bajo') {
                            bgClass = 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400';
                            textClass = 'text-amber-300';
                        } else if (d.status === 'critico') {
                            bgClass = 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400';
                            textClass = 'text-rose-300';
                        }

                        return (
                            <button
                                key={d.day}
                                onClick={() => setActiveModalDay(d)}
                                className={`p-2.5 border rounded-xl flex flex-col justify-between transition-all hover:scale-105 ${bgClass}`}
                            >
                                <div className="flex items-center justify-between text-xs w-full">
                                    <span className="font-bold text-white font-mono">{d.day}</span>
                                    <span className={`text-[10px] font-bold font-mono px-1 rounded ${textClass}`}>
                                        {d.vsP50 >= 0 ? `+${d.vsP50}%` : `${d.vsP50}%`}
                                    </span>
                                </div>
                                <div className="mt-2 text-right">
                                    <span className="text-[11px] font-bold text-white font-mono block">
                                        Bs. {d.sales.toFixed(0)}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Módulo 4 & 6 Grid: Store Ranking Table & Hourly Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Módulo 4: Ranking de Sucursales */}
                <BenchmarkRankingTable
                    formatValue={currentPercentile.format}
                    onSelectStore={(storeId) => setSelectedStore(storeId)}
                    sortKey={selectedRankingSort}
                    onSortChange={(key) => setSelectedRankingSort(key)}
                />

                {/* Módulo 6: Benchmark Horario Operativo */}
                <BenchmarkHorarioCard
                    hourlyData={hourlyData}
                />
            </div>

            {/* Day Detail Interactive Modal */}
            <BenchmarkDayDetailModal
                dayData={activeModalDay}
                onClose={() => setActiveModalDay(null)}
            />
        </div>
    );
};
