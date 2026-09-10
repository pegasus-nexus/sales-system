import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import type { YoYComparisonPoint } from './BenchmarkTypes';

interface Props {
    data: YoYComparisonPoint[];
    formatValue: (val: number) => string;
}

export const BenchmarkYoYComparisonCard: React.FC<Props> = ({
    data,
    formatValue
}) => {
    const total2025 = data.reduce((acc, d) => acc + d.val2025, 0);
    const total2026 = data.reduce((acc, d) => acc + d.val2026, 0);
    const overallGrowth = total2025 > 0 ? ((total2026 - total2025) / total2025) * 100 : 0;

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            Comparativa Interanual de Ventas (2026 vs 2025)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Crecimiento interanual comparando meses equivalentes del año fiscal 2026 contra 2025.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold self-start sm:self-auto">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>Crecimiento Acumulado YoY: <strong>+{overallGrowth.toFixed(1)}%</strong></span>
                </div>
            </div>

            {/* Total YoY KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas Acumuladas 2025</div>
                    <div className="text-xl font-black text-slate-700 font-mono mt-1">{formatValue(total2025)}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas Acumuladas 2026</div>
                    <div className="text-xl font-black text-indigo-700 font-mono mt-1">{formatValue(total2026)}</div>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Variación Neta Interanual</div>
                    <div className="text-xl font-black text-emerald-700 font-mono mt-1">+{overallGrowth.toFixed(1)}% YoY</div>
                </div>
            </div>

            {/* Dual Bar Chart (2026 vs 2025) */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
                    <span>Mes Comparado</span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-slate-400 font-mono">
                            <span className="w-3 h-3 rounded bg-slate-300 inline-block"></span> 2025
                        </span>
                        <span className="flex items-center gap-1 text-indigo-600 font-mono">
                            <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span> 2026
                        </span>
                        <span className="w-16 text-right">Variación</span>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {data.map((item) => {
                        const maxVal = Math.max(...data.map(d => Math.max(d.val2025, d.val2026)), 1);
                        const pct2025 = Math.min((item.val2025 / maxVal) * 100, 100);
                        const pct2026 = Math.min((item.val2026 / maxVal) * 100, 100);

                        return (
                            <div key={item.month} className="p-2.5 bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-all">
                                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                                    <span className="font-bold text-slate-900 w-16">{item.month}</span>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-slate-500">2025: <strong className="text-slate-700">{formatValue(item.val2025)}</strong></span>
                                        <span className="text-indigo-700 font-bold">2026: <strong className="text-indigo-900">{formatValue(item.val2026)}</strong></span>
                                        <span className={`w-16 text-right font-extrabold ${item.pctGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.pctGrowth >= 0 ? '+' : ''}{item.pctGrowth.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Dual Bars */}
                                <div className="space-y-1">
                                    {/* 2026 Bar */}
                                    <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                            style={{ width: `${pct2026}%` }}
                                        />
                                    </div>
                                    {/* 2025 Bar */}
                                    <div className="w-full bg-slate-200/40 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="h-full bg-slate-400 rounded-full transition-all duration-500"
                                            style={{ width: `${pct2025}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
