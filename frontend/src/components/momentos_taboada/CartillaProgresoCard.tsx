import React from 'react';
import { Check, Star, Sparkles, Receipt, Calendar } from 'lucide-react';
import type { ClienteSellosResponse } from '../../api/types';

interface Props {
    data: ClienteSellosResponse;
}

export const CartillaProgresoCard: React.FC<Props> = ({ data }) => {
    const { cliente, balance, cartilla_progreso, historial_tickets } = data;

    return (
        <div className="space-y-6">
            {/* Cartilla Física Digitalizada (Estilo Flyer Chocolates Taboada) */}
            <div className="bg-gradient-to-br from-[#fefbf6] to-[#fbf5ea] p-6 md:p-8 rounded-3xl border-2 border-[#dfcbb5] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#ebdccd]">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 bg-amber-800 text-amber-100 text-[10px] font-extrabold uppercase tracking-wider rounded-md">
                                Programa Oficial
                            </span>
                            <span className="text-xs font-semibold text-amber-900">
                                Vigente desde 1 de Noviembre 2026
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-amber-950 font-serif">
                            Momentos Taboada
                        </h3>
                        <p className="text-xs text-amber-800/80">
                            1 sello por cada Bs 30 completos de compra en tickets independientes.
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-[#dfcbb5] flex items-center gap-6">
                        <div>
                            <span className="block text-[11px] font-semibold text-gray-500">
                                Cliente Identificado
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                                {cliente.nombre}
                            </span>
                            <span className="block text-xs text-gray-500">
                                Celular: {cliente.telefono}
                            </span>
                        </div>
                        <div className="h-8 w-px bg-gray-200" />
                        <div className="text-center">
                            <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                                Sellos Disponibles
                            </span>
                            <span className="text-3xl font-black text-amber-900">
                                {balance.sellos_disponibles}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Grid de 30 Sellos de la Cartilla */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Tu avance en sellos (1 al 30)
                        </span>
                        <span className="text-xs font-semibold text-amber-800">
                            {balance.sellos_disponibles} de 30 sellos activos
                        </span>
                    </div>

                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2.5">
                        {cartilla_progreso.map(casilla => {
                            const isMarked = casilla.marcado;
                            const isMilestone = casilla.es_hito;

                            return (
                                <div
                                    key={casilla.numero}
                                    className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                                        isMarked
                                            ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-600 text-white shadow-md shadow-amber-900/10 scale-105'
                                            : isMilestone
                                            ? 'bg-amber-50/60 border-dashed border-amber-400 text-amber-800 hover:bg-amber-100/50'
                                            : 'bg-white/60 border-gray-200 text-gray-400 hover:bg-white'
                                    }`}
                                >
                                    {isMarked ? (
                                        <>
                                            <Check className="w-4 h-4 text-white stroke-[3] mb-0.5" />
                                            <span className="text-[10px] font-black">{casilla.numero}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold">{casilla.numero}</span>
                                            {isMilestone && (
                                                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 mt-0.5" />
                                            )}
                                        </>
                                    )}

                                    {/* Indicador de hito de premio */}
                                    {isMilestone && (
                                        <span
                                            className={`absolute -top-1.5 -right-1.5 px-1 py-0.2 text-[8px] font-black rounded-full shadow-xs ${
                                                isMarked
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-amber-200 text-amber-900'
                                            }`}
                                        >
                                            Hito
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Resumen del Balance de la Campaña */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/60 p-4 rounded-2xl border border-[#dfcbb5] text-xs">
                    <div>
                        <span className="text-gray-500 block">Total compras desde 1 Nov:</span>
                        <span className="font-extrabold text-gray-900 text-sm">
                            Bs {balance.total_compras_campana_bs.toFixed(2)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Sellos enteros ganados:</span>
                        <span className="font-extrabold text-amber-800 text-sm">
                            {balance.sellos_totales_ganados} sellos
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Sellos ya canjeados:</span>
                        <span className="font-extrabold text-rose-700 text-sm">
                            {balance.sellos_canjeados} sellos
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Tickets analizados:</span>
                        <span className="font-extrabold text-gray-900 text-sm">
                            {balance.tickets_computados} compras
                        </span>
                    </div>
                </div>
            </div>

            {/* Desglose Ticket por Ticket (Auditoría de regla entera sin acumulativos) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    Auditoría de Compras de este Cliente (Ticket por Ticket)
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                    Demostración de la regla: cada compra divide su monto entre Bs 30 enteros. Los saldos no se acumulan entre tickets.
                </p>

                {historial_tickets.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400 bg-gray-50 rounded-xl">
                        Este cliente aún no registra compras válidas desde el 1 de noviembre de 2026.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-2.5 px-3">Fecha</th>
                                    <th className="py-2.5 px-3">Monto Ticket</th>
                                    <th className="py-2.5 px-3">Cálculo Entero</th>
                                    <th className="py-2.5 px-3 text-emerald-700">Sellos Otorgados</th>
                                    <th className="py-2.5 px-3 text-gray-400">Residuo (No Acumulable)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {historial_tickets.map(t => (
                                    <tr key={t.ticket_id} className="hover:bg-gray-50/60">
                                        <td className="py-2 px-3 font-medium text-gray-700 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {new Date(t.fecha).toLocaleDateString('es-BO', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="py-2 px-3 font-bold text-gray-900">
                                            Bs {t.monto_bs.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600">
                                            {t.monto_bs.toFixed(2)} ÷ 30 = {(t.monto_bs / 30).toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 font-extrabold text-emerald-700">
                                            +{t.sellos_otorgados} {t.sellos_otorgados === 1 ? 'sello' : 'sellos'}
                                        </td>
                                        <td className="py-2 px-3 text-gray-400">
                                            Bs {t.sobrante_no_acumulable_bs.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
