import React from 'react';
import { Calendar, Target, Sparkles, TrendingUp } from 'lucide-react';
import type { DayDetailData } from './BenchmarkTypes';

interface BenchmarkEquivalentesCardProps {
    currentConfigName: string;
    formatValue: (val: number) => string;
    todayData: DayDetailData;
    resumenMes: {
        altos: { count: number; pct: string };
        normales: { count: number; pct: string };
        bajos: { count: number; pct: string };
        criticos: { count: number; pct: string };
        sinDatos: { count: number; pct: string };
    };
    percentiles: { p25: number; p50: number; p75: number };
}

export const BenchmarkEquivalentesCard: React.FC<BenchmarkEquivalentesCardProps> = ({
    currentConfigName,
    formatValue,
    todayData,
    resumenMes,
    percentiles
}) => {
    const isPositive = todayData.vsEquivalentePct >= 0;

    return (
        <div className="space-y-6">

            {/* SECCIÓN A: RESUMEN EJECUTIVO DEL PERÍODO */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={16} />
                            <span>Resumen Ejecutivo del Período Evaluado</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">Distribución Mensual de Desempeño Operativo</h3>
                        <p className="text-xs text-slate-500">
                            Evaluación acumulada de 31 días comparados contra la distribución de 365 días en <strong>{currentConfigName}</strong>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-3.5 py-2 text-center">
                            <div className="text-[10px] text-emerald-800 uppercase font-bold">🟢 Días Altos</div>
                            <div className="text-base font-bold text-emerald-700">{resumenMes.altos.count} <span className="text-xs font-normal text-emerald-600">({resumenMes.altos.pct})</span></div>
                        </div>
                        <div className="bg-sky-50 border border-sky-200/80 rounded-xl px-3.5 py-2 text-center">
                            <div className="text-[10px] text-sky-800 uppercase font-bold">🟡 Días Normales</div>
                            <div className="text-base font-bold text-sky-700">{resumenMes.normales.count} <span className="text-xs font-normal text-sky-600">({resumenMes.normales.pct})</span></div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2 text-center">
                            <div className="text-[10px] text-amber-800 uppercase font-bold">🟠 Días Bajos</div>
                            <div className="text-base font-bold text-amber-700">{resumenMes.bajos.count} <span className="text-xs font-normal text-amber-600">({resumenMes.bajos.pct})</span></div>
                        </div>
                        <div className="bg-rose-50 border border-rose-200/80 rounded-xl px-3.5 py-2 text-center">
                            <div className="text-[10px] text-rose-800 uppercase font-bold">🔴 Días Críticos</div>
                            <div className="text-base font-bold text-rose-700">{resumenMes.criticos.count} <span className="text-xs font-normal text-rose-600">({resumenMes.criticos.pct})</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN B & C: DÍAS EQUIVALENTES & GAUGE PERCENTIL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* SECCIÓN B: DÍAS EQUIVALENTES (Mód 1) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Calendar size={18} />
                                <span>Módulo 1: Días Equivalentes ({todayData.dayOfWeek}s)</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Compara hoy contra los últimos 52 {todayData.dayOfWeek}s históricos del negocio.
                            </p>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                            52 Semanas
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-slate-500 font-medium">Venta Registrada Hoy ({todayData.dateStr})</div>
                                <div className="text-2xl font-bold text-slate-900 mt-0.5">{formatValue(todayData.sales)}</div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1 ${
                                isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                                <TrendingUp size={14} className={isPositive ? '' : 'rotate-180'} />
                                <span>{isPositive ? '+' : ''}{todayData.vsEquivalentePct.toFixed(1)}% vs Mediana</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3">
                                <span className="text-slate-500 block text-[11px] font-medium">Mediana P50 Equivalente</span>
                                <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">{formatValue(todayData.equivalenteP50)}</span>
                                <span className="text-[10px] text-slate-400 mt-1 block">Esperado para un {todayData.dayOfWeek} habitual</span>
                            </div>

                            <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3">
                                <span className="text-slate-500 block text-[11px] font-medium">Meta P75 Equivalente</span>
                                <span className="text-sm font-bold text-emerald-700 font-mono mt-0.5 block">{formatValue(todayData.equivalenteP50 * 1.25)}</span>
                                <span className="text-[10px] text-slate-400 mt-1 block">Cuartil superior de {todayData.dayOfWeek}s</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN C: GAUGE DE DISTRIBUCIÓN PERCENTIL (Mód 2) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Target size={18} />
                                <span>Módulo 2: Distribución Histórica Percentil</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Ubicación de la venta actual dentro de la escala móvil de 365 días.
                            </p>
                        </div>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            365 Días
                        </span>
                    </div>

                    {/* Barra de Distribución de Rangos */}
                    <div className="space-y-4 pt-2">
                        <div className="relative">
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                                <div className="h-full bg-rose-200/80 w-1/4 border-r border-white" title="Crítico (<P25)" />
                                <div className="h-full bg-amber-200/80 w-1/4 border-r border-white" title="Bajo (P25-P50)" />
                                <div className="h-full bg-sky-200/80 w-1/4 border-r border-white" title="Normal (P50-P75)" />
                                <div className="h-full bg-emerald-200/80 w-1/4" title="Alto (>P75)" />
                            </div>

                            {/* Pin indicador de la posición del día actual */}
                            <div
                                className="absolute -top-3 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                                style={{ left: `${todayData.posPct}%` }}
                            >
                                <span className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
                                    Hoy
                                </span>
                                <div className="w-0.5 h-6 bg-indigo-600 shadow" />
                            </div>
                        </div>

                        {/* Leyenda de Percentiles */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                            <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200/60">
                                <span className="text-[10px] text-rose-700 font-bold block">P25 (Crítico)</span>
                                <span className="font-mono text-slate-800 font-bold text-xs">{formatValue(percentiles.p25)}</span>
                            </div>
                            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                                <span className="text-[10px] text-amber-800 font-bold block">P50 (Mediana)</span>
                                <span className="font-mono text-slate-800 font-bold text-xs">{formatValue(percentiles.p50)}</span>
                            </div>
                            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
                                <span className="text-[10px] text-emerald-800 font-bold block">P75 (Meta)</span>
                                <span className="font-mono text-slate-800 font-bold text-xs">{formatValue(percentiles.p75)}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
