import React from 'react';
import { Bot, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, ArrowUpRight, Lightbulb } from 'lucide-react';
import type { MetricKey } from './BenchmarkTypes';

interface Props {
    selectedMetric: MetricKey;
    currentValue: number;
    p25: number;
    p50: number;
    p75: number;
    storeName: string;
    currencySymbol?: string;
}

export const BenchmarkIADiagnosisCard: React.FC<Props> = ({
    selectedMetric,
    currentValue,
    p25,
    p50,
    p75,
    storeName,
    currencySymbol = 'Bs.'
}) => {
    // Metric label helper
    const metricLabels: Record<MetricKey, string> = {
        ventas: 'Ventas Totales',
        ordenes: 'Órdenes / Clientes',
        ticket: 'Ticket Promedio',
        unidades: 'Unidades Vendidas',
        unidades_por_orden: 'Unidades por Transacción'
    };

    // Calculate performance tier & percentages
    const pctVsP50 = p50 > 0 ? ((currentValue - p50) / p50) * 100 : 0;
    let statusCategory: 'excelente' | 'normal' | 'bajo' | 'critico' = 'normal';
    
    if (currentValue >= p75) statusCategory = 'excelente';
    else if (currentValue >= p50) statusCategory = 'normal';
    else if (currentValue >= p25) statusCategory = 'bajo';
    else statusCategory = 'critico';

    const getStatusTheme = () => {
        switch (statusCategory) {
            case 'excelente':
                return {
                    bg: 'bg-emerald-50/60 border-emerald-200/80',
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
                    titleColor: 'text-emerald-900',
                    title: 'Desempeño Sobresaliente (Por encima del Percentil 75)',
                    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
                };
            case 'normal':
                return {
                    bg: 'bg-sky-50/60 border-sky-200/80',
                    icon: <Sparkles className="w-5 h-5 text-sky-600" />,
                    titleColor: 'text-sky-900',
                    title: 'Rendimiento Alineado a la Mediana Histórica (P50)',
                    badge: 'bg-sky-100 text-sky-800 border-sky-300'
                };
            case 'bajo':
                return {
                    bg: 'bg-amber-50/60 border-amber-200/80',
                    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
                    titleColor: 'text-amber-900',
                    title: 'Rendimiento Moderado (Por debajo de la Mediana)',
                    badge: 'bg-amber-100 text-amber-800 border-amber-300'
                };
            case 'critico':
                return {
                    bg: 'bg-rose-50/60 border-rose-200/80',
                    icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
                    titleColor: 'text-rose-900',
                    title: 'Alerta Operativa (Por debajo del Percentil 25 Crítico)',
                    badge: 'bg-rose-100 text-rose-800 border-rose-300'
                };
        }
    };

    const theme = getStatusTheme();

    return (
        <div className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 ${theme.bg}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 rounded-xl border border-indigo-200 text-indigo-700">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                                Diagnóstico Inteligente de Rendimiento (IA Engine)
                            </h3>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold uppercase">
                                BI Executive
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Evaluación analítica explicativa para <strong>{storeName}</strong> • Métrica: <strong>{metricLabels[selectedMetric]}</strong>
                        </p>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto ${theme.badge}`}>
                    {theme.icon}
                    <span>{pctVsP50 >= 0 ? `+${pctVsP50.toFixed(1)}%` : `${pctVsP50.toFixed(1)}%`} vs Mediana</span>
                </div>
            </div>

            {/* Diagnosis Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Resumen del Desempeño */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>1. ¿QUÉ está pasando?</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        El nivel de <strong className="text-slate-900 font-mono">{selectedMetric === 'ventas' || selectedMetric === 'ticket' ? `${currencySymbol} ${currentValue.toFixed(2)}` : currentValue}</strong> se ubica {' '}
                        {statusCategory === 'excelente' && 'en el tramo superior de ventas (cuartil 4), superando holgadamente la meta P75.'}
                        {statusCategory === 'normal' && 'dentro de la banda esperada de operación regular según el histórico.'}
                        {statusCategory === 'bajo' && 'un poco por debajo de la mediana esperada, requiriendo impulso en caja.'}
                        {statusCategory === 'critico' && 'en zona de contracción severa, requiriendo revisión de caja e inventario.'}
                    </p>
                </div>

                {/* Column 2: Factores Clave Operativos */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                        <Sparkles className="w-4 h-4" />
                        <span>2. ¿POR QUÉ ocurre este resultado?</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                        {statusCategory === 'excelente' && (
                            <>
                                <li>Alta conversión en hora pico y buen ticket promedio por cliente.</li>
                                <li>Disponibilidad continua de stock en productos estrella de alta rotación.</li>
                            </>
                        )}
                        {statusCategory === 'normal' && (
                            <>
                                <li>Flujo de clientes estable y consistente con patrones de la sucursal.</li>
                                <li>Cumplimiento regular de metas de venta del día.</li>
                            </>
                        )}
                        {(statusCategory === 'bajo' || statusCategory === 'critico') && (
                            <>
                                <li>Caída en la afluencia de clientes durante la franja vespertina.</li>
                                <li>Posible desabastecimiento temporal de ítems clave de alta demanda.</li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Column 3: Recomendaciones Accionables */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <Lightbulb className="w-4 h-4" />
                        <span>3. ¿CÓMO actuar ahora?</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5">
                        {statusCategory === 'excelente' ? (
                            <li className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>Blindar stock de SKUs estrella para evitar desabastecimiento en franja nocturna.</span>
                            </li>
                        ) : (
                            <li className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>Activar promociones relámpago o venta sugerida en caja para elevar ticket promedio.</span>
                            </li>
                        )}
                        <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>Ajustar distribución de personal en las horas de mayor concurrencia detectadas.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
