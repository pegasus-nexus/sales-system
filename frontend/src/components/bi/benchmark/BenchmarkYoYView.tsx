import React, { useState, useMemo } from 'react';
import {
    RefreshCw, Download, Database, Building2,
    Clock, Sparkles, Lightbulb
} from 'lucide-react';

import type { StoreKey, MetricKey } from './BenchmarkTypes';
import { BenchmarkMetricTabs } from './BenchmarkMetricTabs';

export const BenchmarkYoYView: React.FC = () => {
    const [selectedStore, setSelectedStore] = useState<StoreKey>('consolidado');
    const [selectedMetric, setSelectedMetric] = useState<MetricKey>('ventas');
    const [loading, setLoading] = useState<boolean>(false);

    const currentTimestamp = useMemo(() => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
    }, [loading]);

    // Multipliers per store
    const storeMultipliers: Record<StoreKey, { name: string; multiplier: number }> = {
        consolidado: { name: 'Todas las sucursales (Consolidado)', multiplier: 1.0 },
        heroinas: { name: 'Heroínas (Cochabamba)', multiplier: 0.58 },
        recoleta: { name: 'Recoleta (Cochabamba)', multiplier: 0.48 },
        calacoto: { name: 'Calacoto (La Paz)', multiplier: 0.78 },
    };

    const mult = storeMultipliers[selectedStore].multiplier;

    // Raw YoY metric definitions
    const metricYoYData = useMemo(() => {
        const rawData: Record<MetricKey, {
            val2026: number;
            val2025: number;
            val2024: number;
            val2023: number;
            unit: string;
            format: (v: number) => string;
            diffFormat: (diff: number) => string;
            clientGrowthPct: number;
            ticketGrowthPct: number;
        }> = {
            ventas: {
                val2026: 5169.00 * mult,
                val2025: 4020.00 * mult,
                val2024: 3650.00 * mult,
                val2023: 3200.00 * mult,
                unit: 'Bs.',
                format: (v) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                diffFormat: (d) => `Bs. ${Math.abs(d).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                clientGrowthPct: 15.0,
                ticketGrowthPct: 10.0
            },
            ordenes: {
                val2026: Math.round(92 * mult),
                val2025: Math.round(80 * mult),
                val2024: Math.round(72 * mult),
                val2023: Math.round(65 * mult),
                unit: 'clientes',
                format: (v) => `${Math.round(v)} clientes`,
                diffFormat: (d) => `${Math.abs(Math.round(d))} clientes`,
                clientGrowthPct: 15.0,
                ticketGrowthPct: 10.0
            },
            ticket: {
                val2026: 56.18,
                val2025: 50.25,
                val2024: 50.69,
                val2023: 49.23,
                unit: 'Bs.',
                format: (v) => `Bs. ${v.toFixed(2)}`,
                diffFormat: (d) => `Bs. ${Math.abs(d).toFixed(2)}`,
                clientGrowthPct: 15.0,
                ticketGrowthPct: 10.0
            },
            unidades: {
                val2026: Math.round(248 * mult),
                val2025: Math.round(200 * mult),
                val2024: Math.round(180 * mult),
                val2023: Math.round(155 * mult),
                unit: 'un.',
                format: (v) => `${Math.round(v)} un.`,
                diffFormat: (d) => `${Math.abs(Math.round(d))} un.`,
                clientGrowthPct: 15.0,
                ticketGrowthPct: 10.0
            },
            unidades_por_orden: {
                val2026: 2.7,
                val2025: 2.5,
                val2024: 2.5,
                val2023: 2.4,
                unit: 'un/ord',
                format: (v) => `${v.toFixed(1)} un/ord`,
                diffFormat: (d) => `${Math.abs(d).toFixed(1)} un/ord`,
                clientGrowthPct: 15.0,
                ticketGrowthPct: 10.0
            }
        };

        const active = rawData[selectedMetric];
        const diffVal = active.val2026 - active.val2025;
        const diffPct = active.val2025 > 0 ? ((active.val2026 - active.val2025) / active.val2025) * 100 : 0;
        const isPositive = diffPct >= 0;

        return {
            ...active,
            diffVal,
            diffPct,
            isPositive
        };
    }, [selectedMetric, mult]);

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 400);
    };

    const handleExport = () => {
        window.print();
    };

    return (
        <div className="space-y-6 font-sans text-slate-800 w-full">
            
            {/* 1. CABECERA CON FILTROS E INFO SUPERIOR (ESTILO COMPARATIVAS BI) */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-600">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">MÓDULO BENCHMARK</span>
                        <strong className="text-slate-900 text-sm font-black flex items-center gap-2">
                            <span>📊 Benchmark Histórico YoY</span>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-xl border border-indigo-200">
                                Día Equivalente
                            </span>
                        </strong>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">FECHA ANALIZADA</span>
                        <strong className="text-slate-900 text-sm font-black capitalize">Lunes, 31 de Agosto 2026</strong>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">ALINEACIÓN DÍA COMERCIAL</span>
                        <span className="text-indigo-700 font-black">
                            Lunes 01/09/2025 (Mismo día comercial)
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Selector de Sucursal */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700">
                        <Building2 size={14} className="text-indigo-600 shrink-0" />
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value as StoreKey)}
                            className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer text-xs"
                        >
                            <option value="consolidado">Todas las Sucursales (Consolidado)</option>
                            <option value="heroinas">Heroínas (Cochabamba)</option>
                            <option value="recoleta">Recoleta (Cochabamba)</option>
                            <option value="calacoto">Calacoto (La Paz)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-2xl border border-slate-200/80 cursor-pointer shadow-xs transition-all"
                    >
                        <RefreshCw size={14} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-2xl cursor-pointer shadow-xs transition-all"
                    >
                        <Download size={14} />
                        <span>Exportar</span>
                    </button>
                </div>
            </div>

            {/* 2. DESGLOSE DE MÉTRICAS (METRIC TABS) */}
            <BenchmarkMetricTabs
                activeMetric={selectedMetric}
                onChangeMetric={(metric) => setSelectedMetric(metric)}
            />

            {/* 3. BANNER SUPERIOR KPIS MULTIANUAL (FONDO PASTEL ELEGANTE Y DINÁMICO) */}
            <div className="bg-gradient-to-r from-indigo-50/80 via-sky-50/70 to-slate-50/80 rounded-3xl p-6 border border-indigo-100/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                
                {/* AÑO ACTUAL */}
                <div className="flex-1 pr-4 border-b md:border-b-0 md:border-r border-indigo-200/60 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider block">2026 (AÑO ACTUAL)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-3xl font-black text-indigo-950">{metricYoYData.format(metricYoYData.val2026)}</h2>
                        <span className="text-xs font-bold text-slate-500">Lunes 31 Ago</span>
                    </div>
                </div>

                {/* HACE 1 AÑO */}
                <div className="flex-1 px-0 md:px-4 border-b md:border-b-0 md:border-r border-indigo-200/60 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-sky-900 uppercase tracking-wider block">2025 (AÑO ANTERIOR)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-2xl font-black text-sky-950">{metricYoYData.format(metricYoYData.val2025)}</h2>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border inline-flex items-center gap-1 ${
                            metricYoYData.isPositive
                                ? 'text-emerald-800 bg-emerald-100/90 border-emerald-200/80'
                                : 'text-rose-800 bg-rose-100/90 border-rose-200/80'
                        }`}>
                            {metricYoYData.isPositive ? '▲ +' : '▼ '}{metricYoYData.diffPct.toFixed(1)}%
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Lunes 01 Sept (Equiv.)</span>
                </div>

                {/* VARIACIÓN NETA */}
                <div className="flex-1 px-0 md:px-4 border-b md:border-b-0 md:border-r border-indigo-200/60 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">DIFERENCIA NETA YoY</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className={`text-2xl font-black ${metricYoYData.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metricYoYData.isPositive ? '+' : '-'}{metricYoYData.diffFormat(metricYoYData.diffVal)}
                        </h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">vs Mismo Día Comercial</span>
                </div>

                {/* ESTADO */}
                <div className="flex-1 pl-0 md:pl-4">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">ESTADO COMERCIAL</span>
                    <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/90 border border-emerald-200/80 rounded-xl text-xs font-black text-emerald-900">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            <span>🟢 Superior al año anterior</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. GRÁFICO PRINCIPAL & 5. TABLA HISTÓRICA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 4. GRÁFICO PRINCIPAL (COMPARACIÓN BARRAS HORIZONTALES) */}
                <div className="lg:col-span-7 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                Comparación Día Equivalente (Lunes vs Lunes)
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Visualización directa 2025 vs 2026 sin distorsión de fin de semana
                            </p>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black rounded-xl">
                            +{metricYoYData.diffPct.toFixed(1)}% crecimiento
                        </span>
                    </div>

                    <div className="space-y-4 py-2">
                        {/* Bar 1: Año Anterior 2025 */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                <span>Año Anterior (Lunes 01/09/2025)</span>
                                <span className="font-mono text-slate-800 font-bold">{metricYoYData.format(metricYoYData.val2025)}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-7 rounded-xl overflow-hidden p-1 border border-slate-200/80">
                                <div
                                    className="bg-slate-400 h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2 text-[10px] text-white font-bold font-mono"
                                    style={{ width: `${Math.min(Math.round((metricYoYData.val2025 / metricYoYData.val2026) * 100), 100)}%` }}
                                >
                                    2025
                                </div>
                            </div>
                        </div>

                        {/* Bar 2: Actual 2026 */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                                <span>Actual (Lunes 31/08/2026)</span>
                                <span className="font-mono font-black text-indigo-700">{metricYoYData.format(metricYoYData.val2026)}</span>
                            </div>
                            <div className="w-full bg-indigo-50 h-8 rounded-xl overflow-hidden p-1 border border-indigo-200">
                                <div
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2.5 text-xs text-white font-black font-mono shadow-xs"
                                    style={{ width: '100%' }}
                                >
                                    2026 (Actual)
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 flex items-center justify-between font-medium">
                        <span className="font-bold text-slate-700">Diferencia Neta en Valor:</span>
                        <strong className={`font-mono text-xs font-black ${metricYoYData.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metricYoYData.isPositive ? '+' : '-'}{metricYoYData.diffFormat(metricYoYData.diffVal)}
                        </strong>
                    </div>
                </div>

                {/* 5. EVOLUCIÓN HISTÓRICA DEL MISMO DÍA (TABLA) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">
                            Histórico de Lunes Equivalentes
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Tendencia del mismo patrón comercial (4 años)
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200/80">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Fecha</th>
                                    <th className="py-2.5 px-3">Día</th>
                                    <th className="py-2.5 px-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                <tr className="bg-indigo-50/70 font-bold text-indigo-950">
                                    <td className="py-2.5 px-3 font-mono">31/08/2026</td>
                                    <td className="py-2.5 px-3">Lunes</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-black">
                                        {metricYoYData.format(metricYoYData.val2026)}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono text-slate-600">01/09/2025</td>
                                    <td className="py-2.5 px-3 text-slate-600">Lunes</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
                                        {metricYoYData.format(metricYoYData.val2025)}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono text-slate-600">02/09/2024</td>
                                    <td className="py-2.5 px-3 text-slate-600">Lunes</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
                                        {metricYoYData.format(metricYoYData.val2024)}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono text-slate-600">04/09/2023</td>
                                    <td className="py-2.5 px-3 text-slate-600">Lunes</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
                                        {metricYoYData.format(metricYoYData.val2023)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 6. PANEL DE INTERPRETACIÓN IA */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xs flex items-start gap-4">
                <div className="p-3 bg-white/10 border border-white/20 rounded-2xl text-amber-300 shrink-0">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                            🤖 Diagnóstico IA — Benchmark YoY
                        </h4>
                        <span className="px-2 py-0.5 bg-white/10 text-indigo-200 text-[10px] font-bold rounded-md">
                            IA Analytica Engine
                        </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        Las ventas aumentaron <strong className="text-emerald-400">+{metricYoYData.diffPct.toFixed(1)}%</strong> respecto al lunes equivalente del año anterior. El crecimiento fue generado principalmente por un incremento de <strong className="text-indigo-200">+{metricYoYData.clientGrowthPct}% en clientes atendidos</strong> y un <strong className="text-indigo-200">+{metricYoYData.ticketGrowthPct}% en el ticket promedio</strong>.
                    </p>
                    <div className="pt-1 text-xs font-bold text-amber-200 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                        <span>Recomendación: Mantener disponibilidad operativa.</span>
                    </div>
                </div>
            </div>

            {/* 7. PIE DEL COMPONENTE */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-3 border-t border-slate-200/80 px-2">
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Última actualización: <strong>{currentTimestamp}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                    <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Fuente: MongoDB colección <code className="font-mono text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">'sales'</code></span>
                </div>
            </div>
        </div>
    );
};
