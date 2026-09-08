import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
    p25: number;
    p50: number;
    p75: number;
    todaySales: number;
    vsP50Pct: number;
    percentilePositionPct: number;
    formatValue: (val: number) => string;
}

export const BenchmarkTopCards: React.FC<Props> = ({
    p25,
    p50,
    p75,
    todaySales,
    vsP50Pct,
    percentilePositionPct,
    formatValue
}) => {
    let statusText = '🟢 Alto rendimiento';
    let statusBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (todaySales < p25) {
        statusText = '🔴 Crítico operativo';
        statusBg = 'bg-rose-50 border-rose-200 text-rose-800';
    } else if (todaySales < p50) {
        statusText = '🟡 Bajo la mediana';
        statusBg = 'bg-amber-50 border-amber-200 text-amber-800';
    } else if (todaySales <= p75) {
        statusText = '🔵 Normal (Esperado)';
        statusBg = 'bg-blue-50 border-blue-200 text-blue-800';
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: P25 (Crítico) */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block"></span> P25
                    </span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-rose-200">
                        CRÍTICO
                    </span>
                </div>
                <div className="my-3">
                    <div className="text-2xl font-bold text-rose-700 font-mono">
                        {formatValue(p25)}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                        Mínimo recomendado
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Límite inferior dinámico
                    </div>
                </div>
            </div>

            {/* Card 2: P50 (Normal) */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block"></span> P50
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-blue-200">
                        NORMAL
                    </span>
                </div>
                <div className="my-3">
                    <div className="text-2xl font-bold text-blue-700 font-mono">
                        {formatValue(p50)}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                        Punto medio histórico
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Mediana del negocio
                    </div>
                </div>
            </div>

            {/* Card 3: P75 (Meta) */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span> P75
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-emerald-200">
                        META
                    </span>
                </div>
                <div className="my-3">
                    <div className="text-2xl font-bold text-emerald-700 font-mono">
                        {formatValue(p75)}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                        Nivel alto esperado
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Rendimiento superior
                    </div>
                </div>
            </div>

            {/* Card 4: POSICIÓN ACTUAL / HOY */}
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-indigo-600" /> POSICIÓN ACTUAL
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBg}`}>
                        {statusText}
                    </span>
                </div>
                <div className="my-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 font-mono">{formatValue(todaySales)}</span>
                        <span className={`text-xs font-bold font-mono ${vsP50Pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {vsP50Pct >= 0 ? `▲ +${vsP50Pct.toFixed(0)}%` : `▼ ${vsP50Pct.toFixed(0)}%`}
                        </span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-700 mt-1">
                        Sobre el <strong>{percentilePositionPct.toFixed(0)}%</strong> del histórico
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                        Situación operacional de hoy
                    </div>
                </div>
            </div>
        </div>
    );
};
