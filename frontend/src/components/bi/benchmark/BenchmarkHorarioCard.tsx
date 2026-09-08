import React from 'react';
import { Clock, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import type { HourlyBenchmarkItem } from './BenchmarkTypes';

interface Props {
    hourlyData: HourlyBenchmarkItem[];
    currencySymbol?: string;
}

export const BenchmarkHorarioCard: React.FC<Props> = ({
    hourlyData,
    currencySymbol = 'Bs.'
}) => {
    // Find peak hour
    const maxVentaItem = hourlyData.reduce((prev, current) => (prev.ventaHoy > current.ventaHoy) ? prev : current, hourlyData[0]);
    
    const peakHour = maxVentaItem?.hora || '13:00';
    const weakHoursCount = hourlyData.filter(h => h.isDebil).length;
    const totalHoy = hourlyData.reduce((acc, h) => acc + h.ventaHoy, 0);
    const totalProm = hourlyData.reduce((acc, h) => acc + h.promedioHistorico, 0);

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white tracking-wide">
                            Benchmark Horario Operativo (08:00 - 22:00)
                        </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Comparativa por franja horaria: Promedio Histórico vs Venta Real de Hoy
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Hora Pico Hoy: <strong className="text-white font-mono">{peakHour}</strong>
                    </span>
                </div>
            </div>

            {/* Main Hourly Grid / Chart Bars */}
            <div className="space-y-2.5 mb-5">
                {hourlyData.map((item) => {
                    const maxVal = Math.max(...hourlyData.map(h => Math.max(h.promedioHistorico, h.ventaHoy)), 1);
                    const hoyPct = Math.min((item.ventaHoy / maxVal) * 100, 100);
                    const promPct = Math.min((item.promedioHistorico / maxVal) * 100, 100);

                    return (
                        <div key={item.hora} className="group p-2.5 rounded-lg hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <div className="flex items-center gap-2 font-mono text-slate-300 font-medium">
                                    <span>{item.hora}</span>
                                    {item.isPico && (
                                        <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                                            🔥 Pico
                                        </span>
                                    )}
                                    {item.isDebil && (
                                        <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                                            ⚠️ Débil
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono">
                                    <span className="text-slate-400">
                                        Prom: <span className="text-slate-200">{currencySymbol} {item.promedioHistorico.toFixed(2)}</span>
                                    </span>
                                    <span className="font-semibold text-white">
                                        Hoy: <span className={item.ventaHoy >= item.promedioHistorico ? 'text-emerald-400' : 'text-amber-400'}>{currencySymbol} {item.ventaHoy.toFixed(2)}</span>
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                                        item.variacionPct >= 0 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                        {item.variacionPct >= 0 ? '+' : ''}{item.variacionPct.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Dual Bar Display */}
                            <div className="space-y-1">
                                {/* Hoy Bar */}
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex items-center">
                                    <div 
                                        className={`h-full transition-all duration-500 rounded-full ${
                                            item.isPico 
                                                ? 'bg-gradient-to-r from-amber-500 to-emerald-400' 
                                                : item.ventaHoy >= item.promedioHistorico 
                                                    ? 'bg-emerald-500' 
                                                    : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${Math.max(hoyPct, 2)}%` }}
                                    />
                                </div>
                                {/* Historical Ref Bar */}
                                <div className="w-full bg-slate-800/40 rounded-full h-1 overflow-hidden">
                                    <div 
                                        className="h-full bg-slate-500/50 rounded-full"
                                        style={{ width: `${Math.max(promPct, 2)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Summary / Insight */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                        Acumulado del Día: <strong className="text-white font-mono">{currencySymbol} {totalHoy.toFixed(2)}</strong> vs Promedio Histórico <span className="font-mono text-slate-400">{currencySymbol} {totalProm.toFixed(2)}</span>
                    </span>
                </div>
                {weakHoursCount > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Se detectaron {weakHoursCount} franjas de rendimiento bajo el esperado.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
