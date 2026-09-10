import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { HorizonKey, DayDetailData } from './BenchmarkTypes';

interface BenchmarkEvolucionChartProps {
    selectedHorizon: HorizonKey;
    formatValue: (val: number) => string;
    processedDays: DayDetailData[];
    p25: number;
    p50: number;
    p75: number;
    unit: string;
}

export const BenchmarkEvolucionChart: React.FC<BenchmarkEvolucionChartProps> = ({
    selectedHorizon,
    formatValue,
    processedDays,
    p25,
    p50,
    p75,
    unit
}) => {
    const pointCount = selectedHorizon === '30dias' ? 30 : selectedHorizon === '90dias' ? 45 : 60;
    
    const points = processedDays.slice(0, pointCount).map((d, idx) => {
        return {
            day: idx + 1,
            val: d.sales
        };
    });

    const maxVal = Math.max(...points.map(p => p.val), p75 * 1.2, 1);
    const minVal = 0;

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        <TrendingUp size={18} />
                        <span>Módulo 3 & 5: Evolución Histórica Temporal ({selectedHorizon === '30dias' ? '30 Días' : selectedHorizon === '90dias' ? '90 Días' : '365 Días (Año Móvil)'})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Línea de tendencia real superpuesta a las franjas estadísticas $P_{25}, P_{50}, P_{75}$.
                    </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                        <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> P25 ({formatValue(p25)})
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                        <span className="w-3 h-0.5 bg-amber-500 inline-block"></span> P50 ({formatValue(p50)})
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> P75 ({formatValue(p75)})
                    </span>
                </div>
            </div>

            {/* Visual SVG Chart */}
            <div className="relative h-56 w-full pt-4 bg-slate-50/50 rounded-xl border border-slate-200/60 p-2">
                {/* Reference Lines */}
                <div 
                    className="absolute w-full border-b border-dashed border-rose-400 flex justify-end text-[10px] text-rose-700 font-bold pr-2"
                    style={{ top: `${100 - ((p25 - minVal) / (maxVal - minVal)) * 100}%` }}
                >
                    P25
                </div>
                <div 
                    className="absolute w-full border-b border-dashed border-amber-400 flex justify-end text-[10px] text-amber-700 font-bold pr-2"
                    style={{ top: `${100 - ((p50 - minVal) / (maxVal - minVal)) * 100}%` }}
                >
                    P50
                </div>
                <div 
                    className="absolute w-full border-b border-dashed border-emerald-400 flex justify-end text-[10px] text-emerald-700 font-bold pr-2"
                    style={{ top: `${100 - ((p75 - minVal) / (maxVal - minVal)) * 100}%` }}
                >
                    P75
                </div>

                {/* SVG Line & Area */}
                <svg className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGradientLight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Area */}
                    <polygon
                        fill="url(#chartGradientLight)"
                        points={`
                            0,210
                            ${points.map((p, i) => {
                                const x = (i / (points.length - 1)) * 100;
                                const y = 100 - ((p.val - minVal) / (maxVal - minVal)) * 100;
                                return `${x}%,${y}%`;
                            }).join(' ')}
                            100%,210
                        `}
                    />

                    {/* Polyline */}
                    <polyline
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        points={points.map((p, i) => {
                            const x = (i / (points.length - 1)) * 100;
                            const y = 100 - ((p.val - minVal) / (maxVal - minVal)) * 100;
                            return `${x}%,${y}%`;
                        }).join(' ')}
                    />
                </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Evolución diaria de {unit} vs percentiles de referencia</span>
                <span>Zona Horaria America/La_Paz</span>
            </div>
        </div>
    );
};
