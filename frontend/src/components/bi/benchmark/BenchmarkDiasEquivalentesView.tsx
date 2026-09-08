import React from 'react';
import { CalendarCheck, TrendingUp, CheckCircle2, Info, Calendar } from 'lucide-react';
import type { DayDetailData } from './BenchmarkTypes';

interface Props {
    todayData: DayDetailData;
    formatValue: (val: number) => string;
}

export const BenchmarkDiasEquivalentesView: React.FC<Props> = ({
    todayData,
    formatValue
}) => {
    const equivalentDayName = todayData.dayOfWeek || 'Lunes';
    const evaluatedWeeksCount = 12;
    const promedioEquivalente = todayData.equivalenteP50 || 5840.00;
    const hoySales = todayData.sales || 6627.00;
    const diffPct = promedioEquivalente > 0 ? ((hoySales - promedioEquivalente) / promedioEquivalente) * 100 : 0;
    const isPositive = diffPct >= 0;

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700">
                        <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Benchmark por Día Equivalente
                        </h3>
                        <p className="text-xs text-slate-500">
                            Evaluación aislada comparando la jornada actual únicamente contra los <strong>{equivalentDayName}s históricos equivalentes</strong>.
                        </p>
                    </div>
                </div>

                <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-800 text-xs font-bold self-start sm:self-auto font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{todayData.fullDateStr || '31 Ago 2026'}</span>
                </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Promedio Historico de Días Equivalentes */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-1">
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                        Comparación: Últimos {evaluatedWeeksCount} {equivalentDayName}s
                    </span>
                    <div className="text-xl font-bold text-slate-700 font-mono mt-1">
                        Promedio: {formatValue(promedioEquivalente)}
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Mediana estadística del histórico de {equivalentDayName}s
                    </span>
                </div>

                {/* 2. Cifra de Hoy */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-1">
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                        Venta Registrada Hoy ({todayData.dateStr})
                    </span>
                    <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                        Hoy: {formatValue(hoySales)}
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Total transaccionado en el sistema POS
                    </span>
                </div>

                {/* 3. Resultado de Variación */}
                <div className={`border rounded-xl p-4 space-y-1 flex flex-col justify-between ${
                    isPositive ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Resultado
                        </span>
                        {isPositive ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div className={`text-2xl font-black font-mono flex items-center gap-1 ${
                        isPositive ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                        <TrendingUp className={`w-5 h-5 ${isPositive ? '' : 'rotate-180'}`} />
                        <span>{isPositive ? '+' : ''}{diffPct.toFixed(1)}%</span>
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium">
                        {isPositive 
                            ? `Desempeño superior al promedio de ${equivalentDayName}s` 
                            : `Desempeño por debajo del promedio de ${equivalentDayName}s`}
                    </span>
                </div>
            </div>
        </div>
    );
};
