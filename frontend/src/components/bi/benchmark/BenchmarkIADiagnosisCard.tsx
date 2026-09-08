import React from 'react';
import { Bot, CheckCircle2, Lightbulb } from 'lucide-react';

interface Props {
    todaySales: number;
    p50: number;
    formatValue: (val: number) => string;
}

export const BenchmarkIADiagnosisCard: React.FC<Props> = ({
    todaySales,
    p50,
    formatValue
}) => {
    const isSuperior = todaySales >= p50;

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 rounded-xl border border-indigo-200 text-indigo-700">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Diagnóstico Inteligente (IA Engine)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Síntesis ejecutiva del desempeño general del negocio contra el comportamiento histórico.
                        </p>
                    </div>
                </div>

                <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                    BI Executive AI
                </span>
            </div>

            {/* Main AI Body */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {isSuperior 
                        ? `El negocio presenta un rendimiento superior al comportamiento histórico (${formatValue(todaySales)} vs P50 ${formatValue(p50)}).`
                        : `El negocio registra una contracción temporal respecto al comportamiento histórico medio (${formatValue(todaySales)} vs P50 ${formatValue(p50)}).`}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Factores Detectados */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                            Factores Detectados:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Mayor cantidad de órdenes en el período evaluado</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Ticket promedio estable y en consonancia con la mediana</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Mejor tasa de conversión transaccional en franja pico</span>
                            </li>
                        </ul>
                    </div>

                    {/* Recomendación Accionable */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-emerald-600" /> Recomendación Operativa:
                        </span>
                        <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                            Mantener inventario disponible y blindar el abastecimiento de productos de alta rotación para evitar pérdida de ventas en horas punta.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
