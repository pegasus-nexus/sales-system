import React from 'react';
import { 
    CreditCard, MessageCircle, Edit2, Trash2, FolderOpen, Sparkles, ShoppingBag 
} from 'lucide-react';
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

export const ClientesListView: React.FC<Props> = ({
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
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400 bg-white rounded-2xl border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm font-medium">Cargando directorio de clientes...</p>
            </div>
        );
    }

    if (clientes.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-4 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <ShoppingBag size={24} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">No se encontraron clientes</h3>
                    <p className="text-gray-500 text-xs mt-0.5 max-w-sm">
                        {searchTerm
                            ? 'No hay registros que coincidan con la búsqueda o filtro actual.'
                            : 'Aún no tienes clientes registrados con este filtro.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="py-3.5 px-4">Cliente</th>
                            <th className="py-3.5 px-4">NIT / CI</th>
                            <th className="py-3.5 px-4">Contacto</th>
                            <th className="py-3.5 px-4">Tarjeta Taboada</th>
                            <th className="py-3.5 px-4 text-center">Compras</th>
                            <th className="py-3.5 px-4 text-right">Total Bs</th>
                            <th className="py-3.5 px-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                        {clientes.map((cliente: Cliente) => {
                            const initial = (cliente.nombre || 'C').charAt(0).toUpperCase();
                            const cleanPhone = (cliente.telefono || '').replace(/\D/g, '');
                            const waUrl = cleanPhone
                                ? `https://wa.me/${cleanPhone.length <= 8 ? '591' + cleanPhone : cleanPhone}`
                                : null;
                            const hasCard = Boolean(cliente.numero_tarjeta);
                            const isAssigningThis = isAssigningCardId === cliente._id;

                            return (
                                <tr
                                    key={cliente._id}
                                    onClick={() => onSelectCliente(cliente)}
                                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                                >
                                    {/* Cliente */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                                                {initial}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate max-w-[200px]" title={cliente.nombre}>
                                                    {cliente.nombre}
                                                </p>
                                                {cliente.email && (
                                                    <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{cliente.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* NIT / CI */}
                                    <td className="py-3 px-4 font-mono text-gray-600">
                                        {cliente.nit_ci || <span className="text-gray-300 italic">S/N</span>}
                                    </td>

                                    {/* Contacto */}
                                    <td className="py-3 px-4">
                                        {cliente.telefono ? (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <span className="font-mono text-gray-800">{cliente.telefono}</span>
                                                {waUrl && (
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="WhatsApp"
                                                        className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded"
                                                    >
                                                        <MessageCircle size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 italic">Sin teléfono</span>
                                        )}
                                    </td>

                                    {/* Tarjeta Taboada */}
                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                        {hasCard ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-mono text-[11px] font-black">
                                                <CreditCard size={12} className="text-amber-600" />
                                                {cliente.numero_tarjeta}
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={isAssigningThis}
                                                onClick={() => onAsignarTarjeta(cliente)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-gray-300 hover:border-amber-400 text-gray-500 hover:text-amber-800 hover:bg-amber-50 text-[10px] font-semibold transition-all"
                                            >
                                                <Sparkles size={11} className="text-amber-500" />
                                                <span>{isAssigningThis ? 'Asignando...' : '+ Asignar'}</span>
                                            </button>
                                        )}
                                    </td>

                                    {/* Compras */}
                                    <td className="py-3 px-4 text-center font-bold text-gray-700">
                                        {cliente.cantidad_compras || 0}
                                    </td>

                                    {/* Total Bs */}
                                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                                        {formatMoney(cliente.total_compras || 0)}
                                    </td>

                                    {/* Acciones */}
                                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Google Wallet Button */}
                                            <button
                                                type="button"
                                                onClick={() => onOpenWallet(cliente)}
                                                title="Emitir pase Google Wallet"
                                                className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-all flex items-center gap-1 shadow-2xs"
                                            >
                                                <CreditCard size={11} /> Wallet
                                            </button>

                                            {/* Detalles / Planes */}
                                            <button
                                                type="button"
                                                onClick={() => onSelectCliente(cliente)}
                                                title="Expediente del cliente"
                                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <FolderOpen size={15} />
                                            </button>

                                            {/* Editar */}
                                            <button
                                                type="button"
                                                onClick={() => onEditCliente(cliente)}
                                                title="Editar cliente"
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={15} />
                                            </button>

                                            {/* Eliminar */}
                                            <button
                                                type="button"
                                                onClick={() => onDeleteCliente(cliente._id, cliente.nombre)}
                                                title="Eliminar cliente"
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
