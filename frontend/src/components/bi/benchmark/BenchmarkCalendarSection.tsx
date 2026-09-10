import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, BarChart3, TrendingDown } from 'lucide-react';
import type { DayDetailData } from './BenchmarkTypes';

interface Props {
    processedDays: DayDetailData[];
    onSelectDay: (day: DayDetailData) => void;
    metricTitle?: string;
    formatValue: (val: number) => string;
}

export const BenchmarkCalendarSection: React.FC<Props> = ({
    processedDays,
    onSelectDay,
    metricTitle = 'Ventas por día (Bs.)',
    formatValue
}) => {
    const [currentMonthName, setCurrentMonthName] = useState<string>('Agosto 2026');

    // Calculate monthly statistics from processedDays
    const validDays = processedDays.filter(d => d.sales > 0);
    const totalSalesMonth = validDays.reduce((acc, d) => acc + d.sales, 0);
    const avgDailyMonth = validDays.length > 0 ? totalSalesMonth / validDays.length : 0;
    
    // Sort to find highest and lowest days
    const sortedDays = [...validDays].sort((a, b) => b.sales - a.sales);
    const highestDay = sortedDays[0] || { sales: 6627, fullDateStr: '31/08/2026' };
    const lowestDay = sortedDays[sortedDays.length - 1] || { sales: 1373, fullDateStr: '10/08/2026' };

    // Count distribution ranges
    const criticosCount = processedDays.filter(d => d.status === 'critico').length;
    const bajosCount = processedDays.filter(d => d.status === 'bajo').length;
    const normalesCount = processedDays.filter(d => d.status === 'normal').length;
    const altosCount = processedDays.filter(d => d.status === 'alto').length;
    const sinDatosCount = processedDays.filter(d => d.sales === 0 || d.status === 'sin_ventas').length;
    const totalCount = processedDays.length || 31;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
            {/* LEFT SIDE: CALENDARIO DE RENDIMIENTO HISTÓRICO (8 COLUMNAS) */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                {/* Header & Month Navigator */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-2xl shrink-0">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                                Calendario de rendimiento histórico
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {metricTitle} - {currentMonthName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            {currentMonthName}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentMonthName('Julio 2026')}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
                                title="Mes anterior"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentMonthName('Septiembre 2026')}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
                                title="Mes siguiente"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Days Grid (Lun, Mar, Mie, Jue, Vie, Sab, Dom) */}
                <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d) => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 py-1 uppercase tracking-wider font-mono">
                            {d}
                        </div>
                    ))}

                    {processedDays.map((d) => {
                        let cardStyle = 'bg-slate-50 border-slate-200 text-slate-800';
                        let dotColor = 'bg-slate-300';
                        let pctColor = 'text-slate-500';

                        if (d.status === 'alto') {
                            cardStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:bg-emerald-100/80';
                            dotColor = 'bg-emerald-500';
                            pctColor = 'text-emerald-600';
                        } else if (d.status === 'normal') {
                            cardStyle = 'bg-blue-50/70 border-blue-200 text-blue-950 hover:bg-blue-100/80';
                            dotColor = 'bg-blue-500';
                            pctColor = 'text-blue-600';
                        } else if (d.status === 'bajo') {
                            cardStyle = 'bg-amber-50/70 border-amber-200 text-amber-950 hover:bg-amber-100/80';
                            dotColor = 'bg-amber-500';
                            pctColor = 'text-amber-600';
                        } else if (d.status === 'critico') {
                            cardStyle = 'bg-rose-50/70 border-rose-200 text-rose-950 hover:bg-rose-100/80';
                            dotColor = 'bg-rose-500';
                            pctColor = 'text-rose-600';
                        }

                        return (
                            <button
                                key={d.day}
                                onClick={() => onSelectDay(d)}
                                className={`p-2.5 border rounded-2xl flex flex-col justify-between transition-all hover:scale-102 hover:shadow-md text-left min-h-[78px] cursor-pointer ${cardStyle}`}
                            >
                                {/* Top: Day number + Colored status dot */}
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-black text-slate-900 text-xs">
                                        {d.day}
                                    </span>
                                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${dotColor}`} />
                                </div>

                                {/* Body: Formatted Sales & % vs P50 */}
                                <div className="my-0.5">
                                    {d.sales > 0 ? (
                                        <>
                                            <div className="text-xs font-black text-slate-900 font-mono truncate">
                                                {formatValue(d.sales)}
                                            </div>
                                            <div className={`text-[10px] font-bold font-mono ${pctColor}`}>
                                                {d.vsP50 >= 0 ? `+${d.vsP50}%` : `${d.vsP50}%`}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] text-slate-400 italic">
                                            Sin ventas
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Legend Bar matching media_1788911167771.jpg */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        <span>Crítico (&lt; P25)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span>Bajo (P25 - P50)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                        <span>Normal (P50 - P75)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Alto (&gt; P75)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                        <span>Sin datos</span>
                    </span>
                </div>
            </div>

            {/* RIGHT SIDE: PANEL DE RESUMEN Y ESTADÍSTICAS DEL MES (4 COLUMNAS) */}
            <div className="lg:col-span-4 space-y-4">
                {/* 1. Resumen de la distribución (365 días) matching media_1788911167771.jpg */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">
                            Resumen de la distribución (365 días)
                        </h4>
                    </div>

                    <div className="space-y-2.5 text-xs pt-1">
                        {/* Críticos */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium shrink-0 w-36">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="truncate">Días críticos (&lt; P25)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mx-1">
                                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(criticosCount / totalCount) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                                <span className="font-extrabold text-slate-900 w-5 text-right">{criticosCount}</span>
                                <span className="text-[11px] text-slate-400 w-10 text-right">{((criticosCount / totalCount) * 100).toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Bajos */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium shrink-0 w-36">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <span className="truncate">Días bajos (P25 - P50)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mx-1">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(bajosCount / totalCount) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                                <span className="font-extrabold text-slate-900 w-5 text-right">{bajosCount}</span>
                                <span className="text-[11px] text-slate-400 w-10 text-right">{((bajosCount / totalCount) * 100).toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Normales */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium shrink-0 w-36">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="truncate">Días normales (P50–P75)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mx-1">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(normalesCount / totalCount) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                                <span className="font-extrabold text-slate-900 w-5 text-right">{normalesCount}</span>
                                <span className="text-[11px] text-slate-400 w-10 text-right">{((normalesCount / totalCount) * 100).toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Altos */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium shrink-0 w-36">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate">Días altos (&gt; P75)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mx-1">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(altosCount / totalCount) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                                <span className="font-extrabold text-slate-900 w-5 text-right">{altosCount}</span>
                                <span className="text-[11px] text-slate-400 w-10 text-right">{((altosCount / totalCount) * 100).toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Sin datos */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium shrink-0 w-36">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                                <span className="truncate">Sin datos</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mx-1">
                                <div className="bg-slate-300 h-full rounded-full" style={{ width: `${(sinDatosCount / totalCount) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                                <span className="font-bold text-slate-700 w-5 text-right">{sinDatosCount}</span>
                                <span className="text-[11px] text-slate-400 w-10 text-right">{((sinDatosCount / totalCount) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Estadísticas del mes (Agosto 2026) matching media_1788911167771.jpg */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">
                            Estadísticas del mes ({currentMonthName})
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        {/* Metrics Left */}
                        <div className="space-y-3">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total del mes</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-slate-900 font-mono">{formatValue(totalSalesMonth)}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 font-mono">▲ +18%</span>
                                </div>
                                <span className="text-[10px] text-slate-400">vs. mes anterior</span>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Promedio diario</span>
                                <div className="text-sm font-black text-slate-800 font-mono">
                                    {formatValue(avgDailyMonth)}
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mediana diaria</span>
                                <div className="text-sm font-black text-slate-800 font-mono">
                                    Bs. 2.810
                                </div>
                            </div>
                        </div>

                        {/* Right Subcards (Highest & Lowest Day) */}
                        <div className="space-y-2">
                            {/* Día más alto */}
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-2.5 flex items-center gap-2.5">
                                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-emerald-800 block">Día más alto</span>
                                    <span className="text-xs font-black text-emerald-950 font-mono block">{formatValue(highestDay.sales)}</span>
                                    <span className="text-[9px] text-emerald-700 font-mono">{highestDay.fullDateStr || '31/08/2026'}</span>
                                </div>
                            </div>

                            {/* Día más bajo */}
                            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-2.5 flex items-center gap-2.5">
                                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                                    <TrendingDown className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-rose-800 block">Día más bajo</span>
                                    <span className="text-xs font-black text-rose-950 font-mono block">{formatValue(lowestDay.sales)}</span>
                                    <span className="text-[9px] text-rose-700 font-mono">{lowestDay.fullDateStr || '10/08/2026'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

