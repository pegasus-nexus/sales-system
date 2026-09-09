import React, { useState, useMemo } from 'react';
import {
    RefreshCw, Download, Settings, Database, Calendar, BarChart3, HelpCircle, Lightbulb, Star, Info, Clock
} from 'lucide-react';

import type {
    StoreKey, MetricKey, DayDetailData, StoreBenchmarkConfig
} from './benchmark/BenchmarkTypes';
import { METRIC_TITLES } from './benchmark/BenchmarkTypes';
import { BenchmarkMetricTabs } from './benchmark/BenchmarkMetricTabs';
import { BenchmarkTopCards } from './benchmark/BenchmarkTopCards';
import { BenchmarkCalendarSection } from './benchmark/BenchmarkCalendarSection';
import { BenchmarkDayDetailModal } from './benchmark/BenchmarkDayDetailModal';
import { BenchmarkExplanationModal } from './benchmark/BenchmarkExplanationModal';

export const BIBenchmarkHistoricoView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const selectedStore: StoreKey = 'consolidado';
    const [selectedMetric, setSelectedMetric] = useState<MetricKey>('ventas');
    const [activeModalDay, setActiveModalDay] = useState<DayDetailData | null>(null);
    const [isExplanationModalOpen, setIsExplanationModalOpen] = useState<boolean>(false);

    // Multimetric percentile config per store
    const storeConfigs: Record<StoreKey, StoreBenchmarkConfig> = {
        consolidado: {
            name: 'Tiendas Minoristas (Consolidado)',
            multiplier: 1.0,
            percentiles: {
                ventas: { p25: 2645.00, p50: 4615.00, p75: 5983.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 42, p50: 75, p75: 98, unit: 'órdenes', format: (v) => `${Math.round(v)} clientes` },
                ticket: { p25: 48.50, p50: 61.50, p75: 78.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 110, p50: 195, p75: 260, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.1, p50: 2.6, p75: 3.2, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        heroinas: {
            name: 'Heroínas (Cochabamba)',
            multiplier: 0.58,
            percentiles: {
                ventas: { p25: 1534.00, p50: 2676.00, p75: 3470.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 25, p50: 48, p75: 64, unit: 'órdenes', format: (v) => `${Math.round(v)} clientes` },
                ticket: { p25: 44.00, p50: 59.30, p75: 72.50, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 65, p50: 120, p75: 165, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.0, p50: 2.5, p75: 3.1, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        recoleta: {
            name: 'Recoleta (Cochabamba)',
            multiplier: 0.48,
            percentiles: {
                ventas: { p25: 1269.00, p50: 2215.00, p75: 2871.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 20, p50: 38, p75: 52, unit: 'órdenes', format: (v) => `${Math.round(v)} clientes` },
                ticket: { p25: 42.00, p50: 61.50, p75: 76.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 50, p50: 95, p75: 135, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 1.9, p50: 2.4, p75: 3.0, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        },
        calacoto: {
            name: 'Calacoto (La Paz)',
            multiplier: 0.78,
            percentiles: {
                ventas: { p25: 2063.00, p50: 3599.00, p75: 4666.00, unit: 'Bs.', format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
                ordenes: { p25: 31, p50: 58, p75: 78, unit: 'órdenes', format: (v) => `${Math.round(v)} clientes` },
                ticket: { p25: 52.00, p50: 63.40, p75: 82.00, unit: 'Bs.', format: (v) => `Bs. ${v.toFixed(2)}` },
                unidades: { p25: 85, p50: 150, p75: 205, unit: 'un.', format: (v) => `${Math.round(v)} un.` },
                unidades_por_orden: { p25: 2.2, p50: 2.7, p75: 3.3, unit: 'un/ord', format: (v) => `${v.toFixed(1)} un/ord` }
            }
        }
    };

    const currentConfig = storeConfigs[selectedStore];
    const currentPercentile = currentConfig.percentiles[selectedMetric];

    // Raw days base data matching media_1788911167771.jpg
    const baseRawDays = [
        { day: 1, dayOfWeek: 'Lun', fullDateStr: '01/08/2026', rawSales: 1950.00, orders: 38, units: 95, prod: 'Combo Pollo Familiar', hora: '12:00-13:00' },
        { day: 2, dayOfWeek: 'Mar', fullDateStr: '02/08/2026', rawSales: 2722.00, orders: 48, units: 118, prod: 'Burger Doble Carne', hora: '13:00-14:00' },
        { day: 3, dayOfWeek: 'Mie', fullDateStr: '03/08/2026', rawSales: 1482.00, orders: 28, units: 70, prod: 'Pizza Familiar Pepperoni', hora: '19:00-20:00' },
        { day: 4, dayOfWeek: 'Jue', fullDateStr: '04/08/2026', rawSales: 3434.00, orders: 60, units: 150, prod: 'Lomo Saltado POS', hora: '12:30-13:30' },
        { day: 5, dayOfWeek: 'Vie', fullDateStr: '05/08/2026', rawSales: 2390.00, orders: 42, units: 105, prod: 'Soda 2L + Combo', hora: '14:00-15:00' },
        { day: 6, dayOfWeek: 'Sab', fullDateStr: '06/08/2026', rawSales: 3061.00, orders: 54, units: 135, prod: 'Parrilla Mixta', hora: '15:00-16:00' },
        { day: 7, dayOfWeek: 'Dom', fullDateStr: '07/08/2026', rawSales: 1966.00, orders: 36, units: 90, prod: 'Helado Artesanal', hora: '13:00-14:00' },
        { day: 8, dayOfWeek: 'Lun', fullDateStr: '08/08/2026', rawSales: 3061.00, orders: 54, units: 135, prod: 'Combo Pollo Personal', hora: '12:00-13:00' },
        { day: 9, dayOfWeek: 'Mar', fullDateStr: '09/08/2026', rawSales: 1966.00, orders: 36, units: 90, prod: 'Sopa del Día', hora: '13:00-14:00' },
        { day: 10, dayOfWeek: 'Mie', fullDateStr: '10/08/2026', rawSales: 1373.00, orders: 26, units: 65, prod: 'Empanada de Carne', hora: '12:00-13:00' },
        { day: 11, dayOfWeek: 'Jue', fullDateStr: '11/08/2026', rawSales: 4042.00, orders: 72, units: 180, prod: 'Milanesa Gigante', hora: '13:30-14:30' },
        { day: 12, dayOfWeek: 'Vie', fullDateStr: '12/08/2026', rawSales: 2256.00, orders: 40, units: 100, prod: 'Cerveza + Pique Macho', hora: '19:00-20:00' },
        { day: 13, dayOfWeek: 'Sab', fullDateStr: '13/08/2026', rawSales: 1646.00, orders: 30, units: 75, prod: 'Papas Fritas XL', hora: '14:00-15:00' },
        { day: 14, dayOfWeek: 'Dom', fullDateStr: '14/08/2026', rawSales: 1757.00, orders: 32, units: 80, prod: 'Pollo Espiedo Entero', hora: '13:00-14:00' },
        { day: 15, dayOfWeek: 'Lun', fullDateStr: '15/08/2026', rawSales: 1952.00, orders: 35, units: 88, prod: 'Silpancho Cochabambino', hora: '12:00-13:00' },
        { day: 16, dayOfWeek: 'Mar', fullDateStr: '16/08/2026', rawSales: 1820.00, orders: 33, units: 82, prod: 'Chicharron Individual', hora: '13:00-14:00' },
        { day: 17, dayOfWeek: 'Mie', fullDateStr: '17/08/2026', rawSales: 2590.00, orders: 48, units: 120, prod: 'Burger Clásica', hora: '12:30-13:30' },
        { day: 18, dayOfWeek: 'Jue', fullDateStr: '18/08/2026', rawSales: 0, orders: 0, units: 0, prod: 'Sin datos', hora: '—' },
        { day: 19, dayOfWeek: 'Vie', fullDateStr: '19/08/2026', rawSales: 2135.00, orders: 39, units: 98, prod: 'Wings 12 pzas', hora: '19:30-20:30' },
        { day: 20, dayOfWeek: 'Sab', fullDateStr: '20/08/2026', rawSales: 3245.00, orders: 58, units: 145, prod: 'Combo Parrillero', hora: '14:00-15:00' },
        { day: 21, dayOfWeek: 'Dom', fullDateStr: '21/08/2026', rawSales: 2810.00, orders: 49, units: 122, prod: 'Postre Tres Leches', hora: '13:00-14:00' },
        { day: 22, dayOfWeek: 'Lun', fullDateStr: '22/08/2026', rawSales: 4096.00, orders: 74, units: 185, prod: 'Pollo 1/4 Pechuga', hora: '12:00-13:00' },
        { day: 23, dayOfWeek: 'Mar', fullDateStr: '23/08/2026', rawSales: 2254.00, orders: 41, units: 102, prod: 'Majadito de Charque', hora: '13:00-14:00' },
        { day: 24, dayOfWeek: 'Mie', fullDateStr: '24/08/2026', rawSales: 2743.00, orders: 51, units: 128, prod: 'Burger Triple Tocino', hora: '12:30-13:30' },
        { day: 25, dayOfWeek: 'Jue', fullDateStr: '25/08/2026', rawSales: 2653.00, orders: 47, units: 118, prod: 'Plato Ejecutivo', hora: '13:00-14:00' },
        { day: 26, dayOfWeek: 'Vie', fullDateStr: '26/08/2026', rawSales: 2362.00, orders: 43, units: 108, prod: 'Cerveza Artesanal 1L', hora: '19:00-20:00' },
        { day: 27, dayOfWeek: 'Sab', fullDateStr: '27/08/2026', rawSales: 1819.00, orders: 33, units: 82, prod: 'Nachos Supremos', hora: '15:00-16:00' },
        { day: 28, dayOfWeek: 'Dom', fullDateStr: '28/08/2026', rawSales: 5484.00, orders: 94, units: 235, prod: 'Combo Pollo XL', hora: '13:00-14:00' },
        { day: 29, dayOfWeek: 'Lun', fullDateStr: '29/08/2026', rawSales: 5054.00, orders: 88, units: 220, prod: 'Silpancho Especial', hora: '12:00-13:00' },
        { day: 30, dayOfWeek: 'Mar', fullDateStr: '30/08/2026', rawSales: 4579.00, orders: 78, units: 195, prod: 'Pique Macho Especial', hora: '13:00-14:00' },
        { day: 31, dayOfWeek: 'Lun', fullDateStr: '31/08/2026', rawSales: 6627.00, orders: 120, units: 285, prod: 'Combo Cierre de Mes', hora: '15:00-16:00' },
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

            // Select active metric target
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

    const todayDayData = processedDays[processedDays.length - 1];

    const handleExportPDF = () => {
        window.print();
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 400);
    };

    return (
        <div className="space-y-5 font-sans text-slate-800 w-full bg-slate-50/60 p-3 sm:p-5 rounded-3xl">
            {/* 1. ENCABEZADO SUPERIOR Y BOTONES DE ACCIÓN matching media_1788911167771.jpg */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shrink-0">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    Benchmark Histórico
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Evaluación del rendimiento contra comportamiento histórico y días equivalentes del negocio.
                                </p>
                            </div>
                        </div>

                        {/* Badges de Información Rango & Fuente */}
                        <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 border border-slate-200/80 rounded-xl text-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Rango del Año Móvil: <strong>01 de Septiembre 2025 al 31 de Agosto 2026 (365 días)</strong></span>
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 border border-slate-200/80 rounded-xl text-slate-700">
                                <Database className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Colección: <strong className="font-mono text-slate-900">sales (MongoDB)</strong></span>
                            </span>
                        </div>
                    </div>

                    {/* Botoncitos de Acción Superior Derecha */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                            <span>Actualizar</span>
                        </button>

                        <button
                            onClick={handleExportPDF}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Exportar</span>
                        </button>

                        <button
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Configurar</span>
                        </button>

                        <button
                            onClick={() => setIsExplanationModalOpen(true)}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all border border-indigo-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                            <span>¿De dónde vienen estos datos?</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* 3. BOTONCITOS SELECTORES DE MÉTRICA PESTAÑA matching media_1788911167771.jpg */}
            <BenchmarkMetricTabs
                activeMetric={selectedMetric}
                onChangeMetric={(metric) => setSelectedMetric(metric)}
            />

            {/* 4. TARJETAS PRINCIPALES KPI (P25, P50, P75, POSICIÓN ACTUAL CON SUBCARD DE DÍAS EQUIVALENTES) */}
            <BenchmarkTopCards
                p25={currentPercentile.p25}
                p50={currentPercentile.p50}
                p75={currentPercentile.p75}
                todaySales={todayDayData.sales}
                vsP50Pct={todayDayData.vsP50}
                percentilePositionPct={todayDayData.posPct}
                formatValue={currentPercentile.format}
                dayName={todayDayData.dayOfWeek === 'Lun' ? 'Lunes' : 'Día'}
                promedioEquivalente={5840}
                variacionEquivalentePct={13.5}
            />

            {/* 5. CALENDARIO DE RENDIMIENTO HISTÓRICO (8 COLS) + PANEL DERECHO DE RESUMEN Y ESTADÍSTICAS DEL MES (4 COLS) */}
            <BenchmarkCalendarSection
                processedDays={processedDays}
                onSelectDay={(d) => setActiveModalDay(d)}
                metricTitle={METRIC_TITLES[selectedMetric]}
                formatValue={currentPercentile.format}
            />

            {/* 6. BLOQUES INFERIORES DE INTERPRETACIÓN Y RECOMENDACIÓN matching media_1788911167771.jpg */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Interpretación */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-3xl p-5 shadow-xs flex items-start gap-3">
                    <div className="p-2.5 bg-indigo-100 border border-indigo-200 rounded-2xl text-indigo-700 shrink-0">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                            Interpretación
                        </h4>
                        <p className="text-xs text-indigo-950 mt-1 leading-relaxed font-medium">
                            El resultado actual se encuentra por encima del <strong>82%</strong> de todas las jornadas registradas en el año móvil. Se observa un buen desempeño, impulsado por un mayor flujo de ventas en los últimos días del mes.
                        </p>
                    </div>
                </div>

                {/* Recomendación */}
                <div className="bg-purple-50/70 border border-purple-200/80 rounded-3xl p-5 shadow-xs flex items-start gap-3">
                    <div className="p-2.5 bg-purple-100 border border-purple-200 rounded-2xl text-purple-700 shrink-0">
                        <Star className="w-5 h-5 fill-purple-600" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider">
                            Recomendación
                        </h4>
                        <p className="text-xs text-purple-950 mt-1 leading-relaxed font-medium">
                            Mantener la disponibilidad de inventario en productos de alta rotación y aprovechar el buen momento de demanda para consolidar metas comerciales.
                        </p>
                    </div>
                </div>
            </div>

            {/* 7. FOOTER INFORMATIVO INFERIOR matching media_1788911167771.jpg */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-3 border-t border-slate-200/80 px-1">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                        <strong>Base estadística de Tiendas Minoristas (Consolidado):</strong> 01/09/2025 al 31/08/2026 (365 días móviles equivalentes) provenientes de MongoDB colección <code className="font-mono text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">'sales'</code>.
                    </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Última actualización: 31/08/2026 19:50:22</span>
                </div>
            </div>

            {/* MODALES */}
            <BenchmarkDayDetailModal
                dayData={activeModalDay}
                onClose={() => setActiveModalDay(null)}
            />

            <BenchmarkExplanationModal
                isOpen={isExplanationModalOpen}
                onClose={() => setIsExplanationModalOpen(false)}
            />
        </div>
    );
};

