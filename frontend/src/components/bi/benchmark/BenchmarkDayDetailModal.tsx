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
                    bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
                    label: '🟢 Alto Rendimiento (> P75)',
                };
            case 'normal':
                return {
                    bg: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
                    label: '🟡 Operación Normal (P25 - P75)',
                };
            case 'bajo':
                return {
                    bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
                    label: '🟠 Bajo Rendimiento (< P50)',
                };
            case 'critico':
                return {
                    bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
                    label: '🔴 Crítico Operativo (< P25)',
                };
            default:
                return {
                    bg: 'bg-slate-500/20 border-slate-500/40 text-slate-300',
                    label: '⚪ Sin Registro de Ventas',
                };
        }
    };

    const statusInfo = getStatusBadge();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-wide">
                                Auditoría Histórica de Registro Diario
                            </h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{dayData.dayOfWeek} {dayData.fullDateStr}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Status Pill & Equivalent Comparison */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="space-y-1">
                            <span className="text-xs text-slate-400 font-medium">Clasificación Histórica</span>
                            <div className={`px-3 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 ${statusInfo.bg}`}>
                                {statusInfo.label}
                            </div>
                        </div>

                        <div className="sm:text-right space-y-1">
                            <span className="text-xs text-slate-400 font-medium">Vs Días Equivalentes ({dayData.dayOfWeek})</span>
                            <div className="flex items-center sm:justify-end gap-1.5">
                                <span className={`text-sm font-bold font-mono ${dayData.vsEquivalentePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {dayData.vsEquivalentePct >= 0 ? '+' : ''}{dayData.vsEquivalentePct.toFixed(1)}%
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    (Meta: {currencySymbol} {dayData.equivalenteP50.toFixed(2)})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Ventas</span>
                            </div>
                            <p className="text-sm font-bold text-white font-mono">
                                {currencySymbol} {dayData.sales.toFixed(2)}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Órdenes</span>
                            </div>
                            <p className="text-sm font-bold text-white font-mono">
                                {dayData.orders}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                                <span>Ticket Medio</span>
                            </div>
                            <p className="text-sm font-bold text-white font-mono">
                                {currencySymbol} {dayData.ticketMedio.toFixed(2)}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Package className="w-3.5 h-3.5 text-blue-400" />
                                <span>Unidades</span>
                            </div>
                            <p className="text-sm font-bold text-white font-mono">
                                {dayData.unidades} <span className="text-[10px] text-slate-400 font-normal">({dayData.unidadesPorOrden.toFixed(1)}/ord)</span>
                            </p>
                        </div>
                    </div>

                    {/* Peak Hour & Top Product */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block font-medium">Hora de Mayor Demanda</span>
                                <strong className="text-sm text-white font-mono">{dayData.horaPico}</strong>
                            </div>
                        </div>

                        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block font-medium">Producto Más Vendido</span>
                                <strong className="text-xs text-slate-200 truncate block max-w-[180px]">{dayData.productoEstrella}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Causal Factors & Analytical Notes */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                            <AlertCircle className="w-4 h-4 text-indigo-400" />
                            <span>Factores Contextuales & Notas Causales</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {dayData.causalFactor}
                        </p>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                        Cerrar Detalle
                    </button>
                </div>
            </div>
        </div>
    );
};
