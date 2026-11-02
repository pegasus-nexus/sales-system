import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package } from 'lucide-react';
import { getInventario } from '../../api/api';
import type { Product, Almacen } from '../../api/types';

interface POSAlmacenModalProps {
    product: Product | null;
    almacenes: Almacen[];
    sucursalId: string;
    onSelectAlmacen: (almacenId: string, almacenNombre: string) => void;
    onClose: () => void;
}

export function POSAlmacenModal({
    product,
    almacenes,
    sucursalId,
    onSelectAlmacen,
    onClose,
}: POSAlmacenModalProps) {
    const almacenesStockQueries = useQueries({
        queries: almacenes.map((a) => ({
            queryKey: ['inventario', sucursalId, a.id],
            queryFn: () => getInventario(sucursalId, a.id!, 1, 1000),
            staleTime: 30_000,
            enabled: !!product,
        })),
    });

    const stockPorAlmacen = useMemo(() => {
        const result: Record<string, number> = {};
        if (!product) return result;
        almacenes.forEach((a, idx) => {
            const itms = almacenesStockQueries[idx]?.data?.items || [];
            const match = itms.find((inv) => inv.producto_id === product._id);
            result[a.id!] = match ? match.cantidad : 0;
        });
        return result;
    }, [almacenes, almacenesStockQueries, product]);

    if (!product) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div>
                            <h3 className="font-black text-sm text-gray-900">Seleccionar Almacén de Despacho</h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[240px]">
                                {product.descripcion}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Lista de Almacenes */}
                    <div className="p-3.5 space-y-2">
                        {almacenes.map((a) => {
                            const stockEnAlmacen = stockPorAlmacen[a.id!] ?? 0;
                            const sinStock = stockEnAlmacen <= 0;

                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => {
                                        if (sinStock) return;
                                        onSelectAlmacen(a.id!, a.nombre);
                                    }}
                                    disabled={sinStock}
                                    className={`w-full flex justify-between items-center p-3.5 border rounded-2xl transition-all ${
                                        sinStock
                                            ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                            : 'border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 active:scale-[0.98] cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                                sinStock ? 'bg-gray-100' : 'bg-indigo-100'
                                            }`}
                                        >
                                            <Package
                                                size={18}
                                                className={sinStock ? 'text-gray-400' : 'text-indigo-600'}
                                            />
                                        </div>
                                        <span className="font-bold text-xs text-gray-900 text-left">{a.nombre}</span>
                                    </div>
                                    <span
                                        className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                                            sinStock
                                                ? 'bg-red-100 text-red-600'
                                                : stockEnAlmacen > 10
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {sinStock ? 'Agotado' : `${stockEnAlmacen} u.`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
