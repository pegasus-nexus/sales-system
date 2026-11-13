import React, { useState } from 'react';
import { X, CreditCard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Cliente } from '../../api/clientes';
import { ClienteMealPlansSection } from './ClienteMealPlansSection';

interface Props {
    cliente: Cliente | null;
    onClose: () => void;
    onOpenWallet: (cliente: Cliente) => void;
    onAsignarTarjeta: (cliente: Cliente) => void;
}

export const ClienteDetailsModal: React.FC<Props> = ({
    cliente,
    onClose,
    onOpenWallet,
    onAsignarTarjeta,
}) => {
    const [detailsTab, setDetailsTab] = useState<'info' | 'planes'>('info');

    if (!cliente) return null;

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
    };

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px]"
            >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg shadow-2xs">
                            {(cliente.nombre || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-900 leading-tight">{cliente.nombre}</h2>
                            <p className="text-xs text-gray-500 font-medium">Expediente Odoo de Cliente</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Google Wallet Header Pill */}
                        <button
                            type="button"
                            onClick={() => onOpenWallet(cliente)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                        >
                            <CreditCard size={14} /> Google Wallet
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-xl transition-colors shadow-2xs border border-gray-200"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-100 px-6 shrink-0 bg-white">
                    <button
                        type="button"
                        onClick={() => setDetailsTab('info')}
                        className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                            detailsTab === 'info'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Información General
                    </button>
                    <button
                        type="button"
                        onClick={() => setDetailsTab('planes')}
                        className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                            detailsTab === 'planes'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Planes de Comida (Dark Kitchen)
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-gray-50/40 custom-scrollbar">
                    {detailsTab === 'info' ? (
                        <div className="space-y-4">
                            {/* Tarjeta Taboada Status Banner */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                                            Tarjeta Digital Taboada
                                        </p>
                                        <p className="font-mono text-base font-black text-amber-950">
                                            {cliente.numero_tarjeta || 'Sin asignar'}
                                        </p>
                                    </div>
                                </div>
                                {cliente.numero_tarjeta ? (
                                    <button
                                        type="button"
                                        onClick={() => onOpenWallet(cliente)}
                                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                                    >
                                        <Sparkles size={13} /> Ver Pase Wallet
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onAsignarTarjeta(cliente)}
                                        className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                                    >
                                        <Sparkles size={13} /> Asignar Tarjeta
                                    </button>
                                )}
                            </div>

                            {/* Info Grid */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-xs grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        NIT / CI
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 font-mono">
                                        {cliente.nit_ci || 'No registrado'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Teléfono
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 font-mono">
                                        {cliente.telefono || 'No registrado'}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Email
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {cliente.email || 'No registrado'}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Dirección
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                        {cliente.direccion || 'No registrada'}
                                    </div>
                                </div>
                            </div>

                            {/* Ventas metrics */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-xs grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Compras Totales
                                    </div>
                                    <div className="text-xl font-black text-gray-900">
                                        {cliente.cantidad_compras || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Total Facturado
                                    </div>
                                    <div className="text-xl font-black text-indigo-700 font-mono">
                                        {formatMoney(cliente.total_compras || 0)}
                                    </div>
                                </div>
                            </div>

                            {/* Notas */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-xs">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Notas Internas
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed italic">
                                    {cliente.notas || 'Sin notas adicionales.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ClienteMealPlansSection cliente={cliente} />
                    )}
                </div>
            </motion.div>
        </div>
    );
};
