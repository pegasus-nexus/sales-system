import { 
    CreditCard, MoreHorizontal, User as UserIcon, Plus, Keyboard, 
    ChevronDown, ChevronUp, SlidersHorizontal, Tag, MessageSquare, Calendar, FileText 
} from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { motion, AnimatePresence } from 'framer-motion';
import { POSTicketItemList } from './POSTicketItemList';
import { POSNumpad } from './POSNumpad';
import type { CartItem, ParkedTicket, ClienteData, VendedorData } from '../../store/usePosStore';
import type { Descuento, User } from '../../api/types';
import type { POSQuickWidget } from './POSCustomizeModal';

interface POSTicketSidebarProps {
    isMobileTabActive: boolean;
    parkedTickets: ParkedTicket[];
    onRestoreTicket: (idx: number) => void;
    onRemoveParkedTicket: (idx: number) => void;
    onParkTicket: () => void;
    items: CartItem[];
    username?: string;
    selectedItemKey: string | null;
    onSelectItemKey: (key: string) => void;
    onUpdateQty: (productId: string, almacenId: string, delta: number) => void;
    onSetQty: (productId: string, almacenId: string, qty: number) => void;
    onRemoveItem: (productId: string, almacenId: string) => void;
    hasMultipleAlmacenes: boolean;
    cliente: ClienteData;
    setCliente: (data: Partial<ClienteData>) => void;
    onOpenActionsModal: () => void;
    onOpenCustomizeModal: () => void;
    descAmount: number;
    totalVal: number;
    activeItem: CartItem | null;
    onOpenPaymentModal: () => void;
    // Pinned widgets data
    pinnedWidgets: POSQuickWidget[];
    vendedor: VendedorData;
    setVendedor: (data: Partial<VendedorData>) => void;
    vendedores: User[];
    descuento: { tipo: 'MONTO' | 'PORCENTAJE'; valor: string; nombre?: string };
    setDescuento: (tipo: 'MONTO' | 'PORCENTAJE', valor: string, nombre?: string) => void;
    descuentosDisponibles: Descuento[];
    loadingDescuentos?: boolean;
    sendWhatsApp: boolean;
    setSendWhatsApp: (val: boolean) => void;
    hasWhatsAppEnabled?: boolean;
    fechaVenta: string;
    setFechaVenta: (val: string) => void;
    canEditDate: boolean;
    onOpenSettleDue?: () => void;
}

const fmt = (n?: number) => (n || 0).toFixed(2);

