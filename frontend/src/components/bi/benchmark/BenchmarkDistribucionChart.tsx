import React from 'react';
import { Target, Info } from 'lucide-react';

interface Props {
    p25: number;
    p50: number;
    p75: number;
    todaySales: number;
    percentilePositionPct: number;
    formatValue: (val: number) => string;
}

export const BenchmarkDistribucionChart: React.FC<Props> = ({
    p25,
    p50,
    p75,
    todaySales,
    percentilePositionPct,
    formatValue
}) => {
    const maxVal = Math.max(todaySales * 1.15, p75 * 1.25, 7000);
    
    // Percentage heights from bottom
    const p25Pct = (p25 / maxVal) * 100;
    const p50Pct = (p50 / maxVal) * 100;
    const p75Pct = (p75 / maxVal) * 100;
    const hoyPct = Math.min((todaySales / maxVal) * 100, 95);

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Distribución Histórica (365 días)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Ubicación analítica de la cifra actual frente a las zonas de riesgo, normalidad y meta.
                        </p>
                    </div>
                </div>
                <div className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold rounded-full self-start sm:self-auto">
                    📍 Ubicación: <strong className="text-indigo-900">{percentilePositionPct.toFixed(0)}% del histórico</strong>
                </div>
            </div>

            {/* Visual Distribution Chart */}
            <div className="relative h-64 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
                {/* Visual Zones */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col pointer-events-none opacity-40">
                    <div className="h-1/4 bg-emerald-100/50 border-b border-emerald-200" title="Zona Meta (>P75)"></div>
                    <div className="h-1/4 bg-blue-100/50 border-b border-blue-200" title="Zona Normal (P50-P75)"></div>
                    <div className="h-1/4 bg-amber-100/50 border-b border-amber-200" title="Zona Bajo (P25-P50)"></div>
                    <div className="h-1/4 bg-rose-100/50" title="Zona Riesgo (<P25)"></div>
                </div>

                {/* Horizontal Threshold Lines */}
                {/* P75 Meta */}
                <div 
                    className="absolute inset-x-4 border-b-2 border-dashed border-[#10B981] flex items-center justify-between text-xs transition-all"
                    style={{ bottom: `${p75Pct}%` }}
                >
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded border border-emerald-300">
                        P75 Meta: {formatValue(p75)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider bg-white/80 px-1 rounded">
                        Rendimiento Superior
                    </span>
                </div>

                {/* P50 Normal */}
                <div 
                    className="absolute inset-x-4 border-b-2 border-dashed border-[#3B82F6] flex items-center justify-between text-xs transition-all"
                    style={{ bottom: `${p50Pct}%` }}
                >
                    <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2 py-0.5 rounded border border-blue-300">
                        P50 Normal: {formatValue(p50)}
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider bg-white/80 px-1 rounded">
                        Mediana Esperada
                    </span>
                </div>

                {/* P25 Riesgo */}
                <div 
                    className="absolute inset-x-4 border-b-2 border-dashed border-[#EF4444] flex items-center justify-between text-xs transition-all"
                    style={{ bottom: `${p25Pct}%` }}
                >
                    <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2 py-0.5 rounded border border-rose-300">
                        P25 Riesgo: {formatValue(p25)}
                    </span>
                    <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider bg-white/80 px-1 rounded">
                        Límite Crítico
                    </span>
                </div>

                {/* Marker Hoy / Actual */}
                <div 
                    className="absolute right-12 flex items-center gap-2 transform translate-y-1/2 transition-all duration-700 z-10"
                    style={{ bottom: `${hoyPct}%` }}
                >
                    <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-lg animate-pulse" />
                    <div className="bg-indigo-900 text-white px-3 py-1.5 rounded-xl shadow-md border border-indigo-700 text-xs font-bold flex items-center gap-2">
                        <span>● Hoy:</span>
                        <strong className="font-mono text-amber-300">{formatValue(todaySales)}</strong>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                    La posición percentil <strong>{percentilePositionPct.toFixed(0)}%</strong> indica que el resultado actual es superior al <strong>{percentilePositionPct.toFixed(0)}%</strong> de todas las jornadas registradas en los últimos 365 días.
                </span>
            </div>
        </div>
    );
};
