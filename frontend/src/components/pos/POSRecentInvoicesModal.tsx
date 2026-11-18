import React, { useState, useEffect } from 'react';
import { 
    X, 
    Copy, 
    Check, 
    Trash2, 
    History, 
    User, 
    Phone, 
    Receipt, 
    Sparkles, 
    Search, 
    ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
    getRecentInvoices, 
    removeRecentInvoice, 
    clearRecentInvoices, 
    type RecentInvoiceEntry 
} from '../../utils/recentInvoicesStorage';
import type { ClienteData } from '../../store/usePosStore';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectCliente: (cliente: Partial<ClienteData>) => void;
}

export const POSRecentInvoicesModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSelectCliente,
}) => {
    const [entries, setEntries] = useState<RecentInvoiceEntry[]>([]);
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const loadEntries = () => {
        setEntries(getRecentInvoices());
    };

    useEffect(() => {
        if (isOpen) {
            loadEntries();
        }
    }, [isOpen]);

    useEffect(() => {
        const handler = () => loadEntries();
        window.addEventListener('pos_recent_invoices_updated', handler);
        return () => window.removeEventListener('pos_recent_invoices_updated', handler);
    }, []);

    if (!isOpen) return null;

    const filtered = entries.filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            e.razon_social.toLowerCase().includes(q) ||
            (e.nit && e.nit.includes(q)) ||
            (e.telefono && e.telefono.includes(q)) ||
            (e.ticket_corto && e.ticket_corto.toLowerCase().includes(q))
        );
    });

    const handleCopy = (text: string, id: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(`Copiado: ${label}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleApply = (item: RecentInvoiceEntry) => {
        onSelectCliente({
            razon_social: item.razon_social,
            nit: item.nit || '',
            telefono: item.telefono || '',
            email: item.email || '',
            es_factura: item.es_factura ?? Boolean(item.nit),
            is_miembro_comunidad: item.is_miembro_comunidad ?? false,
        });
        toast.success(`Datos de "${item.razon_social}" cargados al ticket`);
        onClose();
    };

    const handleDeleteOne = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeRecentInvoice(id);
        setEntries(getRecentInvoices());
    };

    const handleClearAll = () => {
        if (window.confirm('¿Deseas vaciar la papelera de datos de facturación temporal?')) {
            clearRecentInvoices();
            setEntries([]);
            toast.success('Papelera vaciada');
        }
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const diffMins = Math.round((Date.now() - ts) / 60000);

        if (diffMins < 1) return 'Recién ahora';
        if (diffMins < 60) return `Hace ${diffMins} min (${hours}:${mins})`;
        return `${d.toLocaleDateString()} ${hours}:${mins}`;
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-indigo-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                                Papelera & Memoria de Facturas
                                <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                    {entries.length} guardadas
                                </span>
                            </h3>
                            <p className="text-xs text-gray-500">
                                Recupera datos si la venta se cerró rápido o el cliente se fue.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filtrar por nombre, NIT, celular o ticket..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 bg-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    {entries.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-[11px] font-bold text-gray-400 hover:text-rose-600 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1 shrink-0"
                            title="Vaciar todo el historial temporal"
                        >
                            <Trash2 size={13} /> Vaciar
                        </button>
                    )}
                </div>

                {/* List of Invoices */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50/40 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
                            <Receipt size={40} className="text-gray-300 mb-2 stroke-1" />
                            <p className="text-sm font-bold text-gray-600">No hay datos en memoria</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs">
                                Cuando ingreses o cobres a un cliente con factura o teléfono, quedará respaldado aquí automáticamente.
                            </p>
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                                            <User size={13} className="text-indigo-600 shrink-0" />
                                            {item.razon_social}
                                        </span>
                                        {item.ticket_corto && (
                                            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded border border-gray-200">
                                                Ticket #{item.ticket_corto}
                                            </span>
                                        )}
                                        {item.is_miembro_comunidad && (
                                            <span className="text-[9px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 px-1.5 py-0.2 rounded">
                                                ⭐ Comunidad
                                            </span>
                                        )}
                                        {item.es_factura && (
                                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                                                Factura
                                            </span>
                                        )}
                                    </div>

                                    {/* NIT & Contact Info */}
                                    <div className="flex items-center gap-3 text-[11px] text-gray-600 flex-wrap">
                                        {item.nit && (
                                            <span className="font-mono bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-800 font-semibold">
                                                NIT: {item.nit}
                                            </span>
                                        )}
                                        {item.telefono && (
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <Phone size={10} className="text-emerald-600" /> {item.telefono}
                                            </span>
                                        )}
                                        {item.total !== undefined && (
                                            <span className="font-mono text-gray-500 font-bold">
                                                Total: Bs. {item.total.toFixed(2)}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400 ml-auto">
                                            {formatTime(item.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 justify-end">
                                    {item.nit && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(item.nit || '', item.id, `NIT ${item.nit}`)}
                                            className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                                            title="Copiar solo NIT"
                                        >
                                            {copiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            <span className="text-[10px]">NIT</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleApply(item)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-100 transition-colors"
                                        title="Cargar estos datos en la orden actual"
                                    >
                                        <span>Restaurar</span>
                                        <ArrowRight size={13} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteOne(item.id, e)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Tip */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                        <Sparkles size={12} className="text-indigo-500" />
                        Guarda los últimos 25 registros temporalmente en este navegador.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-bold text-gray-700 hover:text-gray-900"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
