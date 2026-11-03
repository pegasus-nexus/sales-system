import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Calendar, Tag, MessageSquare, BookmarkPlus, Trash2, CheckCircle2, CreditCard } from 'lucide-react';
import { ClientCombobox } from '../ClientCombobox';
import { getClienteByNit } from '../../api/api';
import type { ClienteData, VendedorData } from '../../store/usePosStore';
import type { Descuento, User } from '../../api/types';

interface POSActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: ClienteData;
    setCliente: (data: Partial<ClienteData>) => void;
    vendedor: VendedorData;
    setVendedor: (data: Partial<VendedorData>) => void;
    vendedores: User[];
    fechaVenta: string;
    setFechaVenta: (val: string) => void;
    canEditDate: boolean;
    descuento: { tipo: 'MONTO' | 'PORCENTAJE'; valor: string; nombre?: string };
    setDescuento: (tipo: 'MONTO' | 'PORCENTAJE', valor: string, nombre?: string) => void;
    descuentosDisponibles: Descuento[];
    loadingDescuentos: boolean;
    sendWhatsApp: boolean;
    setSendWhatsApp: (val: boolean) => void;
    hasWhatsAppEnabled?: boolean;
    onParkTicket: () => void;
    onClearTicket: () => void;
    hasItems: boolean;
    onOpenSettleDue?: () => void;
}

