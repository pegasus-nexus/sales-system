import React from 'react';
import { 
    CreditCard, Phone, Mail, MapPin, ShoppingBag, 
    Edit2, Trash2, MessageCircle, Sparkles, FolderOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Cliente } from '../../api/clientes';

interface Props {
    clientes: Cliente[];
    isLoading: boolean;
    searchTerm: string;
    onSelectCliente: (cliente: Cliente) => void;
    onEditCliente: (cliente: Cliente) => void;
    onDeleteCliente: (id: string, nombre: string) => void;
    onOpenWallet: (cliente: Cliente) => void;
    onAsignarTarjeta: (cliente: Cliente) => void;
    isAssigningCardId: string | null;
}

export const ClientesKanbanView: React.FC<Props> = ({
    clientes,
    isLoading,
    searchTerm,
    onSelectCliente,
    onEditCliente,
    onDeleteCliente,
    onOpenWallet,
    onAsignarTarjeta,
    isAssigningCardId,
}) => {
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm font-medium">Cargando directorio de clientes...</p>
            </div>
        );
    }

    if (clientes.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-4 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <ShoppingBag size={24} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">No se encontraron clientes</h3>
                    <p className="text-gray-500 text-xs mt-0.5 max-w-sm">
                        {searchTerm
                            ? 'No hay registros que coincidan con los filtros o término de búsqueda.'
                            : 'Aún no tienes clientes registrados con este filtro.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clientes.map((cliente: Cliente) => {
                const initial = (cliente.nombre || 'C').charAt(0).toUpperCase();
                const cleanPhone = (cliente.telefono || '').replace(/\D/g, '');
                const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.length <= 8 ? '591' + cleanPhone : cleanPhone}`
                    : null;
                const hasCard = Boolean(cliente.numero_tarjeta);
                const isAssigningThis = isAssigningCardId === cliente._id;

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={cliente._id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition-all group flex flex-col cursor-pointer"
                        onClick={() => onSelectCliente(cliente)}
                    >
                        {/* Top Card Section */}
                        <div className="p-4 flex-1">
                            {/* Header row: Avatar, Name & Edit/Delete quick buttons */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200/60 flex items-center justify-center text-indigo-700 font-black text-base shrink-0 shadow-xs">
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        <h3
                                            className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors"
                                            title={cliente.nombre}
                                        >
                                            {cliente.nombre}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 font-medium block">
                                            {cliente.nit_ci ? `NIT: ${cliente.nit_ci}` : 'Sin NIT/CI'}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        title="Editar cliente"
                                        onClick={() => onEditCliente(cliente)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Eliminar cliente"
                                        onClick={() => onDeleteCliente(cliente._id, cliente.nombre)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Tarjeta Taboada Badge / Action Banner */}
                            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                                {hasCard ? (
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-2 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <CreditCard size={14} className="text-amber-700 shrink-0" />
                                            <span className="font-mono text-xs font-black text-amber-950 truncate">
                                                {cliente.numero_tarjeta}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onOpenWallet(cliente)}
                                            className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-all flex items-center gap-1 shrink-0 shadow-2xs"
                                        >
                                            <Sparkles size={11} /> Wallet
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isAssigningThis}
                                        onClick={() => onAsignarTarjeta(cliente)}
                                        className="w-full bg-gray-50 hover:bg-amber-50/70 border border-dashed border-gray-300 hover:border-amber-300 rounded-xl py-1.5 px-2 text-[11px] font-bold text-gray-600 hover:text-amber-800 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Sparkles size={12} className="text-amber-600" />
                                        <span>{isAssigningThis ? 'Asignando...' : '+ Asignar Tarjeta Taboada'}</span>
                                    </button>
                                )}
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-1.5 text-xs text-gray-600">
                                {cliente.telefono && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Phone size={13} className="text-gray-400 shrink-0" />
                                            <span className="font-mono text-[11px] truncate">{cliente.telefono}</span>
                                        </div>
                                        {waUrl && (
                                            <a
                                                href={waUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                title="Contactar por WhatsApp"
                                                className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded-md transition-colors"
                                            >
                                                <MessageCircle size={13} />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {cliente.email && (
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={13} className="text-gray-400 shrink-0" />
                                        <span className="truncate text-[11px] text-gray-500">{cliente.email}</span>
                                    </div>
                                )}

                                {cliente.direccion && (
                                    <div className="flex items-start gap-1.5">
                                        <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                        <span className="line-clamp-1 text-[11px] text-gray-500">{cliente.direccion}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Stats & Operational Quick Actions */}
                        <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 text-[11px]">
                                <div>
                                    <span className="text-gray-400 font-medium block">Compras</span>
                                    <span className="font-bold text-gray-800">{cliente.cantidad_compras || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-medium block">Total</span>
                                    <span className="font-bold text-indigo-700 font-mono">
                                        {formatMoney(cliente.total_compras || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    onClick={() => onSelectCliente(cliente)}
                                    title="Ver expediente y planes"
                                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 rounded-lg transition-colors"
                                >
                                    <FolderOpen size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onOpenWallet(cliente)}
                                    title="Pase Google Wallet"
                                    className="px-2 py-1 rounded-lg bg-gray-900 hover:bg-black text-white text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                                >
                                    <CreditCard size={12} />
                                    <span>Pase</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
