import { Minus, Plus, Trash2, ShoppingCart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem } from '../../store/usePosStore';

interface POSTicketItemListProps {
    items: CartItem[];
    selectedKey: string | null;
    onSelectItem: (key: string) => void;
    onUpdateQty: (productId: string, almacenId: string, delta: number) => void;
    onRemoveItem: (productId: string, almacenId: string) => void;
    hasMultipleAlmacenes: boolean;
}

const fmt = (n?: number) => (n || 0).toFixed(2);

export function POSTicketItemList({
    items,
    selectedKey,
    onSelectItem,
    onUpdateQty,
    onRemoveItem,
    hasMultipleAlmacenes
}: POSTicketItemListProps) {
    if (items.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full py-8 text-gray-400 select-none"
            >
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-100">
                    <ShoppingCart size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Ticket Vacío</p>
                <p className="text-xs text-gray-400 text-center mt-1 max-w-[200px]">
                    Selecciona o escanea productos del catálogo para comenzar.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-1.5 overflow-y-auto px-1 py-1 pr-1.5 scroll-smooth max-h-full">
            <AnimatePresence initial={false}>
                {items.map((item) => {
                    const itemKey = `${item.product._id}-${item.almacen_id}`;
                    const isSelected = selectedKey === itemKey;

                    return (
                        <motion.div
                            key={itemKey}
                            layout
                            initial={{ opacity: 0, scale: 0.96, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                            transition={{ duration: 0.15 }}
                            onClick={() => onSelectItem(itemKey)}
                            className={`flex items-center gap-2.5 rounded-xl p-2.5 transition-all cursor-pointer border ${
                                isSelected
                                    ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-1 ring-indigo-200'
                                    : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200'
                            }`}
                        >
                            {/* Quantity badge */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {item.quantity}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate leading-snug">
                                    {item.product.descripcion}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {hasMultipleAlmacenes && item.almacen_nombre && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.2">
                                            <Package size={9} /> {item.almacen_nombre}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-gray-400">
                                        Bs. {fmt(item.precio)} × {item.quantity}
                                    </span>
                                </div>
                            </div>

                            {/* Row total */}
                            <div className="text-right shrink-0">
                                <span className="font-mono font-black text-xs text-gray-900 block">
                                    Bs. {fmt(item.precio * item.quantity)}
                                </span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateQty(item.product._id, item.almacen_id, -1);
                                    }}
                                    className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
                                    title="Restar 1"
                                >
                                    <Minus size={11} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateQty(item.product._id, item.almacen_id, 1);
                                    }}
                                    className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
                                    title="Sumar 1"
                                >
                                    <Plus size={11} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveItem(item.product._id, item.almacen_id);
                                    }}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-0.5 cursor-pointer"
                                    title="Eliminar producto"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
