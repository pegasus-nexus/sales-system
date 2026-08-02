import React from 'react';
import {
    ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip
} from 'recharts';
import { Clock } from 'lucide-react';

const formatBs = (n: number) =>
    `Bs. ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface FechasComparadas {
    actual: string;
    past1: string;
    past2: string;
}

export interface ComparativaHorariaProps {
    modo?: 'dashboard' | 'festividad';
    title?: string;
    festividadNombre?: string;
    fechas?: FechasComparadas;
    chartData: any[];
    barColor?: string;
    lineColor1?: string;
    lineColor2?: string;
    accentBg?: string;
    accentBorder?: string;
    accentText?: string;
    maxHourSale?: number;
    peakHour?: string;
    hasData?: boolean;
}

export const ComparativaHorariaMultiAnio: React.FC<ComparativaHorariaProps> = ({
    modo = 'festividad',
    title,
    festividadNombre,
    fechas,
    chartData = [],
    barColor = '#6366f1',
    lineColor1 = '#3b82f6',
    lineColor2 = '#94a3b8',
    accentBg = 'bg-indigo-50 text-indigo-800',
    accentBorder = 'border-indigo-200',
    accentText = 'text-indigo-700',
    maxHourSale = 0,
    peakHour = '14:00',
    hasData = true
}) => {
    const computedTitle = title || (festividadNombre ? `Comparativa Horaria Multi-Año - ${festividadNombre}` : 'Comparativa Horaria Multi-Año');

    return (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col justify-between transition-all duration-300">
            <div>
                {/* Header del Gráfico */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Clock size={18} className={accentText} />
                            {computedTitle}
                        </h3>
                        {/* Subtítulo con Fechas Explícitas Almacenadas en Configuración */}
                        {modo === 'festividad' && fechas ? (
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/80 font-bold shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColor }}></span>
                                    Actual: {fechas.actual}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-xl border border-blue-200/80 font-bold shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                    Hace 1 año: {fechas.past1}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200/80 font-bold shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                                    Hace 2 años: {fechas.past2}
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                Barras (Año actual) vs Línea azul (Hace 1 año) y Línea gris (Hace 2 años)
                            </p>
                        )}
                    </div>

                    {/* Badge de Hora Pico o Sin Ventas */}
                    <div>
                        {hasData && maxHourSale > 0 ? (
                            <span className={`text-xs font-black px-3 py-1.5 rounded-xl border shadow-2xs ${accentBg} ${accentBorder}`}>
                                Hora pico: {peakHour} hs ({formatBs(maxHourSale)})
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                Sin ventas registradas
                            </span>
                        )}
                    </div>
                </div>

                {/* Área del Gráfico Recharts */}
                <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={(v) => `Bs ${v}`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '1rem', color: '#0f172a', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                formatter={(val: any) => formatBs(val)}
                            />
                            <Bar dataKey="real" fill={barColor} radius={[6, 6, 0, 0]} barSize={16} name="Actual" />
                            <Line type="monotone" dataKey="anio1" stroke={lineColor1} strokeWidth={3} dot={false} name="Hace 1 año" />
                            <Line type="monotone" dataKey="anio2" stroke={lineColor2} strokeWidth={2} strokeDasharray="4 4" dot={false} name="Hace 2 años" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Leyenda Inferior */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4 border-t border-slate-100 text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-800">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: barColor }}></span> 
                    Año actual {fechas ? `(${fechas.actual.split('-')[0]})` : ''}
                </span>
                <span className="flex items-center gap-2 text-blue-600">
                    <span className="w-3.5 h-1.5 rounded bg-blue-500"></span> 
                    Hace 1 año {fechas ? `(${fechas.past1.split('-')[0]})` : ''}
                </span>
                <span className="flex items-center gap-2 text-slate-500">
                    <span className="w-3.5 h-1 rounded bg-slate-400"></span> 
                    Hace 2 años {fechas ? `(${fechas.past2.split('-')[0]})` : ''}
                </span>
            </div>
        </div>
    );
};

export default ComparativaHorariaMultiAnio;
