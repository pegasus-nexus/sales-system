import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import type { DayDetailData, MonthTrendPoint } from './BenchmarkTypes';

interface Props {
    processedDays: DayDetailData[];
    onSelectDay: (day: DayDetailData) => void;
    resumenMes: {
        altos: { count: number; pct: string };
        normales: { count: number; pct: string };
        bajos: { count: number; pct: string };
        criticos: { count: number; pct: string };
        sinDatos: { count: number; pct: string };
    };
    monthTrendData: MonthTrendPoint[];
    formatValue: (val: number) => string;
}

export const BenchmarkCalendarSection: React.FC<Props> = ({
    processedDays,
    onSelectDay,
    resumenMes,
    monthTrendData,
    formatValue
}) => {
    const [currentMonthName, setCurrentMonthName] = useState<string>('Agosto 2026');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT SIDE: CALENDARIO BENCHMARK (8 COLUMNAS) */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Header & Month Navigator */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900">
                            Calendario Benchmark
                        </h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentMonthName('Julio 2026')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 font-mono">
                            {currentMonthName}
                        </span>
                        <button
                            onClick={() => setCurrentMonthName('Septiembre 2026')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map((d) => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 py-1 font-mono uppercase tracking-wider">
                            {d}
                        </div>
                    ))}

                    {processedDays.map((d) => {
                        let cardStyle = 'bg-slate-50 border-slate-200 text-slate-800';
                        let badgeStyle = 'bg-slate-200 text-slate-700';
                        let statusText = '⚪ Sin datos';

                        if (d.isPronostico) {
                            cardStyle = 'bg-indigo-50/40 border-indigo-200/80 border-dashed text-indigo-950';
                            badgeStyle = 'bg-indigo-100 text-indigo-700 border border-indigo-200';
                            statusText = '🪄 Pronóstico';
                        } else if (d.status === 'alto') {
                            cardStyle = 'bg-emerald-50/60 border-emerald-300 text-emerald-950';
                            badgeStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                            statusText = '🟢 Alto';
                        } else if (d.status === 'normal') {
                            cardStyle = 'bg-blue-50/60 border-blue-300 text-blue-950';
                            badgeStyle = 'bg-blue-100 text-blue-800 border border-blue-200';
                            statusText = '🔵 Normal';
                        } else if (d.status === 'bajo') {
                            cardStyle = 'bg-amber-50/60 border-amber-300 text-amber-950';
                            badgeStyle = 'bg-amber-100 text-amber-800 border border-amber-200';
                            statusText = '🟡 Bajo';
                        } else if (d.status === 'critico') {
                            cardStyle = 'bg-rose-50/60 border-rose-300 text-rose-950';
                            badgeStyle = 'bg-rose-100 text-rose-800 border border-rose-200';
                            statusText = '🔴 Crítico';
                        }

                        return (
                            <button
                                key={d.day}
                                onClick={() => onSelectDay(d)}
                                className={`p-2.5 border rounded-2xl flex flex-col justify-between transition-all hover:scale-102 hover:shadow-md text-left ${cardStyle}`}
                            >
                                {/* Header: Day Number + Name + Status */}
                                <div className="flex items-center justify-between w-full mb-1">
                                    <span className="font-bold text-slate-900 font-mono text-xs">
                                        {d.day} <span className="text-[10px] text-slate-500 font-normal uppercase">{d.dayOfWeek}</span>
                                    </span>
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
                                        {statusText}
                                    </span>
                                </div>

                                {/* Body: Sales & % vs historical */}
                                <div className="my-1 space-y-0.5">
                                    {d.sales > 0 ? (
                                        <>
                                            <div className="text-xs font-extrabold text-slate-900 font-mono">
                                                {formatValue(d.sales)}
                                            </div>
                                            <div className={`text-[10px] font-bold font-mono ${d.vsP50 >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {d.vsP50 >= 0 ? `▲ +${d.vsP50}% vs hist.` : `▼ ${d.vsP50}% vs hist.`}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-mono pt-0.5 border-t border-slate-200/50">
                                                <span>Ped: <strong>{d.orders}</strong></span> • <span>Tkt: <strong>Bs.{d.ticketMedio.toFixed(0)}</strong></span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] text-slate-400 italic">
                                            Sin ventas
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Pin Bar (P25 •──── P50 ────• P75) */}
                                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[8px] font-mono text-slate-400">
                                    <span>P25</span>
                                    <div className="relative w-full mx-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="absolute top-0 bottom-0 bg-indigo-600 rounded-full"
                                            style={{ left: `${Math.max(d.posPct - 5, 0)}%`, width: '10%' }}
                                        />
                                    </div>
                                    <span>P75</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT SIDE: PANEL RESUMEN LATERAL (4 COLUMNAS) */}
            <div className="lg:col-span-4 space-y-4">
                {/* A) Estado del Período */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            A) Estado del Período
                        </h4>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            {currentMonthName}
                        </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                        Días analizados: <strong className="text-slate-900 font-mono">31</strong>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span> 🟢 Alto
                            </span>
                            <span className="font-mono font-extrabold text-emerald-900">{resumenMes.altos.count} días</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-200">
                            <span className="font-bold text-blue-800 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block"></span> 🔵 Normal
                            </span>
                            <span className="font-mono font-extrabold text-blue-900">{resumenMes.normales.count} días</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200">
                            <span className="font-bold text-amber-800 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block"></span> 🟡 Bajo
                            </span>
                            <span className="font-mono font-extrabold text-amber-900">{resumenMes.bajos.count} días</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200">
                            <span className="font-bold text-rose-800 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block"></span> 🔴 Crítico
                            </span>
                            <span className="font-mono font-extrabold text-rose-900">{resumenMes.criticos.count} días</span>
                        </div>
                    </div>
                </div>

                {/* B) Tendencia Histórica (12 meses) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            B) Tendencia Histórica
                        </h4>
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> ↑ +18% crecimiento
                        </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                        Evolución mensual consolidada (Últimos 12 meses):
                    </p>

                    {/* Mini Sparkline Bar Chart */}
                    <div className="h-24 flex items-end justify-between gap-1 pt-2">
                        {monthTrendData.map((pt) => {
                            const maxVal = Math.max(...monthTrendData.map(m => m.value), 1);
                            const barPct = Math.max((pt.value / maxVal) * 100, 10);

                            return (
                                <div key={pt.month} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full bg-slate-100 rounded-t-md h-full flex items-end overflow-hidden">
                                        <div 
                                            className="w-full bg-indigo-600 group-hover:bg-indigo-500 transition-all rounded-t-md"
                                            style={{ height: `${barPct}%` }}
                                            title={`${pt.month}: Bs. ${pt.value}`}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-slate-500">{pt.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* C) Diagnóstico IA Mini */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Diagnóstico Sintético IA</span>
                    </div>
                    <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                        El negocio presenta un rendimiento <strong>superior al comportamiento histórico</strong> acumulado. Se detectó fuerte tráfíco en horas de almuerzo.
                    </p>
                </div>
            </div>
        </div>
    );
};
