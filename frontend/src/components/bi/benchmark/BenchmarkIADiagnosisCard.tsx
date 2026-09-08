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
                    bg: 'bg-emerald-950/40 border-emerald-500/30',
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                    titleColor: 'text-emerald-300',
                    title: 'Desempeño Sobresaliente (Por encima del Percentil 75)',
                    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                };
            case 'normal':
                return {
                    bg: 'bg-blue-950/40 border-blue-500/30',
                    icon: <Sparkles className="w-5 h-5 text-blue-400" />,
                    titleColor: 'text-blue-300',
                    title: 'Rendimiento Alineado a la Mediana Histórica (P50)',
                    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                };
            case 'bajo':
                return {
                    bg: 'bg-amber-950/40 border-amber-500/30',
                    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
                    titleColor: 'text-amber-300',
                    title: 'Rendimiento Moderado (Por debajo de la Mediana)',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                };
            case 'critico':
                return {
                    bg: 'bg-rose-950/40 border-rose-500/30',
                    icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
                    titleColor: 'text-rose-300',
                    title: 'Alerta Operativa (Por debajo del Percentil 25 Crítico)',
                    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                };
        }
    };

    const theme = getStatusTheme();

    return (
        <div className={`border rounded-xl p-5 backdrop-blur shadow-xl ${theme.bg}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30 text-indigo-400">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white tracking-wide">
                                Diagnóstico Inteligente de Rendimiento (IA Engine)
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
                                BI Executive
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Evaluación analítica en tiempo real para {storeName} • Métrica: {metricLabels[selectedMetric]}
                        </p>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto ${theme.badge}`}>
                    {theme.icon}
                    <span>{pctVsP50 >= 0 ? `+${pctVsP50.toFixed(1)}%` : `${pctVsP50.toFixed(1)}%`} vs Mediana</span>
                </div>
            </div>

            {/* Diagnosis Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Resumen del Desempeño */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                        <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                        <span>Evaluación de Variación</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        El nivel actual de <strong className="text-white font-mono">{selectedMetric === 'ventas' || selectedMetric === 'ticket' ? `${currencySymbol} ${currentValue.toFixed(2)}` : currentValue}</strong> se sitúa {' '}
                        {statusCategory === 'excelente' && 'en el tramo superior de ventas (cuartil 4), superando la meta P75.'}
                        {statusCategory === 'normal' && 'dentro de la banda normal de operación esperada para este período.'}
                        {statusCategory === 'bajo' && 'un poco por debajo de la mediana esperada, requiriendo empuje comercial.'}
                        {statusCategory === 'critico' && 'en zona de contracción severa, requiriendo revisión de caja e inventario.'}
                    </p>
                </div>

                {/* Column 2: Factores Clave Operativos */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Factores Explicativos</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                        {statusCategory === 'excelente' && (
                            <>
                                <li>Alta conversión en hora pico y buen ticket promedio.</li>
                                <li>Disponibilidad de stock en productos de rotación estrella.</li>
                            </>
                        )}
                        {statusCategory === 'normal' && (
                            <>
                                <li>Flujo de clientes estable y consistente con patrones de la sucursal.</li>
                                <li>Cumplimiento de objetivos operativos regulares.</li>
                            </>
                        )}
                        {(statusCategory === 'bajo' || statusCategory === 'critico') && (
                            <>
                                <li>Caída en la afluencia de tráfico de compradores en franja vespertina.</li>
                                <li>Posible desabastecimiento temporal de ítems clave de alta demanda.</li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Column 3: Recomendaciones Accionables */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                        <Lightbulb className="w-4 h-4 text-emerald-400" />
                        <span>Sugerencias Tácticas</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5">
                        {statusCategory === 'excelente' ? (
                            <li className="flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>Blindar stock de SKUs de alta rotación para evitar desabastecimiento nocturno.</span>
                            </li>
                        ) : (
                            <li className="flex items-start gap-1.5">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>Activar promociones relámpago o venta sugerida en caja para elevar ticket promedio.</span>
                            </li>
                        )}
                        <li className="flex items-start gap-1.5">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>Ajustar distribución de personal durante la hora de mayor concurrencia detectada.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
