import React, { useState, useMemo } from 'react';
import {
    BarChart3, RefreshCw, Download, Store, Clock, Layers, ChevronLeft, ChevronRight
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
    const [periodMode, setPeriodMode] = useState<'mes' | 'semana'>('mes');
    const [currentMonthName, setCurrentMonthName] = useState<string>('Septiembre 2026');
    const [activeModalDay, setActiveModalDay] = useState<DayDetailData | null>(null);

    // Configuración multimétrica por sucursal
    const storeConfigs: Record<StoreKey, StoreBenchmarkConfig> = {
        consolidado: {
            name: 'Tiendas Minoristas (Consolidado)',
            multiplier: 1.0,
            percentiles: {
                ventas: { p25: 2148.00, p50: 2567.00, p75: 3133.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
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

    // Base raw days data for current month matching UI mock from media_1788896509242.png
    const baseRawDays = [
        { day: 1, dayOfWeek: 'Lun', fullDateStr: '01 Sep 2026', rawSales: 2970.50, orders: 48, prod: 'Combo Pollo Familiar', hora: '12:00-13:00', isPronostico: false },
        { day: 2, dayOfWeek: 'Mar', fullDateStr: '02 Sep 2026', rawSales: 2475.00, orders: 40, prod: 'Burger Doble Carne', hora: '13:00-14:00', isPronostico: false },
        { day: 3, dayOfWeek: 'Mie', fullDateStr: '03 Sep 2026', rawSales: 1644.50, orders: 27, prod: 'Pizza Familiar Pepperoni', hora: '19:00-20:00', isPronostico: false },
        { day: 4, dayOfWeek: 'Jue', fullDateStr: '04 Sep 2026', rawSales: 3902.50, orders: 63, prod: 'Lomo Saltado POS', hora: '12:30-13:30', isPronostico: false },
        { day: 5, dayOfWeek: 'Vie', fullDateStr: '05 Sep 2026', rawSales: 2511.00, orders: 41, prod: 'Soda 2L + Combo', hora: '14:00-15:00', isPronostico: false },
        { day: 6, dayOfWeek: 'Sab', fullDateStr: '06 Sep 2026', rawSales: 0, orders: 0, prod: 'Sin ventas', hora: '—', isPronostico: false },
        { day: 7, dayOfWeek: 'Dom', fullDateStr: '07 Sep 2026', rawSales: 6034.00, orders: 98, prod: 'Parrilla Mixta', hora: '13:00-14:00', isPronostico: false },
        { day: 8, dayOfWeek: 'Lun', fullDateStr: '08 Sep 2026', rawSales: 2248.00, orders: 36, prod: 'Combo Pollo Personal', hora: '12:00-13:00', isPronostico: false },
        // Pronóstico days
        { day: 9, dayOfWeek: 'Mar', fullDateStr: '09 Sep 2026', rawSales: 2362.00, orders: 38, prod: 'Sopa del Día', hora: '13:00-14:00', isPronostico: true, minSales: 1957.00, maxSales: 2744.00 },
        { day: 10, dayOfWeek: 'Mie', fullDateStr: '10 Sep 2026', rawSales: 2474.00, orders: 39, prod: 'Empanada de Carne', hora: '12:00-13:00', isPronostico: true, minSales: 1957.00, maxSales: 2848.00 },
        { day: 11, dayOfWeek: 'Jue', fullDateStr: '11 Sep 2026', rawSales: 3012.00, orders: 49, prod: 'Milanesa Gigante', hora: '13:30-14:30', isPronostico: true, minSales: 2674.00, maxSales: 3745.00 },
        { day: 12, dayOfWeek: 'Vie', fullDateStr: '12 Sep 2026', rawSales: 3101.00, orders: 50, prod: 'Cerveza + Pique Macho', hora: '19:00-20:00', isPronostico: true, minSales: 2551.00, maxSales: 3545.00 },
        { day: 13, dayOfWeek: 'Sab', fullDateStr: '13 Sep 2026', rawSales: 2239.00, orders: 36, prod: 'Papas Fritas XL', hora: '14:00-15:00', isPronostico: true, minSales: 1967.00, maxSales: 2429.00 },
        { day: 14, dayOfWeek: 'Dom', fullDateStr: '14 Sep 2026', rawSales: 2650.00, orders: 42, prod: 'Pollo Espiedo Entero', hora: '13:00-14:00', isPronostico: true, minSales: 2162.00, maxSales: 2844.00 },
        { day: 15, dayOfWeek: 'Lun', fullDateStr: '15 Sep 2026', rawSales: 2530.00, orders: 41, prod: 'Silpancho Cochabambino', hora: '12:00-13:00', isPronostico: true, minSales: 2083.00, maxSales: 2987.00 },
        { day: 16, dayOfWeek: 'Mar', fullDateStr: '16 Sep 2026', rawSales: 2362.00, orders: 38, prod: 'Chicharron Individual', hora: '13:00-14:00', isPronostico: true, minSales: 2223.00, maxSales: 2744.00 },
        { day: 17, dayOfWeek: 'Mie', fullDateStr: '17 Sep 2026', rawSales: 2474.00, orders: 39, prod: 'Burger Clásica', hora: '12:30-13:30', isPronostico: true, minSales: 1957.00, maxSales: 2848.00 },
        { day: 18, dayOfWeek: 'Jue', fullDateStr: '18 Sep 2026', rawSales: 3012.00, orders: 49, prod: 'Wings 12 pzas', hora: '19:30-20:30', isPronostico: true, minSales: 2674.00, maxSales: 3745.00 },
        { day: 19, dayOfWeek: 'Vie', fullDateStr: '19 Sep 2026', rawSales: 3101.00, orders: 50, prod: 'Combo Parrillero', hora: '14:00-15:00', isPronostico: true, minSales: 2551.00, maxSales: 3545.00 },
        { day: 20, dayOfWeek: 'Sab', fullDateStr: '20 Sep 2026', rawSales: 2239.00, orders: 36, prod: 'Postre Tres Leches', hora: '13:00-14:00', isPronostico: true, minSales: 1967.00, maxSales: 2429.00 },
        { day: 21, dayOfWeek: 'Dom', fullDateStr: '21 Sep 2026', rawSales: 2650.00, orders: 42, prod: 'Pollo 1/4 Pechuga', hora: '12:00-13:00', isPronostico: true, minSales: 2162.00, maxSales: 2844.00 },
        { day: 22, dayOfWeek: 'Lun', fullDateStr: '22 Sep 2026', rawSales: 2530.00, orders: 41, prod: 'Majadito de Charque', hora: '13:00-14:00', isPronostico: true, minSales: 2083.00, maxSales: 2987.00 },
        { day: 23, dayOfWeek: 'Mar', fullDateStr: '23 Sep 2026', rawSales: 2362.00, orders: 38, prod: 'Burger Triple Tocino', hora: '12:30-13:30', isPronostico: true, minSales: 2223.00, maxSales: 2744.00 },
        { day: 24, dayOfWeek: 'Mie', fullDateStr: '24 Sep 2026', rawSales: 2474.00, orders: 39, prod: 'Plato Ejecutivo', hora: '13:00-14:00', isPronostico: true, minSales: 1957.00, maxSales: 2848.00 },
        { day: 25, dayOfWeek: 'Jue', fullDateStr: '25 Sep 2026', rawSales: 3012.00, orders: 49, prod: 'Cerveza Artesanal 1L', hora: '19:00-20:00', isPronostico: true, minSales: 2674.00, maxSales: 3745.00 },
        { day: 26, dayOfWeek: 'Vie', fullDateStr: '26 Sep 2026', rawSales: 3101.00, orders: 50, prod: 'Nachos Supremos', hora: '15:00-16:00', isPronostico: true, minSales: 2551.00, maxSales: 3545.00 },
        { day: 27, dayOfWeek: 'Sab', fullDateStr: '27 Sep 2026', rawSales: 2239.00, orders: 36, prod: 'Combo Pollo XL', hora: '13:00-14:00', isPronostico: true, minSales: 1967.00, maxSales: 2429.00 },
        { day: 28, dayOfWeek: 'Dom', fullDateStr: '28 Sep 2026', rawSales: 2650.00, orders: 42, prod: 'Silpancho Especial', hora: '12:00-13:00', isPronostico: true, minSales: 2162.00, maxSales: 2844.00 },
        { day: 29, dayOfWeek: 'Lun', fullDateStr: '29 Sep 2026', rawSales: 2530.00, orders: 41, prod: 'Pique Macho Especial', hora: '13:00-14:00', isPronostico: true, minSales: 2083.00, maxSales: 2987.00 },
        { day: 30, dayOfWeek: 'Mar', fullDateStr: '30 Sep 2026', rawSales: 2362.00, orders: 38, prod: 'Combo Cierre de Mes', hora: '15:00-16:00', isPronostico: true, minSales: 2223.00, maxSales: 2744.00 },
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
                    dateStr: `${d.day} Sep`,
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
                    productoEstrella: 'Sin ventas',
                    equivalenteP50: p50,
                    vsEquivalentePct: 0,
                    causalFactor: 'Jornada sin registro de ventas registradas en el POS operacional.'
                };
            }

            if (d.isPronostico) {
                return {
                    day: d.day,
                    dayOfWeek: d.dayOfWeek,
                    dateStr: `${d.day} Sep`,
                    fullDateStr: d.fullDateStr,
                    sales,
                    orders,
                    ticketMedio,
                    unidades,
                    unidadesPorOrden,
                    vsP50: Math.round(((sales - p50) / p50) * 100),
                    status: 'pronostico' as const,
                    posPct: 50,
                    horaPico: d.hora,
                    productoEstrella: d.prod,
                    equivalenteP50: p50,
                    vsEquivalentePct: 0,
                    causalFactor: 'Proyección estadística de venta calculada con modelo de series de tiempo.',
                    isPronostico: true,
                    minSales: d.minSales ? Number((d.minSales * mult).toFixed(2)) : undefined,
                    maxSales: d.maxSales ? Number((d.maxSales * mult).toFixed(2)) : undefined,
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
                dateStr: `${d.day} Sep`,
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
                    ? 'Baja conversión en caja y menor concurrencia respecto a días equivalentes.'
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

        const total = processedDays.length || 30;
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
    const latestDay = processedDays.find(d => !d.isPronostico && d.sales > 0) || processedDays[0];
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
        <div className="space-y-6 font-sans text-slate-800 w-full bg-slate-50/40 p-2 sm:p-4 rounded-3xl">
            {/* Top Control Bar & Header (Exact match to uploaded image) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                Benchmark Histórico
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Evaluación del rendimiento utilizando datos históricos dinámicos y días equivalentes.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Store Selector */}
                        <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
                            <Store className="w-4 h-4 text-indigo-600" />
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value as StoreKey)}
                                className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="consolidado">Tiendas Minoristas (Consolidado)</option>
                                <option value="heroinas">Heroínas (Cochabamba)</option>
                                <option value="recoleta">Recoleta (Cochabamba)</option>
                                <option value="calacoto">Calacoto (La Paz)</option>
                            </select>
                        </div>

                        {/* Mes / Semana Toggle */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                            <button
                                onClick={() => setPeriodMode('mes')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                    periodMode === 'mes' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Mes
                            </button>
                            <button
                                onClick={() => setPeriodMode('semana')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                    periodMode === 'semana' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Semana
                            </button>
                        </div>

                        {/* Refresh & PDF */}
                        <button
                            onClick={handleRefresh}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200"
                            title="Actualizar datos"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
                        >
                            <Download className="w-4 h-4" />
                            <span>Exportar Informe</span>
                        </button>
                    </div>
                </div>

                {/* Filters Row: Metric Selector & Time Horizon */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Métrica Analizada
                        </label>
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2 focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="ventas">💰 Ventas Totales (Bs.)</option>
                            <option value="ordenes">🧾 Órdenes / Clientes</option>
                            <option value="ticket">💳 Ticket Promedio (Bs.)</option>
                            <option value="unidades">📦 Unidades Vendidas</option>
                            <option value="unidades_por_orden">📊 Unidades por Transacción</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Horizonte Temporal
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {(['30dias', '90dias', '365dias'] as HorizonKey[]).map((horizon) => (
                                <button
                                    key={horizon}
                                    onClick={() => setSelectedHorizon(horizon)}
                                    className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                                        selectedHorizon === horizon
                                            ? 'bg-white text-indigo-700 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {horizon === '30dias' ? '30 Días' : horizon === '90dias' ? '90 Días' : 'Año Móvil'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: PERCENTILES HISTÓRICOS (Exact match to media_1788896509242.png) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            📈 PERCENTILES HISTÓRICOS
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">
                        Base estadística: <strong>365 días históricos comparables</strong> según filtro activo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card P25 */}
                    <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> P25
                            </span>
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-rose-200">
                                CRÍTICO
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-rose-700 font-mono">
                            {currentPercentile.format(currentPercentile.p25)}
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                            Mínimo recomendado
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Límite inferior dinámico
                        </div>
                    </div>

                    {/* Card P50 */}
                    <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> P50
                            </span>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-amber-200">
                                NORMAL
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-amber-800 font-mono">
                            {currentPercentile.format(currentPercentile.p50)}
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                            Punto medio histórico
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Mediana del negocio
                        </div>
                    </div>

                    {/* Card P75 */}
                    <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> P75
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                                META
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-800 font-mono">
                            {currentPercentile.format(currentPercentile.p75)}
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                            Nivel alto esperado
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Rendimiento superior
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CALENDARIO HEATMAP Y PRONÓSTICO (Exact match to media_1788896509242.png) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Month Navigator Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <button
                        onClick={() => setCurrentMonthName('Agosto 2026')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {currentMonthName}
                    </h3>
                    <button
                        onClick={() => setCurrentMonthName('Octubre 2026')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Calendar Grid matching media_1788896509242.png */}
                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map((d) => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 py-1 font-mono uppercase tracking-wider">
                            {d}
                        </div>
                    ))}

                    {processedDays.map((d) => {
                        let cardStyle = 'bg-slate-50 border-slate-200 text-slate-800';
                        let badgeStyle = 'bg-slate-200 text-slate-700';
                        let badgeText = 'SIN VENTAS';

                        if (d.isPronostico) {
                            cardStyle = 'bg-indigo-50/40 border-indigo-200/80 border-dashed text-indigo-950';
                            badgeStyle = 'bg-indigo-100 text-indigo-700 border border-indigo-200';
                            badgeText = 'PRONÓSTICO';
                        } else if (d.status === 'alto') {
                            cardStyle = 'bg-emerald-50/50 border-emerald-300 text-emerald-950';
                            badgeStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                            badgeText = 'ALTO';
                        } else if (d.status === 'normal') {
                            cardStyle = 'bg-sky-50/50 border-sky-300 text-sky-950';
                            badgeStyle = 'bg-sky-100 text-sky-800 border border-sky-200';
                            badgeText = 'NORMAL';
                        } else if (d.status === 'bajo') {
                            cardStyle = 'bg-amber-50/50 border-amber-300 text-amber-950';
                            badgeStyle = 'bg-amber-100 text-amber-800 border border-amber-200';
                            badgeText = 'BAJO';
                        } else if (d.status === 'critico') {
                            cardStyle = 'bg-rose-50/50 border-rose-300 text-rose-950';
                            badgeStyle = 'bg-rose-100 text-rose-800 border border-rose-200';
                            badgeText = 'CRÍTICO';
                        }

                        return (
                            <button
                                key={d.day}
                                onClick={() => setActiveModalDay(d)}
                                className={`p-3 border rounded-2xl flex flex-col justify-between transition-all hover:scale-102 hover:shadow-sm text-left ${cardStyle}`}
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <span className="font-bold text-slate-800 font-mono text-sm">{d.day}</span>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${badgeStyle}`}>
                                        {badgeText}
                                    </span>
                                </div>

                                <div className="my-1">
                                    {d.sales > 0 ? (
                                        <>
                                            <div className="text-sm font-bold text-slate-900 font-mono">
                                                {d.isPronostico ? `~Bs. ${d.sales.toFixed(2)}` : `Bs. ${d.sales.toFixed(2)}`}
                                            </div>
                                            {!d.isPronostico ? (
                                                <div className={`text-[10px] font-bold font-mono ${d.vsP50 >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {d.vsP50 >= 0 ? `▲ +${d.vsP50}% vs P50` : `▼ ${d.vsP50}% vs P50`}
                                                </div>
                                            ) : (
                                                <div className="text-[9px] text-slate-500 font-mono leading-tight mt-0.5">
                                                    <div>Min: Bs. {d.minSales?.toFixed(0)}</div>
                                                    <div>Max: Bs. {d.maxSales?.toFixed(0)}</div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-xs text-slate-400 italic font-mono">
                                            Sin ventas
                                        </div>
                                    )}
                                </div>

                                {/* Indicator Dots (P25 • P50 • P75) */}
                                <div className="flex items-center justify-center gap-1.5 pt-1.5 border-t border-slate-200/50 text-[9px] font-mono text-slate-400">
                                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'critico' ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'normal' || d.status === 'bajo' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'alto' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Calendar Legend Footer matching media_1788896509242.png */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-3 border-t border-slate-100 text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Crítico
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Bajo
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Normal
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Alto
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> 🪄 Referencia estadística / Pronóstico
                    </span>
                </div>
            </div>

            {/* SECCIÓN 3: DÍAS EQUIVALENTES & GAUGE PERCENTIL (Módulos 1, 2, 9) */}
            <BenchmarkEquivalentesCard
                currentConfigName={currentConfig.name}
                formatValue={currentPercentile.format}
                todayData={processedDays[0]}
                resumenMes={resumenMes}
                percentiles={{
                    p25: currentPercentile.p25,
                    p50: currentPercentile.p50,
                    p75: currentPercentile.p75
                }}
            />

            {/* SECCIÓN 4: DIAGNÓSTICO AUTOMÁTICO IA ENGINE (Módulo 7) */}
            <BenchmarkIADiagnosisCard
                selectedMetric={selectedMetric}
                currentValue={currentMetricVal}
                p25={currentPercentile.p25}
                p50={currentPercentile.p50}
                p75={currentPercentile.p75}
                storeName={currentConfig.name}
            />

            {/* SECCIÓN 5: EVOLUCIÓN HISTÓRICA TEMPORAL (Módulos 3 & 5) */}
            <BenchmarkEvolucionChart
                selectedHorizon={selectedHorizon}
                formatValue={currentPercentile.format}
                processedDays={processedDays}
                p25={currentPercentile.p25}
                p50={currentPercentile.p50}
                p75={currentPercentile.p75}
                unit={currentPercentile.unit}
            />

            {/* SECCIÓN 6: RANKING DE SUCURSALES & BENCHMARK HORARIO (Módulos 4 & 6) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BenchmarkRankingTable
                    formatValue={currentPercentile.format}
                    onSelectStore={(storeId) => setSelectedStore(storeId)}
                    sortKey={selectedRankingSort}
                    onSortChange={(key) => setSelectedRankingSort(key)}
                />

                <BenchmarkHorarioCard
                    hourlyData={hourlyData}
                />
            </div>

            {/* Day Detail Interactive Modal (Módulo 8) */}
            <BenchmarkDayDetailModal
                dayData={activeModalDay}
                onClose={() => setActiveModalDay(null)}
            />
        </div>
    );
};
