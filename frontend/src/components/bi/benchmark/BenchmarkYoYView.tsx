import React, { useState, useMemo } from 'react';
import {
    RefreshCw, Download, Settings, Database, Calendar, Building2,
    TrendingUp, CheckCircle2, Clock, Sparkles, BarChart2, Lightbulb
} from 'lucide-react';

import type { StoreKey, MetricKey } from './BenchmarkTypes';
import { BenchmarkMetricTabs } from './BenchmarkMetricTabs';

export const BenchmarkYoYView: React.FC = () => {
    const [selectedStore, setSelectedStore] = useState<StoreKey>('consolidado');
    const [selectedMetric, setSelectedMetric] = useState<MetricKey>('ventas');
    const [loading, setLoading] = useState<boolean>(false);

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
        <div className="max-w-[1200px] mx-auto space-y-4 font-sans text-slate-800 bg-slate-50/60 p-3 sm:p-5 rounded-3xl">
            {/* 1. CABECERA DEL MÓDULO */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shrink-0">
                                <BarChart2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <span>📊 Benchmark Histórico YoY</span>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                                        Día Equivalente
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Comparación del rendimiento actual frente al mismo día comercial del año anterior.
                                </p>
                            </div>
                        </div>

                        {/* Chips informativos */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-semibold">
                            {/* Sucursal Dropdown */}
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-xl text-indigo-900 font-bold shadow-2xs">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="text-slate-500 font-medium text-[11px]">Sucursal:</span>
                                <select
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value as StoreKey)}
                                    className="bg-transparent text-indigo-950 font-black focus:outline-none cursor-pointer text-xs"
                                >
                                    <option value="consolidado">Todas las sucursales (Consolidado)</option>
                                    <option value="heroinas">Heroínas (Cochabamba)</option>
                                    <option value="recoleta">Recoleta (Cochabamba)</option>
                                    <option value="calacoto">Calacoto (La Paz)</option>
                                </select>
                            </div>

                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-xl text-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Fecha analizada: <strong className="text-slate-900">31 Agosto 2026</strong></span>
                            </span>

                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-xl text-slate-700">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                                <span>Día comercial: <strong className="text-indigo-700">Lunes</strong></span>
                            </span>

                            <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200/80 rounded-xl text-purple-900">
                                <span>Comparación: <strong className="text-purple-950">01 Septiembre 2025 (Lunes equiv.)</strong></span>
                            </span>

                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
                                <Database className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Fuente: <strong className="font-mono text-emerald-950">MongoDB → sales</strong></span>
                            </span>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                            <span>Actualizar</span>
                        </button>

                        <button
                            onClick={handleExport}
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
                    </div>
                </div>
            </div>

            {/* 6. DESGLOSE DE MÉTRICAS (METRIC TABS) */}
            <BenchmarkMetricTabs
                activeMetric={selectedMetric}
                onChangeMetric={(metric) => setSelectedMetric(metric)}
            />

            {/* 3. TARJETAS KPI SUPERIORES (4 CARDS COMPACTAS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* CARD 1: VENTA ACTUAL */}
                <div className="bg-indigo-600 text-white border border-indigo-700 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-100">
                            VENTA ACTUAL (2026)
                        </span>
                        <span className="p-1 bg-white/20 rounded-lg">
                            <BarChart2 className="w-3.5 h-3.5 text-white" />
                        </span>
                    </div>
                    <div className="my-1.5">
                        <div className="text-xl font-black font-mono tracking-tight">
                            {metricYoYData.format(metricYoYData.val2026)}
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-100 mt-0.5">
                            Lunes 31 Agosto 2026
                        </div>
                    </div>
                </div>

                {/* CARD 2: MISMO DÍA AÑO ANTERIOR */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                            MISMO DÍA AÑO ANTERIOR
                        </span>
                        <span className="p-1 bg-slate-100 rounded-lg text-slate-600">
                            <Calendar className="w-3.5 h-3.5" />
                        </span>
                    </div>
                    <div className="my-1.5">
                        <div className="text-xl font-black text-slate-700 font-mono tracking-tight">
                            {metricYoYData.format(metricYoYData.val2025)}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                            Lunes 01 Septiembre 2025
                        </div>
                    </div>
                </div>

                {/* CARD 3: VARIACIÓN YoY */}
                <div className={`border rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between ${
                    metricYoYData.isPositive
                        ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider">
                            VARIACIÓN YoY
                        </span>
                        <span className={`p-1 rounded-lg ${
                            metricYoYData.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                            <TrendingUp className={`w-3.5 h-3.5 ${metricYoYData.isPositive ? '' : 'rotate-180'}`} />
                        </span>
                    </div>
                    <div className="my-1.5">
                        <div className={`text-xl font-black font-mono tracking-tight ${
                            metricYoYData.isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                            {metricYoYData.isPositive ? '▲ +' : '▼ '}{metricYoYData.diffPct.toFixed(1)}%
                        </div>
                        <div className="text-[11px] font-bold mt-0.5">
                            {metricYoYData.isPositive ? '+' : '-'}{metricYoYData.diffFormat(metricYoYData.diffVal)} vs año anterior
                        </div>
                    </div>
                </div>

                {/* CARD 4: ESTADO DEL NEGOCIO */}
                <div className="bg-white border-2 border-indigo-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">
                            ESTADO DEL NEGOCIO
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="my-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-black">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>🟢 Mejor rendimiento histórico</span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-bold mt-1">
                            Superior al año anterior
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. GRÁFICO PRINCIPAL & 5. TABLA HISTÓRICA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 4. GRÁFICO PRINCIPAL (COMPARACIÓN BARRAS HORIZONTALES) */}
                <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
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
                                <span className="font-mono text-slate-800">{metricYoYData.format(metricYoYData.val2025)}</span>
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

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-600 flex items-center justify-between font-medium">
                        <span>Diferencia Neta en Valor:</span>
                        <strong className={`font-mono text-xs ${metricYoYData.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {metricYoYData.isPositive ? '+' : '-'}{metricYoYData.diffFormat(metricYoYData.diffVal)}
                        </strong>
                    </div>
                </div>

                {/* 5. EVOLUCIÓN HISTÓRICA DEL MISMO DÍA (TABLA) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
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

            {/* 7. PANEL DE INTERPRETACIÓN IA */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-md flex items-start gap-4">
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

            {/* 8. PIE DEL COMPONENTE */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-3 border-t border-slate-200/80 px-1">
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Última actualización: <strong>31/08/2026 19:50:22</strong></span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                    <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Fuente: MongoDB colección <code className="font-mono text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">'sales'</code></span>
                </div>
            </div>
        </div>
    );
};
