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
    // Determine point count based on selectedHorizon
    const pointCount = selectedHorizon === '30dias' ? 30 : selectedHorizon === '90dias' ? 45 : 60;
    
    // Generate data points
    const points = processedDays.slice(0, pointCount).map((d, idx) => {
        return {
            day: idx + 1,
            val: d.sales
        };
    });

    const maxVal = Math.max(...points.map(p => p.val), p75 * 1.2, 1);
    const minVal = 0;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <TrendingUp size={18} />
                    <span>Módulo 3 & 5: Evolución Histórica Temporal ({selectedHorizon === '30dias' ? '30 Días' : selectedHorizon === '90dias' ? '90 Días' : '365 Días (Año Móvil)'})</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-3 h-0.5 bg-rose-400 inline-block"></span> P25 ({formatValue(p25)})
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-400">
                        <span className="w-3 h-0.5 bg-sky-400 inline-block"></span> P50 ({formatValue(p50)})
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> P75 ({formatValue(p75)})
                    </span>
                </div>
            </div>

            {/* Visual SVG Chart */}
            <div className="relative h-56 w-full pt-4">
                {/* Reference Lines */}
                <div 
                    className="absolute w-full border-b border-dashed border-rose-500/50 flex justify-end text-[10px] text-rose-400 pr-2"
                    style={{ top: `${100 - ((p25 - minVal) / (maxVal - minVal)) * 100}%` }}
                >
                    P25
                </div>
                <div 
                    className="absolute w-full border-b border-dashed border-sky-500/50 flex justify-end text-[10px] text-sky-400 pr-2"
                    style={{ top: `${100 - ((p50 - minVal) / (maxVal - minVal)) * 100}%` }}
                >
                    P50
                </div>
                <div 
                    className="absolute w-full border-b border-dashed border-emerald-500/50 flex justify-end text-[10px] text-emerald-400 pr-2"
                    style={{ top: `${100 - ((p75 - minVal) / (maxVal - minVal)) * 100}%` }}
                >
                    P75
                </div>

                {/* SVG Line & Area */}
                <svg className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Area */}
                    <polygon
                        fill="url(#chartGradient)"
                        points={`
                            0,224
                            ${points.map((p, i) => {
                                const x = (i / (points.length - 1)) * 100;
                                const y = 100 - ((p.val - minVal) / (maxVal - minVal)) * 100;
                                return `${x}%,${y}%`;
                            }).join(' ')}
                            100%,224
                        `}
                    />

                    {/* Polyline */}
                    <polyline
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                        points={points.map((p, i) => {
                            const x = (i / (points.length - 1)) * 100;
                            const y = 100 - ((p.val - minVal) / (maxVal - minVal)) * 100;
                            return `${x}%,${y}%`;
                        }).join(' ')}
                    />
                </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Evolución diaria de {unit} vs percentiles de referencia</span>
                <span>Valores actualizados en zona horaria America/La_Paz</span>
            </div>
        </div>
    );
};
