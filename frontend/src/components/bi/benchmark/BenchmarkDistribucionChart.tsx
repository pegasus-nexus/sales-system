import React from 'react';
import { Target, Trophy, Info, Clock, Calendar, Database, ArrowUpRight } from 'lucide-react';
import type { MetricKey } from './BenchmarkTypes';
import { METRIC_TITLES } from './BenchmarkTypes';

interface Props {
    selectedMetric: MetricKey;
    p25: number;
    p50: number;
    p75: number;
    todaySales: number;
    percentilePositionPct: number;
    formatValue: (val: number) => string;
    unitName: string;
}

export const BenchmarkDistribucionChart: React.FC<Props> = ({
    selectedMetric,
    p25,
    p50,
    p75,
    todaySales,
    percentilePositionPct,
    formatValue,
    unitName
}) => {
    const metricTitle = METRIC_TITLES[selectedMetric] || 'Ventas por día (Bs.)';
    const topPercentage = Math.max(100 - percentilePositionPct, 1);
    const vsP50Pct = p50 > 0 ? Math.round(((todaySales - p50) / p50) * 100) : 0;

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Header matching media_1788901753233.png */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            Distribución Histórica (365 días)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Ubicación analítica de la cifra actual frente a las zonas de riesgo, normalidad y meta para: <strong className="text-slate-800">{metricTitle}</strong>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>01 Sep 2025 - 31 Ago 2026</span>
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700">
                        <Database className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Colección: <strong className="font-mono text-slate-900">sales (MongoDB)</strong></span>
                    </span>
                </div>
            </div>

            {/* Main Section: Bell Curve Graph (Left 8 cols) & Position Panel (Right 4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 Cols: Gaussian Bell Curve */}
                <div className="lg:col-span-8 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 relative flex flex-col justify-between overflow-hidden">
                    {/* Top Zone Titles */}
                    <div className="flex items-center justify-around text-center mb-2 z-10">
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                            <div>Zona de Riesgo</div>
                            <div className="text-[10px] text-rose-600 font-normal">Desempeño bajo</div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                            <div>Zona de Normalidad</div>
                            <div className="text-[10px] text-blue-600 font-normal">Comportamiento esperado</div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                            <div>Zona de Meta</div>
                            <div className="text-[10px] text-emerald-600 font-normal">Rendimiento superior</div>
                        </div>
                    </div>

                    {/* Gaussian SVG Curve Representation */}
                    <div className="relative h-44 w-full my-2">
                        {/* Shaded Regions */}
                        <div className="absolute inset-0 flex pointer-events-none opacity-20">
                            <div className="w-1/3 bg-rose-500 rounded-l-2xl"></div>
                            <div className="w-1/3 bg-blue-500"></div>
                            <div className="w-1/3 bg-emerald-500 rounded-r-2xl"></div>
                        </div>

                        <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="bellGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                                    <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
                                </linearGradient>
                            </defs>

                            {/* Gaussian Smooth Curve */}
                            <path
                                d="M 0,150 Q 150,140 220,90 T 300,20 T 380,90 Q 450,140 600,150 L 600,155 L 0,155 Z"
                                fill="url(#bellGrad)"
                            />
                            <path
                                d="M 0,150 Q 150,140 220,90 T 300,20 T 380,90 Q 450,140 600,150"
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="3"
                            />

                            {/* Vertical Dashed Guidelines */}
                            {/* P25 Line */}
                            <line x1="180" y1="20" x2="180" y2="155" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="180" cy="115" r="5" fill="#ef4444" />

                            {/* P50 Line */}
                            <line x1="300" y1="20" x2="300" y2="155" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="300" cy="20" r="5" fill="#3b82f6" />

                            {/* P75 Line */}
                            <line x1="420" y1="20" x2="420" y2="155" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="420" cy="70" r="5" fill="#10b981" />

                            {/* HOY Pin Indicator */}
                            <line x1="480" y1="10" x2="480" y2="155" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3 3" />
                            <circle cx="480" cy="110" r="6" fill="#4f46e5" />
                        </svg>

                        {/* Floating "Hoy" Pin Tooltip */}
                        <div 
                            className="absolute transform -translate-x-1/2 -translate-y-full bg-indigo-600 text-white px-3 py-1.5 rounded-xl shadow-lg border border-indigo-500 text-center font-bold z-20"
                            style={{ left: '80%', top: '45%' }}
                        >
                            <div className="text-xs font-mono">Hoy</div>
                            <div className="text-xs font-mono">{formatValue(todaySales)}</div>
                            <div className="text-[9px] text-indigo-200 font-medium">Percentil: {percentilePositionPct.toFixed(0)}</div>
                        </div>
                    </div>

                    {/* Bottom Axis Labels matching media_1788901753233.png */}
                    <div className="flex justify-between items-center text-xs font-mono pt-3 border-t border-slate-200/80 text-slate-500 font-medium">
                        <span>0</span>
                        <span>25</span>
                        <span className="text-rose-600 font-bold">P25 {formatValue(p25)}</span>
                        <span>73</span>
                        <span className="text-blue-600 font-bold">P50 {formatValue(p50)}</span>
                        <span className="text-emerald-600 font-bold">P75 {formatValue(p75)}</span>
                        <span>120</span>
                        <span>150</span>
                        <span>175</span>
                        <span className="font-bold text-slate-800 uppercase">{unitName}</span>
                    </div>
                </div>

                {/* Right 4 Cols: Posición Actual & Status Card matching media_1788901753233.png */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Posición Actual Box */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                            <span>Posición Actual</span>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 font-mono">{formatValue(todaySales)}</span>
                            <span className="text-xs font-bold text-emerald-600 font-mono">▲ +{vsP50Pct}%</span>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs font-semibold text-slate-600">
                                Sobre el <strong>{percentilePositionPct.toFixed(0)}%</strong> del histórico
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                <div 
                                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                                    style={{ width: `${percentilePositionPct}%` }}
                                />
                            </div>
                            <div className="text-right text-[10px] font-bold font-mono text-indigo-700">
                                {percentilePositionPct.toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    {/* Alto Rendimiento Trophy Box */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-700 shrink-0">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-emerald-900 uppercase">
                                Alto rendimiento
                            </h4>
                            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed font-medium">
                                Te encuentras dentro del <strong>{topPercentage.toFixed(0)}%</strong> de mejores jornadas históricas del negocio.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom 4 Cards Row: P25, P50, P75 & Interpretación matching media_1788901753233.png */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {/* Card P25 */}
                <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                        <span>P25 - {formatValue(p25)}</span>
                    </div>
                    <p className="text-xs text-rose-700">25% de los días están por debajo</p>
                    <p className="text-[11px] text-slate-500 font-medium">Límite inferior dinámico</p>
                </div>

                {/* Card P50 */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                        <span>P50 - {formatValue(p50)}</span>
                    </div>
                    <p className="text-xs text-blue-700">50% de los días están por debajo</p>
                    <p className="text-[11px] text-slate-500 font-medium">Punto medio histórico</p>
                </div>

                {/* Card P75 */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        <span>P75 - {formatValue(p75)}</span>
                    </div>
                    <p className="text-xs text-emerald-700">75% de los días están por debajo</p>
                    <p className="text-[11px] text-slate-500 font-medium">Nivel alto esperado</p>
                </div>

                {/* Interpretación & Recomendación Box */}
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-1">
                    <div className="text-xs font-bold text-indigo-900">Interpretación:</div>
                    <p className="text-xs text-indigo-950 leading-tight">
                        El desempeño actual se encuentra dentro del <strong>{topPercentage.toFixed(0)}%</strong> de mejores jornadas históricas.
                    </p>
                    <div className="text-xs font-bold text-indigo-900 pt-1">Recomendación:</div>
                    <p className="text-[11px] text-indigo-800 leading-tight">
                        Mantener disponibilidad de inventario y reforzar productos de alta rotación.
                    </p>
                </div>
            </div>

            {/* Footnote Bar matching media_1788901753233.png */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                        La posición percentil <strong>{percentilePositionPct.toFixed(0)}</strong> indica que el resultado actual es superior al <strong>{percentilePositionPct.toFixed(0)}%</strong> de todas las jornadas registradas en los últimos 365 días.
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Última actualización: 31/08/2026 19:50:22</span>
                </div>
            </div>
        </div>
    );
};
