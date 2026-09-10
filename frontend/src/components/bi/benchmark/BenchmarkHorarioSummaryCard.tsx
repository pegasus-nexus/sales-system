import React from 'react';
import { Clock, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CriticalHourSummary } from './BenchmarkTypes';

interface Props {
    criticalHours: CriticalHourSummary[];
    formatValue: (val: number) => string;
}

export const BenchmarkHorarioSummaryCard: React.FC<Props> = ({
    criticalHours,
    formatValue
}) => {
    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Benchmark por Horario (Horas Críticas)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Resumen ejecutivo de franjas horarias con desviación significativa respecto al patrón histórico.
                        </p>
                    </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    Sintético BI
                </span>
            </div>

            {/* Grid of Critical Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {criticalHours.map((item) => (
                    <div 
                        key={item.hora} 
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            item.status === 'alto' 
                                ? 'bg-emerald-50/70 border-emerald-200' 
                                : 'bg-rose-50/70 border-rose-200'
                        }`}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 text-sm">{item.hora}</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                    item.status === 'alto' 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}>
                                    {item.status === 'alto' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    <span>{item.status === 'alto' ? 'Sobre esperado' : 'Bajo'}</span>
                                </span>
                            </div>
                            <div className="text-xs text-slate-600 font-mono">
                                Histórico: <strong className="text-slate-800">{formatValue(item.historico)}</strong>
                            </div>
                        </div>

                        <div className="text-right space-y-0.5">
                            <span className="text-xs text-slate-500 block">Venta Real Hoy</span>
                            <span className={`text-base font-extrabold font-mono ${
                                item.status === 'alto' ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                                {formatValue(item.hoy)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-600" /> El desglose operativo completo por minuto y ticket se encuentra disponible en <strong>Monitor POS</strong>.
                </span>
            </div>
        </div>
    );
};
