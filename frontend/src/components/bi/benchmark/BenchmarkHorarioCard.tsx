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
    const maxVentaItem = hourlyData.reduce((prev, current) => (prev.ventaHoy > current.ventaHoy) ? prev : current, hourlyData[0]);
    const peakHour = maxVentaItem?.hora || '12:00 - 13:00';
    const weakHoursCount = hourlyData.filter(h => h.isDebil).length;
    const totalHoy = hourlyData.reduce((acc, h) => acc + h.ventaHoy, 0);
    const totalProm = hourlyData.reduce((acc, h) => acc + h.promedioHistorico, 0);

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900">
                            Módulo 6: Benchmark Horario Operativo (08:00 - 22:00)
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Comparativa por hora: Promedio Histórico vs Venta Real de Hoy (Horas Pico 🔥 & Franjas Débiles ⚠️)
                    </p>
                </div>
                <div>
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Hora Pico Hoy: <strong className="text-slate-900 font-mono">{peakHour}</strong>
                    </span>
                </div>
            </div>

            {/* Main Hourly Grid / Chart Bars */}
            <div className="space-y-2 mb-4">
                {hourlyData.map((item) => {
                    const maxVal = Math.max(...hourlyData.map(h => Math.max(h.promedioHistorico, h.ventaHoy)), 1);
                    const hoyPct = Math.min((item.ventaHoy / maxVal) * 100, 100);
                    const promPct = Math.min((item.promedioHistorico / maxVal) * 100, 100);

                    return (
                        <div key={item.hora} className="p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <div className="flex items-center gap-2 font-mono text-slate-700 font-semibold">
                                    <span>{item.hora}</span>
                                    {item.isPico && (
                                        <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded">
                                            🔥 Pico
                                        </span>
                                    )}
                                    {item.isDebil && (
                                        <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-rose-100 text-rose-800 border border-rose-300 rounded">
                                            ⚠️ Débil
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-mono">
                                    <span className="text-slate-500">
                                        Prom: <span className="text-slate-700">{currencySymbol} {item.promedioHistorico.toFixed(2)}</span>
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        Hoy: <span className={item.ventaHoy >= item.promedioHistorico ? 'text-emerald-700' : 'text-amber-700'}>{currencySymbol} {item.ventaHoy.toFixed(2)}</span>
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                                        item.variacionPct >= 0 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                        {item.variacionPct >= 0 ? '+' : ''}{item.variacionPct.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Dual Bar Display */}
                            <div className="space-y-1">
                                {/* Hoy Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex items-center">
                                    <div 
                                        className={`h-full transition-all duration-500 rounded-full ${
                                            item.isPico 
                                                ? 'bg-gradient-to-r from-amber-500 to-emerald-500' 
                                                : item.ventaHoy >= item.promedioHistorico 
                                                    ? 'bg-emerald-500' 
                                                    : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${Math.max(hoyPct, 2)}%` }}
                                    />
                                </div>
                                {/* Historical Ref Bar */}
                                <div className="w-full bg-slate-200/60 rounded-full h-1 overflow-hidden">
                                    <div 
                                        className="h-full bg-slate-400/60 rounded-full"
                                        style={{ width: `${Math.max(promPct, 2)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Summary / Insight */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                        Acumulado del Día: <strong className="text-slate-900 font-mono">{currencySymbol} {totalHoy.toFixed(2)}</strong> vs Promed. Histórico <span className="font-mono text-slate-500">{currencySymbol} {totalProm.toFixed(2)}</span>
                    </span>
                </div>
                {weakHoursCount > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>{weakHoursCount} franjas detectadas bajo el esperado.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