export function POSTicketSidebar({
    isMobileTabActive,
    parkedTickets,
    onRestoreTicket,
    onRemoveParkedTicket,
    onParkTicket,
    items,
    username,
    selectedItemKey,
    onSelectItemKey,
    onUpdateQty,
    onSetQty,
    onRemoveItem,
    hasMultipleAlmacenes,
    cliente,
    setCliente,
    onOpenActionsModal,
    onOpenCustomizeModal,
    descAmount,
    totalVal,
    activeItem,
    onOpenPaymentModal,
    pinnedWidgets,
    vendedor,
    setVendedor,
    vendedores,
    descuento,
    setDescuento,
    descuentosDisponibles,
    loadingDescuentos,
    sendWhatsApp,
    setSendWhatsApp,
    hasWhatsAppEnabled,
    fechaVenta,
    setFechaVenta,
    canEditDate,
    onOpenSettleDue,
}: POSTicketSidebarProps) {
    const [showNumpad, setShowNumpad] = useLocalStorage<boolean>('pos-show-numpad', false);

    return (
        <div
            className={`md:w-[420px] lg:w-[440px] w-full md:flex flex-col overflow-hidden bg-white border-r border-gray-200 shadow-xl shrink-0 ${
                isMobileTabActive ? 'flex' : 'hidden md:flex'
            }`}
        >
            {/* Header: Tabs & Order # */}
            <div className="shrink-0 px-3.5 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-900 rounded-lg text-xs font-black shadow-2xs">
                        Orden Actual
                    </span>
                    {parkedTickets.map((pt, idx) => (
                        <button
                            key={pt.id}
                            type="button"
                            onClick={() => onRestoreTicket(idx)}
                            className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-amber-100 cursor-pointer"
                        >
                            <span>#{pt.id}</span>
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveParkedTicket(idx);
                                }}
                                className="hover:text-red-600"
                            >
                                ×
                            </span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {items.length > 0 && (
                        <button
                            type="button"
                            onClick={onParkTicket}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-transparent hover:border-gray-200"
                            title="Parquear orden en espera"
                        >
                            <Plus size={13} /> Espera
                        </button>
                    )}
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-full">
                        {username || 'Cajero'}
                    </span>
                </div>
            </div>

            {/* Ticket Items (Scrollable - expands when Numpad is hidden) */}
            <div className="flex-1 overflow-y-auto min-h-[140px] p-2 bg-gray-50/30">
                <POSTicketItemList
                    items={items}
                    selectedKey={selectedItemKey}
                    onSelectItem={onSelectItemKey}
                    onUpdateQty={onUpdateQty}
                    onRemoveItem={onRemoveItem}
                    hasMultipleAlmacenes={hasMultipleAlmacenes}
                />
            </div>

            {/* Ticket Summary & Action Triggers */}
            <div className="shrink-0 border-t border-gray-100 p-3 bg-white space-y-2">
                {/* Secondary Actions Bar with Customize button */}
                <div className="flex gap-1.5 items-center">
                    <button
                        type="button"
                        onClick={onOpenActionsModal}
                        className="flex-1 py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-gray-700 hover:text-indigo-700 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                        <span className="flex items-center gap-1.5 truncate">
                            <UserIcon size={13} className="text-indigo-600 shrink-0" />
                            <span className="truncate">{cliente.razon_social || 'Asignar Cliente'}</span>
                        </span>
                        {cliente.es_factura && (
                            <span className="text-[9px] bg-indigo-600 text-white font-bold px-1 rounded">NIT</span>
                        )}
                    </button>
                    {onOpenSettleDue && (
                        <button
                            type="button"
                            onClick={onOpenSettleDue}
                            className="py-1.5 px-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                            title="Cobrar Crédito / Saldar Deuda de Cliente (Odoo Settle Due)"
                        >
                            <CreditCard size={13} className="text-emerald-600" />
                            <span className="hidden sm:inline">Crédito</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onOpenActionsModal}
                        className="py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-gray-700 hover:text-indigo-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Opciones avanzadas de venta"
                    >
                        <MoreHorizontal size={14} className="text-gray-500" />
                        <span>Acciones</span>
                    </button>
                    <button
                        type="button"
                        onClick={onOpenCustomizeModal}
                        className="p-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-gray-500 hover:text-indigo-700 transition-colors cursor-pointer shrink-0"
                        title="Personalizar accesos rápidos de mi caja"
                    >
                        <SlidersHorizontal size={14} />
                    </button>
                </div>

                {/* ─── Pinned Widgets elegidos por el cajero ─── */}
                {pinnedWidgets.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-gray-100">
                        {/* 1. Descuento Rápido */}
                        {pinnedWidgets.includes('descuento') && (
                            <div className="flex items-center gap-1.5">
                                <Tag size={12} className="text-amber-600 shrink-0" />
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
                                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-900 bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                >
                                    <option value="">{loadingDescuentos ? 'Cargando...' : 'Sin descuento'}</option>
                                    {descuentosDisponibles.filter((d) => d.is_active).map((d) => (
                                        <option key={d._id} value={`${d.tipo}|${d.valor}|${d.nombre}`}>
                                            {d.nombre} ({d.tipo === 'PORCENTAJE' ? `${d.valor}%` : `Bs. ${d.valor}`})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 2. Vendedor Comisionista */}
                        {pinnedWidgets.includes('vendedor') && (
                            <div className="flex items-center gap-1.5">
                                <UserIcon size={12} className="text-indigo-600 shrink-0" />
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
                                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-900 bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                >
                                    <option value="">Vendedor: Ninguno</option>
                                    {vendedores.map((v) => (
                                        <option key={v._id} value={v._id}>
                                            Vendedor: {v.full_name || v.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 3. Factura NIT Rápido */}
                        {pinnedWidgets.includes('nit') && (
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={cliente.es_factura}
                                        onChange={(e) => setCliente({ es_factura: e.target.checked })}
                                        className="w-3.5 h-3.5 rounded text-indigo-600"
                                    />
                                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-0.5">
                                        <FileText size={11} className="text-blue-600" /> Factura
                                    </span>
                                </label>
                                {cliente.es_factura && (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={cliente.nit}
                                        onChange={(e) => setCliente({ nit: e.target.value.replace(/\D/g, '') })}
                                        placeholder="NIT / CI"
                                        className="flex-1 px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-900 bg-white outline-none"
                                    />
                                )}
                            </div>
                        )}

                        {/* 4. WhatsApp Switch */}
                        {pinnedWidgets.includes('whatsapp') && hasWhatsAppEnabled && (
                            <div className="flex items-center justify-between px-1.5 py-0.5">
                                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={sendWhatsApp}
                                        onChange={(e) => setSendWhatsApp(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded text-emerald-600"
                                    />
                                    <MessageSquare size={11} className="text-emerald-600" /> Recibo WhatsApp
                                </label>
                            </div>
                        )}

                        {/* 5. Fecha Histórica */}
                        {pinnedWidgets.includes('fecha') && canEditDate && (
                            <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-purple-600 shrink-0" />
                                <input
                                    type="datetime-local"
                                    value={fechaVenta}
                                    onChange={(e) => setFechaVenta(e.target.value)}
                                    className="w-full px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-900 bg-gray-50 focus:bg-white outline-none"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Total Bar with Numpad Toggle */}
                <div className="flex items-baseline justify-between pt-1 border-t border-gray-100">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                Total General
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowNumpad(!showNumpad)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.2 rounded cursor-pointer transition-colors"
                                title={showNumpad ? 'Ocultar teclado táctil para dar más espacio al ticket' : 'Mostrar teclado táctil'}
                            >
                                <Keyboard size={10} />
                                <span>{showNumpad ? 'Ocultar' : 'Teclado'}</span>
                                {showNumpad ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                            </button>
                        </div>
                        {descAmount > 0 && (
                            <span className="text-[10px] font-bold text-red-500">
                                Descuento: -Bs. {fmt(descAmount)}
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-gray-900 font-mono">
                            Bs. {fmt(totalVal)}
                        </span>
                    </div>
                </div>

                {/* Tactile Numpad (Collapsible for Desktop users with physical keyboards) */}
                <AnimatePresence initial={false}>
                    {showNumpad && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pt-1"
                        >
                            <POSNumpad
                                selectedItem={activeItem}
                                onUpdateQty={onSetQty}
                                onRemoveItem={onRemoveItem}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Big Pay Button */}
                <button
                    type="button"
                    onClick={onOpenPaymentModal}
                    disabled={items.length === 0}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                        items.length > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            : 'bg-gray-300 shadow-none cursor-not-allowed'
                    }`}
                >
                    <CreditCard size={18} />
                    <span>Pagar / Cobrar (F4) →</span>
                </button>
            </div>
        </div>
    );
}
