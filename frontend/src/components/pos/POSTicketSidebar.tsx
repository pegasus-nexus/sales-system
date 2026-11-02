import { CreditCard, MoreHorizontal, User as UserIcon, Plus, Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { motion, AnimatePresence } from 'framer-motion';
import { POSTicketItemList } from './POSTicketItemList';
import { POSNumpad } from './POSNumpad';
import type { CartItem, ParkedTicket, ClienteData } from '../../store/usePosStore';

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
    onOpenActionsModal: () => void;
    descAmount: number;
    totalVal: number;
    activeItem: CartItem | null;
    onOpenPaymentModal: () => void;
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
    onOpenActionsModal,
    descAmount,
    totalVal,
    activeItem,
    onOpenPaymentModal,
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
                {/* Secondary Actions Bar */}
                <div className="grid grid-cols-3 gap-1.5">
                    <button
                        type="button"
                        onClick={onOpenActionsModal}
                        className="col-span-2 py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-gray-700 hover:text-indigo-700 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                        <span className="flex items-center gap-1.5 truncate">
                            <UserIcon size={13} className="text-indigo-600 shrink-0" />
                            <span className="truncate">{cliente.razon_social || 'Asignar Cliente'}</span>
                        </span>
                        {cliente.es_factura && (
                            <span className="text-[9px] bg-indigo-600 text-white font-bold px-1 rounded">NIT</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onOpenActionsModal}
                        className="py-1.5 px-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-gray-700 hover:text-indigo-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                        <MoreHorizontal size={14} className="text-gray-500" />
                        <span>Acciones</span>
                    </button>
                </div>

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
