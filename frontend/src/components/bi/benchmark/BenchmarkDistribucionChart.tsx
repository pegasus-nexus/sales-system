import React from 'react';
import { Target, Trophy, Info } from 'lucide-react';
import type { MetricKey } from './BenchmarkTypes';
import { METRIC_TITLES } from './BenchmarkTypes';

interface Props {
    selectedMetric: MetricKey;
    p25: number;
    p50: number;
    p75: number;
    todaySales: number;
    percentilePositionPct: number;
    formatValue: (val: number) => string;
    unitName: string;
}

export const BenchmarkDistribucionChart: React.FC<Props> = ({
    selectedMetric,
    p25,
    p50,
    p75,
    todaySales,
    percentilePositionPct,
    formatValue,
    unitName
}) => {
    const metricTitle = METRIC_TITLES[selectedMetric] || 'Ventas por día (Bs.)';
    const topPercentage = Math.max(100 - percentilePositionPct, 1);
    const vsP50Pct = p50 > 0 ? Math.round(((todaySales - p50) / p50) * 100) : 0;

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            {/* Header compacto */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                        <Target className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            Distribución Histórica (365 días)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            Ubicación analítica del día respecto al historial de: <strong className="text-slate-800">{metricTitle}</strong>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Top {topPercentage.toFixed(0)}% del año</span>
                    </span>
                </div>
            </div>

            {/* Barra visual de distribución compacta */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        P25 (Riesgo): {formatValue(p25)}
                    </span>
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        P50 (Mediana): {formatValue(p50)}
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        P75 (Meta): {formatValue(p75)}
                    </span>
                </div>

                {/* Progress bar estilizada de 3 zonas con Pin de HOY */}
                <div className="relative h-4 bg-slate-200 rounded-full overflow-visible flex items-center">
                    <div className="w-1/3 h-full bg-rose-400/80 rounded-l-full" title="Zona de Riesgo" />
                    <div className="w-1/3 h-full bg-blue-400/80" title="Zona Normal" />
                    <div className="w-1/3 h-full bg-emerald-400/80 rounded-r-full" title="Zona de Meta" />

                    {/* Indicador flotante HOY */}
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center"
                        style={{ left: `${Math.min(Math.max(percentilePositionPct, 5), 95)}%` }}
                    >
                        <div className="w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-md" />
                        <span className="bg-indigo-700 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs font-mono whitespace-nowrap mt-0.5">
                            Hoy: {formatValue(todaySales)} ({vsP50Pct >= 0 ? `+${vsP50Pct}%` : `${vsP50Pct}%`})
                        </span>
                    </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>Mínimo</span>
                    <span>25% del año</span>
                    <span>50% del año</span>
                    <span>75% del año</span>
                    <span>Máximo</span>
                </div>
            </div>

            {/* Pie de página aclaratorio gerencial super limpio */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[11px]">
                        El resultado actual supera al <strong>{percentilePositionPct.toFixed(0)}%</strong> de todas las jornadas del año móvil evaluado.
                    </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                    Unidad: {unitName}
                </span>
            </div>
        </div>
    );
};
