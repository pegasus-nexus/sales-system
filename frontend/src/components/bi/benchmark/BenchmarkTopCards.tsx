import React from 'react';
import { Zap, CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface Props {
    p25: number;
    p50: number;
    p75: number;
    todaySales: number;
    vsP50Pct: number;
    percentilePositionPct: number;
    formatValue: (val: number) => string;
    dayName?: string;
    promedioEquivalente?: number;
    variacionEquivalentePct?: number;
}

export const BenchmarkTopCards: React.FC<Props> = ({
    p25,
    p50,
    p75,
    todaySales,
    vsP50Pct,
    percentilePositionPct,
    formatValue,
    dayName = 'Lunes',
    promedioEquivalente = 5840,
    variacionEquivalentePct = 13.5
}) => {
    let statusText = 'Alto rendimiento';
    let StatusIcon = CheckCircle2;
    let statusBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';

    if (todaySales < p25) {
        statusText = 'Crítico operativo';
        StatusIcon = XCircle;
        statusBg = 'bg-rose-100 text-rose-800 border-rose-200';
    } else if (todaySales < p50) {
        statusText = 'Bajo la mediana';
        StatusIcon = AlertTriangle;
        statusBg = 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (todaySales <= p75) {
        statusText = 'Normal (Esperado)';
        StatusIcon = Activity;
        statusBg = 'bg-blue-100 text-blue-800 border-blue-200';
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: P25 (Percentil 25) */}
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0"></span> P25 (Percentil 25)
                    </span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase border border-rose-200">
                        CRÍTICO
                    </span>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-black text-rose-700 font-mono">
                        {formatValue(p25)}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                        25% de los días están por debajo
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Mínimo recomendado
                    </div>
                </div>
            </div>

            {/* Card 2: P50 (Mediana) */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0"></span> P50 (Mediana)
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase border border-blue-200">
                        NORMAL
                    </span>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-black text-blue-700 font-mono">
                        {formatValue(p50)}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                        50% de los días están por debajo
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Punto medio histórico
                    </div>
                </div>
            </div>

            {/* Card 3: P75 (Percentil 75) */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0"></span> P75 (Percentil 75)
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase border border-emerald-200">
                        META
                    </span>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-black text-emerald-700 font-mono">
                        {formatValue(p75)}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                        75% de los días están por debajo
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Nivel alto esperado
                    </div>
                </div>
            </div>

            {/* Card 4: POSICIÓN ACTUAL / HOY matching media_1788911167771.jpg */}
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-purple-600 fill-purple-600" /> POSICIÓN ACTUAL
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${statusBg}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusText}</span>
                    </span>
                </div>

                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 font-mono">{formatValue(todaySales)}</span>
                        <span className={`text-xs font-black font-mono ${vsP50Pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {vsP50Pct >= 0 ? `▲ +${vsP50Pct.toFixed(0)}%` : `▼ ${vsP50Pct.toFixed(0)}%`}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900 mt-1">
                        <span>Sobre el <strong>{percentilePositionPct.toFixed(0)}%</strong> del histórico</span>
                        <span className="font-mono text-slate-500 text-[11px]">{percentilePositionPct.toFixed(0)}%</span>
                    </div>

                    {/* Progress bar matching media_1788911167771.jpg */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200 mt-1">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-700"
                            style={{ width: `${percentilePositionPct}%` }}
                        />
                    </div>
                </div>

                {/* Subcard Días Equivalentes matching media_1788911167771.jpg */}
                <div className="grid grid-cols-3 gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center text-[10px] pt-1.5">
                    <div>
                        <span className="text-slate-400 font-medium block">Día equivalente:</span>
                        <strong className="text-slate-800 font-bold block">{dayName}</strong>
                    </div>
                    <div className="border-x border-slate-200 px-1">
                        <span className="text-slate-400 font-medium block">Promedio (12 {dayName.toLowerCase()}s):</span>
                        <strong className="text-slate-800 font-bold block font-mono">{formatValue(promedioEquivalente)}</strong>
                    </div>
                    <div>
                        <span className="text-slate-400 font-medium block">Variación:</span>
                        <strong className={`font-bold font-mono block ${variacionEquivalentePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {variacionEquivalentePct >= 0 ? `+${variacionEquivalentePct.toFixed(1)}%` : `${variacionEquivalentePct.toFixed(1)}%`}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