export function POSActionsModal({
    isOpen,
    onClose,
    cliente,
    setCliente,
    vendedor,
    setVendedor,
    vendedores,
    fechaVenta,
    setFechaVenta,
    canEditDate,
    descuento,
    setDescuento,
    descuentosDisponibles,
    loadingDescuentos,
    sendWhatsApp,
    setSendWhatsApp,
    hasWhatsAppEnabled,
    onParkTicket,
    onClearTicket,
    hasItems,
    onOpenSettleDue
}: POSActionsModalProps) {
    const [isSearchingNit, setIsSearchingNit] = useState(false);
    const [nitClientMatch, setNitClientMatch] = useState<string | null>(null);
    const nitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNitChange = (val: string) => {
        const cleanNit = val.replace(/\D/g, '');
        setCliente({ nit: cleanNit, cliente_id: undefined });
        setNitClientMatch(null);

        if (nitTimerRef.current) {
            clearTimeout(nitTimerRef.current);
        }

        if (cleanNit.length >= 4) {
            nitTimerRef.current = setTimeout(async () => {
                setIsSearchingNit(true);
                try {
                    const found = await getClienteByNit(cleanNit);
                    if (found && found._id) {
                        setCliente({
                            cliente_id: found._id,
                            nit: found.nit_ci || cleanNit,
                            razon_social: found.nombre || '',
                            email: found.email || '',
                            telefono: found.telefono || '',
                        });
                        setNitClientMatch(found.nombre);
                    }
                } catch {
                    // Ignore not found
                } finally {
                    setIsSearchingNit(false);
                }
            }, 350);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h3 className="text-base font-black text-gray-900">Acciones y Datos de Venta</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Configura cliente, facturación, comisiones y opciones avanzadas.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Seccion 1: Cliente y Factura */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <UserIcon size={14} className="text-indigo-600" /> Cliente / Facturación
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={cliente.es_factura}
                                        onChange={(e) => setCliente({ es_factura: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-bold text-indigo-700">Emitir Factura (NIT)</span>
                                </label>
                            </div>

                            <ClientCombobox
                                selectedClient={cliente}
                                onSelect={(c) => setCliente(c)}
                                onClear={() => setCliente({ cliente_id: undefined, nit: '', razon_social: '', email: '', telefono: '', es_factura: false })}
                            />

                            {(cliente.es_factura || (!cliente.cliente_id && cliente.razon_social)) && (
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">NIT / CI</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={cliente.nit}
                                            onChange={(e) => handleNitChange(e.target.value)}
                                            placeholder="Ej. 1023456023"
                                            className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">Razón Social</label>
                                        <input
                                            type="text"
                                            value={cliente.razon_social}
                                            onChange={(e) => setCliente({ razon_social: e.target.value })}
                                            placeholder="Nombre del cliente o empresa"
                                            className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={cliente.email}
                                            onChange={(e) => setCliente({ email: e.target.value })}
                                            placeholder="cliente@ejemplo.com"
                                            className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">Celular (WhatsApp)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={cliente.telefono}
                                            onChange={(e) => setCliente({ telefono: e.target.value.replace(/\D/g, '') })}
                                            placeholder="Ej. 70012345"
                                            className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    {isSearchingNit && (
                                        <div className="col-span-2 text-[11px] text-indigo-600 font-medium animate-pulse flex items-center gap-1.5 mt-1">
                                            Buscando NIT en base de datos...
                                        </div>
                                    )}
                                    {nitClientMatch && (
                                        <div className="col-span-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 font-medium flex items-center gap-1 mt-1">
                                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                            <span>Cliente recurrente: <strong>{nitClientMatch}</strong></span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {hasWhatsAppEnabled && (
                                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={sendWhatsApp}
                                            onChange={(e) => setSendWhatsApp(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                            <MessageSquare size={13} className="text-emerald-600" /> Enviar comprobante por WhatsApp
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Seccion 2: Vendedor y Descuentos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Vendedor */}
                            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                                    Vendedor Comisionista
                                </label>
                                <select
                                    value={vendedor.vendedor_id || ''}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        if (!id) setVendedor({ vendedor_id: undefined, vendedor_name: undefined });
                                        else {
                                            const v = vendedores.find((usr) => usr._id === id);
                                            if (v) setVendedor({ vendedor_id: v._id, vendedor_name: v.full_name || v.username });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                                >
                                    <option value="">Sin vendedor asignado</option>
                                    {vendedores.map((v) => (
                                        <option key={v._id} value={v._id}>
                                            {v.full_name || v.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Descuentos Predefinidos */}
                            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                                    <Tag size={12} className="text-amber-600" /> Descuento General
                                </label>
                                {loadingDescuentos ? (
                                    <div className="h-8 flex items-center text-xs text-gray-400">Cargando descuentos...</div>
                                ) : (
                                    <select
                                        value={descuento.valor ? `${descuento.tipo}|${descuento.valor}|${descuento.nombre}` : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) setDescuento('MONTO', '', '');
                                            else {
                                                const [tipo, valor, nombre] = val.split('|');
                                                setDescuento(tipo as 'PORCENTAJE' | 'MONTO', valor, nombre);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                                    >
                                        <option value="">Sin descuento aplicado</option>
                                        {descuentosDisponibles.filter((d) => d.is_active).map((d) => (
                                            <option key={d._id} value={`${d.tipo}|${d.valor}|${d.nombre}`}>
                                                {d.nombre} ({d.tipo === 'PORCENTAJE' ? `${d.valor}%` : `Bs. ${d.valor}`})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Seccion 3: Fecha Histórica (Opcional) */}
                        {canEditDate && (
                            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                                    <Calendar size={13} className="text-blue-600" /> Fecha de Venta (Histórica / Regularización)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={fechaVenta}
                                    onChange={(e) => setFechaVenta(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                                />
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                    Dejar en blanco para usar la fecha y hora actual automáticamente.
                                </span>
                            </div>
                        )}

                        {/* Seccion 3.5: Odoo Settle Due (Cobrar Crédito) */}
                        {onOpenSettleDue && (
                            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-emerald-950">Cobrar Crédito / Saldar Deuda</h4>
                                        <p className="text-[11px] text-emerald-800">Registra abono de un cliente directo en caja (Odoo Settle Due)</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenSettleDue();
                                    }}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                                >
                                    Abrir Cobro →
                                </button>
                            </div>
                        )}

                        {/* Seccion 4: Operaciones de Ticket */}
                        {hasItems && (
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onParkTicket();
                                        onClose();
                                    }}
                                    className="flex-1 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <BookmarkPlus size={14} /> Parquear Ticket en Espera
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClearTicket();
                                        onClose();
                                    }}
                                    className="py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Trash2 size={14} /> Vaciar Ticket
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                            Listo
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
