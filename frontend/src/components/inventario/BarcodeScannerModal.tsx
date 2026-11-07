import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Barcode, CheckCircle2, Plus, Minus,
    Trash2, Copy, Volume2, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { useBarcodeSound } from '../../hooks/useBarcodeSound';

export interface BarcodeProduct {
    id: string;
    nombre: string;
    codigo_barras?: string;
    sku?: string;
    precio_venta?: number;
    categoria?: string;
}

interface ScannedProductEntry {
    product: BarcodeProduct;
    scannedQty: number;
    lastScannedAt: Date;
    stockActual?: number;
}

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: BarcodeProduct[];
    stockMap?: Record<string, number>;
    currentAlmacenNombre?: string;
    onApplyCount?: (counts: { productId: string; qty: number }[]) => void;
}

export default function BarcodeScannerModal({
    isOpen,
    onClose,
    products,
    stockMap = {},
    currentAlmacenNombre = 'Almacén Principal',
    onApplyCount,
}: BarcodeScannerModalProps) {
    const { playSuccessBeep, playErrorBeep } = useBarcodeSound();
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scannedItems, setScannedItems] = useState<Record<string, ScannedProductEntry>>({});
    const [lastScannedId, setLastScannedId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Odoo 19 Lazy Barcode Cache: Mapa en memoria de barcode/SKU/id -> Producto (0ms lookups)
    const barcodeIndex = useMemo(() => {
        const map = new Map<string, BarcodeProduct>();
        for (const p of products) {
            if (p.codigo_barras) {
                map.set(p.codigo_barras.trim().toLowerCase(), p);
            }
            if (p.sku) {
                map.set(p.sku.trim().toLowerCase(), p);
            }
            if (p.id) {
                map.set(String(p.id).toLowerCase(), p);
            }
        }
        return map;
    }, [products]);

    // Mantener el input siempre enfocado para lectura continua con pistola
    useEffect(() => {
        if (isOpen) {
            setScannedItems({});
            setBarcodeInput('');
            setLastScannedId(null);
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [isOpen]);

    const handleProcessBarcode = useCallback((rawCode: string) => {
        const code = rawCode.trim().toLowerCase();
        if (!code) return;

        const matchedProduct = barcodeIndex.get(code);

        if (!matchedProduct) {
            playErrorBeep();
            toast.error(`Código no reconocido: "${rawCode}"`);
            setBarcodeInput('');
            return;
        }

        playSuccessBeep();
        const pId = String(matchedProduct.id);
        const stockActual = stockMap[pId] ?? 0;

        setScannedItems((prev) => {
            const current = prev[pId];
            const currentQty = current ? current.scannedQty : 0;
            return {
                ...prev,
                [pId]: {
                    product: matchedProduct,
                    scannedQty: currentQty + 1,
                    lastScannedAt: new Date(),
                    stockActual,
                },
            };
        });

        setLastScannedId(pId);
        setBarcodeInput('');
    }, [barcodeIndex, stockMap, playSuccessBeep, playErrorBeep]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleProcessBarcode(barcodeInput);
        }
    };

    const handleAdjustQty = (productId: string, delta: number) => {
        setScannedItems((prev) => {
            const item = prev[productId];
            if (!item) return prev;
            const newQty = item.scannedQty + delta;
            if (newQty <= 0) {
                const next = { ...prev };
                delete next[productId];
                return next;
            }
            return {
                ...prev,
                [productId]: {
                    ...item,
                    scannedQty: newQty,
                    lastScannedAt: new Date(),
                },
            };
        });
    };

    const handleCopySummary = () => {
        const items = Object.values(scannedItems);
        if (items.length === 0) {
            toast.info('No hay ítems escaneados para copiar');
            return;
        }
        const text = items
            .map(
                (item) =>
                    `${item.product.nombre} (Cod: ${item.product.codigo_barras || item.product.sku || 'S/C'}) x${item.scannedQty}`
            )
            .join('\n');
        navigator.clipboard.writeText(text);
        toast.success('Resumen de escaneo copiado al portapapeles');
    };

    const itemsList = useMemo(() => {
        return Object.values(scannedItems).sort(
            (a, b) => b.lastScannedAt.getTime() - a.lastScannedAt.getTime()
        );
    }, [scannedItems]);

    const totalUnidades = useMemo(() => {
        return itemsList.reduce((acc, curr) => acc + curr.scannedQty, 0);
    }, [itemsList]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 select-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-gray-950/85 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-3xl bg-[#0e131f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
                >
                    {/* Header estilo Terminal Odoo 19 Barcode */}
                    <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-[#0e131f] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                                <Barcode size={22} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-white">
                                        Terminal de Código de Barras
                                    </h3>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        Odoo Barcode Mode
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Escanea continuamente con tu pistola láser o teclado en <b className="text-gray-300">{currentAlmacenNombre}</b>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400">
                                <Volume2 size={13} className="text-indigo-400" />
                                <span>Bip activo</span>
                            </span>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Barra de Lectura Continua */}
                    <div className="p-6 pb-3 border-b border-white/5 bg-[#121828]/60 shrink-0">
                        <div className="relative">
                            <Barcode size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={() => setTimeout(() => inputRef.current?.focus(), 100)}
                                placeholder="Escanea un código de barras o escribe SKU..."
                                className="w-full pl-13 pr-24 py-3.5 rounded-2xl bg-white/10 border-2 border-indigo-500/40 focus:border-indigo-500 text-white placeholder-gray-500 text-base font-mono font-bold focus:outline-hidden transition-all shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => handleProcessBarcode(barcodeInput)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                                Enter ↵
                            </button>
                        </div>

                        {/* Contadores KPI del escaneo */}
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                                    Productos Distintos
                                </span>
                                <span className="text-lg font-black text-indigo-400 font-mono">
                                    {itemsList.length}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                                    Total Piezas Escaneadas
                                </span>
                                <span className="text-lg font-black text-emerald-400 font-mono">
                                    {totalUnidades}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                                    Caché de Catálogo
                                </span>
                                <span className="text-lg font-black text-amber-400 font-mono">
                                    {barcodeIndex.size} ref.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Ítems Escaneados */}
                    <div className="p-6 overflow-y-auto space-y-2.5 custom-scrollbar flex-1 bg-[#0b0e17]">
                        {itemsList.length === 0 ? (
                            <div className="py-14 text-center text-gray-500">
                                <Package size={40} className="mx-auto text-gray-600 mb-2 opacity-40 animate-pulse" />
                                <p className="text-sm font-medium text-gray-400">Terminal esperando lecturas</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Apunta tu lector de barras a los productos para sumar existencias automáticamente
                                </p>
                            </div>
                        ) : (
                            itemsList.map((entry) => {
                                const pId = String(entry.product.id);
                                const isJustScanned = lastScannedId === pId;

                                return (
                                    <motion.div
                                        key={pId}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                            isJustScanned
                                                ? 'bg-indigo-900/30 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                                                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-white truncate">
                                                    {entry.product.nombre}
                                                </h4>
                                                {isJustScanned && (
                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 animate-pulse">
                                                        Reciente
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-gray-400">
                                                <span>Cod: {entry.product.codigo_barras || 'S/C'}</span>
                                                <span>•</span>
                                                <span>SKU: {entry.product.sku || 'S/SKU'}</span>
                                                <span>•</span>
                                                <span className="text-gray-300">
                                                    Stock actual: <b>{entry.stockActual ?? 0}</b>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Contador con controles táctiles */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustQty(pId, -1)}
                                                    className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="px-3 font-mono font-black text-sm text-emerald-400 min-w-[36px] text-center">
                                                    {entry.scannedQty}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustQty(pId, 1)}
                                                    className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer con Acciones */}
                    <div className="px-6 py-4 bg-[#121828] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopySummary}
                                disabled={itemsList.length === 0}
                                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 border border-white/5"
                            >
                                <Copy size={13} />
                                <span>Copiar Resumen</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setScannedItems({})}
                                disabled={itemsList.length === 0}
                                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 border border-red-500/20"
                            >
                                <Trash2 size={13} />
                                <span>Limpiar</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {onApplyCount && itemsList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const counts = itemsList.map((i) => ({
                                            productId: String(i.product.id),
                                            qty: i.scannedQty,
                                        }));
                                        onApplyCount(counts);
                                        onClose();
                                    }}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Aplicar a Conteo Físico</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
