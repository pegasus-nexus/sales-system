import React from 'react';
import { X, Calendar, ShoppingBag, Receipt, Package, Clock, Award, AlertCircle, TrendingUp } from 'lucide-react';
import type { DayDetailData } from './BenchmarkTypes';

interface Props {
    dayData: DayDetailData | null;
    onClose: () => void;
    currencySymbol?: string;
}

export const BenchmarkDayDetailModal: React.FC<Props> = ({
    dayData,
    onClose,
    currencySymbol = 'Bs.'
}) => {
    if (!dayData) return null;

    const getStatusBadge = () => {
        switch (dayData.status) {
            case 'alto':
                return {
                    bg: 'bg-emerald-100 border-emerald-300 text-emerald-800',
                    label: '🟢 Alto Rendimiento (> P75)',
                };
            case 'normal':
                return {
                    bg: 'bg-sky-100 border-sky-300 text-sky-800',
                    label: '🟡 Operación Normal (P25 - P75)',
                };
            case 'bajo':
                return {
                    bg: 'bg-amber-100 border-amber-300 text-amber-800',
                    label: '🟠 Bajo Rendimiento (< P50)',
                };
            case 'critico':
                return {
                    bg: 'bg-rose-100 border-rose-300 text-rose-800',
                    label: '🔴 Crítico Operativo (< P25)',
                };
            case 'pronostico':
                return {
                    bg: 'bg-indigo-100 border-indigo-300 text-indigo-800',
                    label: '🪄 Referencia Estadística / Pronóstico',
                };
            default:
                return {
                    bg: 'bg-slate-100 border-slate-300 text-slate-700',
                    label: '⚪ Sin Registro de Ventas',
                };
        }
    };

    const statusInfo = getStatusBadge();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 border border-indigo-200 rounded-2xl text-indigo-700">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Auditoría Histórica de Registro Diario
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                <span>{dayData.dayOfWeek} {dayData.fullDateStr}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Status Pill & Equivalent Comparison */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500 font-medium">Clasificación Histórica</span>
                            <div className={`px-3 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 ${statusInfo.bg}`}>
                                {statusInfo.label}
                            </div>
                        </div>

                        <div className="sm:text-right space-y-1">
                            <span className="text-xs text-slate-500 font-medium">Vs Días Equivalentes ({dayData.dayOfWeek})</span>
                            <div className="flex items-center sm:justify-end gap-1.5">
                                <span className={`text-sm font-bold font-mono ${dayData.vsEquivalentePct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {dayData.vsEquivalentePct >= 0 ? '+' : ''}{dayData.vsEquivalentePct.toFixed(1)}%
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                    (Meta P50: {currencySymbol} {dayData.equivalenteP50.toFixed(2)})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Ventas</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 font-mono">
                                {currencySymbol} {dayData.sales.toFixed(2)}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Órdenes</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 font-mono">
                                {dayData.orders}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                                <span>Ticket Medio</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 font-mono">
                                {currencySymbol} {dayData.ticketMedio.toFixed(2)}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <Package className="w-3.5 h-3.5 text-blue-600" />
                                <span>Unidades</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 font-mono">
                                {dayData.unidades} <span className="text-[10px] text-slate-500 font-normal">({dayData.unidadesPorOrden.toFixed(1)}/ord)</span>
                            </p>
                        </div>
                    </div>

                    {/* Peak Hour & Top Product */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-amber-100 border border-amber-200 rounded-xl text-amber-700">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block font-medium">Hora de Mayor Demanda</span>
                                <strong className="text-sm text-slate-900 font-mono">{dayData.horaPico}</strong>
                            </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block font-medium">Producto Más Vendido</span>
                                <strong className="text-xs text-slate-800 truncate block max-w-[180px]">{dayData.productoEstrella}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Causal Factors & Analytical Notes */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <AlertCircle className="w-4 h-4 text-indigo-600" />
                            <span>Factores Contextuales & Notas Causales</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {dayData.causalFactor}
                        </p>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                        Cerrar Detalle
                    </button>
                </div>
            </div>
        </div>
    );
};
