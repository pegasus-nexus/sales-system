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

            {/* MÓDULO 9: RESUMEN EJECUTIVO DEL PERÍODO */}
            <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                            <Sparkles size={16} />
                            <span>Resumen Ejecutivo — Agosto 2026</span>
                        </div>
                        <h3 className="text-xl font-bold">Rendimiento Histórico Consolidado</h3>
                        <p className="text-xs text-indigo-200">
                            Evaluación acumulada de 31 días comparados contra la distribución de 365 días en {currentConfigName}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-2 text-center">
                            <div className="text-[10px] text-emerald-400 uppercase font-semibold">Días Altos</div>
                            <div className="text-lg font-black text-emerald-300">{resumenMes.altos.count} <span className="text-xs font-normal text-emerald-400/80">({resumenMes.altos.pct})</span></div>
                        </div>
                        <div className="bg-sky-950/60 border border-sky-500/40 rounded-xl px-3 py-2 text-center">
                            <div className="text-[10px] text-sky-400 uppercase font-semibold">Días Normales</div>
                            <div className="text-lg font-black text-sky-300">{resumenMes.normales.count} <span className="text-xs font-normal text-sky-400/80">({resumenMes.normales.pct})</span></div>
                        </div>
                        <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl px-3 py-2 text-center">
                            <div className="text-[10px] text-amber-400 uppercase font-semibold">Días Bajos</div>
                            <div className="text-lg font-black text-amber-300">{resumenMes.bajos.count} <span className="text-xs font-normal text-amber-400/80">({resumenMes.bajos.pct})</span></div>
                        </div>
                        <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-center">
                            <div className="text-[10px] text-rose-400 uppercase font-semibold">Días Críticos</div>
                            <div className="text-lg font-black text-rose-300">{resumenMes.criticos.count} <span className="text-xs font-normal text-rose-400/80">({resumenMes.criticos.pct})</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRID MÓDULO 1 & MÓDULO 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* MÓDULO 1: BENCHMARK DÍAS EQUIVALENTES */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                            <Calendar size={18} />
                            <span>Módulo 1: Días Equivalentes ({todayData.dayOfWeek}s)</span>
                        </div>
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                            Últimas 52 Semanas
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-slate-400 font-medium">Venta Registrada Hoy ({todayData.dateStr})</div>
                                <div className="text-2xl font-black text-white mt-0.5">{formatValue(todayData.sales)}</div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1 ${
                                isPositive ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : 'bg-rose-950/80 text-rose-300 border-rose-700'
                            }`}>
                                <TrendingUp size={14} className={isPositive ? '' : 'rotate-180'} />
                                <span>{isPositive ? '+' : ''}{todayData.vsEquivalentePct.toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                                <span className="text-slate-400 block text-[11px]">Mediana P50 Equivalente</span>
                                <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">{formatValue(todayData.equivalenteP50)}</span>
                                <span className="text-[10px] text-slate-500 mt-1 block">P50 histórico de {todayData.dayOfWeek}s</span>
                            </div>

                            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                                <span className="text-slate-400 block text-[11px]">Meta P75 Equivalente</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">{formatValue(todayData.equivalenteP50 * 1.25)}</span>
                                <span className="text-[10px] text-slate-500 mt-1 block">Cuartil superior esperable</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MÓDULO 2: DISTRIBUCIÓN HISTÓRICA VISUAL (GAUGE) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                            <Target size={18} />
                            <span>Módulo 2: Distribución Histórica Percentil</span>
                        </div>
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            365 Días Evaluados
                        </span>
                    </div>

                    {/* Barra de Distribución de Rangos */}
                    <div className="space-y-4 pt-2">
                        <div className="relative">
                            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                                <div className="h-full bg-rose-500/40 w-1/4 border-r border-slate-900" title="Crítico (<P25)" />
                                <div className="h-full bg-amber-500/40 w-1/4 border-r border-slate-900" title="Bajo (P25-P50)" />
                                <div className="h-full bg-sky-500/40 w-1/4 border-r border-slate-900" title="Normal (P50-P75)" />
                                <div className="h-full bg-emerald-500/40 w-1/4" title="Alto (>P75)" />
                            </div>

                            {/* Pin indicador de la posición del día actual */}
                            <div
                                className="absolute -top-3 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                                style={{ left: `${todayData.posPct}%` }}
                            >
                                <span className="bg-white text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded shadow">
                                    Hoy
                                </span>
                                <div className="w-0.5 h-6 bg-white shadow-glow" />
                            </div>
                        </div>

                        {/* Leyenda de Percentiles */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-rose-400 font-bold block">P25 (Crítico)</span>
                                <span className="font-mono text-slate-300 font-bold text-xs">{formatValue(percentiles.p25)}</span>
                            </div>
                            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-sky-400 font-bold block">P50 (Mediana)</span>
                                <span className="font-mono text-slate-300 font-bold text-xs">{formatValue(percentiles.p50)}</span>
                            </div>
                            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-emerald-400 font-bold block">P75 (Meta)</span>
                                <span className="font-mono text-slate-300 font-bold text-xs">{formatValue(percentiles.p75)}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
