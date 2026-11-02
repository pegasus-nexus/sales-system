import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, DollarSign, QrCode, CreditCard, Lock, Plus, 
    CheckCircle2, Loader2, ArrowLeft 
} from 'lucide-react';
import type { MetodoPago, PagoEntry, ClienteData } from '../../store/usePosStore';

interface POSPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    subtotal: number;
    descuentoValor: number;
    descuentoLabel?: string;
    totalCubierto: number;
    restante: number;
    cambio: number;
    pagos: PagoEntry[];
    pendingPago: { metodo: MetodoPago; monto: string };
    setPendingPago: (p: { metodo?: MetodoPago; monto?: string }) => void;
    onAddPago: () => void;
    onRemovePago: (index: number) => void;
    cliente: ClienteData;
    canFinalize: boolean;
    isSubmitting: boolean;
    onFinalize: () => void;
}

const fmt = (n?: number) => (n || 0).toFixed(2);

const METODO_META: Record<MetodoPago, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    EFECTIVO: { label: 'Efectivo', icon: <DollarSign size={16} />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
    QR: { label: 'QR Simple', icon: <QrCode size={16} />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' },
    TARJETA: { label: 'Tarjeta', icon: <CreditCard size={16} />, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-300' },
    CREDITO: { label: 'A Crédito', icon: <Lock size={16} />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' },
};

const BOLIVIAN_BILLS = [10, 20, 50, 100, 200];

export function POSPaymentModal({
    isOpen,
    onClose,
    total,
    subtotal,
    descuentoValor,
    descuentoLabel,
    totalCubierto,
    restante,
    cambio,
    pagos,
    pendingPago,
    setPendingPago,
    onAddPago,
    onRemovePago,
    cliente,
    canFinalize,
    isSubmitting,
    onFinalize
}: POSPaymentModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus amount input when modal opens or method changes
    useEffect(() => {
        if (isOpen) {
            // Default pending amount to restante if empty
            if (!pendingPago.monto && restante > 0) {
                setPendingPago({ monto: restante.toString() });
            }
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, pendingPago.metodo]);

    if (!isOpen) return null;

    const ticketCovered = totalCubierto >= total && total > 0;
    const isCreditoWithoutClient = pendingPago.metodo === 'CREDITO' && (!cliente.razon_social || !cliente.telefono);

    const handleBillPreset = (amount: number) => {
        setPendingPago({ monto: amount.toString() });
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleExactPreset = () => {
        if (restante > 0) {
            setPendingPago({ monto: restante.toFixed(2) });
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                title="Volver al ticket"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Cobro y Pago de Venta</h3>
                                <p className="text-xs text-gray-500">Selecciona el método de pago y calcula el cambio exacto.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Main 2-column layout */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {/* Columna Izquierda: Métodos de Pago y Presets (7 cols) */}
                        <div className="md:col-span-7 p-6 space-y-5">
                            {/* Método de pago tabs */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                    Método de Pago
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(['EFECTIVO', 'QR', 'TARJETA', 'CREDITO'] as MetodoPago[]).map((m) => {
                                        const meta = METODO_META[m];
                                        const active = pendingPago.metodo === m;
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setPendingPago({ metodo: m })}
                                                disabled={ticketCovered}
                                                className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                                    active
                                                        ? `${meta.bg} ${meta.color} border-current shadow-sm scale-102`
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {meta.icon}
                                                <span>{meta.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Billetes bolivianos rápidos (solo para efectivo) */}
                            {pendingPago.metodo === 'EFECTIVO' && !ticketCovered && (
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                        Billetes Bolivianos (Bs.)
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {BOLIVIAN_BILLS.map((bill) => (
                                            <button
                                                key={bill}
                                                type="button"
                                                onClick={() => handleBillPreset(bill)}
                                                className="py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 border border-gray-200 font-black text-xs text-gray-800 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                            >
                                                {bill} Bs
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleExactPreset}
                                            className="py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
                                            title="Pagar monto exacto"
                                        >
                                            Exacto
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Input de monto */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                    Monto a Recibir (Bs.)
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">Bs.</span>
                                        <input
                                            ref={inputRef}
                                            id="pos-modal-payment-input"
                                            type="number"
                                            step="0.10"
                                            min="0.10"
                                            value={pendingPago.monto}
                                            onChange={(e) => setPendingPago({ monto: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && onAddPago()}
                                            disabled={ticketCovered}
                                            placeholder="0.00"
                                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-2xl text-base font-black text-gray-900 bg-white font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-40 disabled:bg-gray-50 transition-all shadow-inner"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onAddPago}
                                        disabled={!pendingPago.monto || parseFloat(pendingPago.monto) <= 0 || ticketCovered || isCreditoWithoutClient}
                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                                    >
                                        <Plus size={15} /> Agregar Pago
                                    </button>
                                </div>
                            </div>

                            {/* Advertencia de Crédito */}
                            {isCreditoWithoutClient && (
                                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
                                    <p className="font-bold">Requiere datos de cliente:</p>
                                    <p className="text-[11px] mt-0.5">Para ventas a crédito debes registrar el <strong>Nombre/Razón Social</strong> y <strong>Celular</strong> del deudor para el seguimiento.</p>
                                </div>
                            )}

                            {/* Lista de pagos ingresados */}
                            {pagos.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                        Pagos Registrados en este Ticket
                                    </label>
                                    <div className="space-y-1.5">
                                        {pagos.map((p, idx) => {
                                            const meta = METODO_META[p.metodo];
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center justify-between rounded-xl border px-3 py-2 ${meta.bg}`}
                                                >
                                                    <div className={`flex items-center gap-2 text-xs font-bold ${meta.color}`}>
                                                        {meta.icon}
                                                        <span>{meta.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-mono text-sm font-black ${meta.color}`}>
                                                            Bs. {fmt(p.monto)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => onRemovePago(idx)}
                                                            className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                                            title="Eliminar pago"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Columna Derecha: Resumen de Totales y Vuelto Gigante (5 cols) */}
                        <div className="md:col-span-5 p-6 bg-gray-50/70 flex flex-col justify-between">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Resumen de Venta
                                </h4>

                                {/* Breakdown */}
                                <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
                                    {descuentoValor > 0 && (
                                        <>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Subtotal:</span>
                                                <span className="font-mono font-bold">Bs. {fmt(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-red-500 border-b border-gray-100 pb-2">
                                                <span>Descuento {descuentoLabel ? `(${descuentoLabel})` : ''}:</span>
                                                <span className="font-mono font-bold">- Bs. {fmt(descuentoValor)}</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-between items-baseline pt-1">
                                        <span className="text-xs font-bold text-gray-600">Total a Pagar:</span>
                                        <span className="text-2xl font-black text-gray-900 font-mono">
                                            Bs. {fmt(total)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                                        <span>Total Pagado:</span>
                                        <span className="font-mono font-bold text-emerald-600">
                                            Bs. {fmt(totalCubierto)}
                                        </span>
                                    </div>

                                    {restante > 0 && (
                                        <div className="flex justify-between text-xs text-red-600 pt-1">
                                            <span className="font-bold">Falta Pagar:</span>
                                            <span className="font-mono font-black">
                                                Bs. {fmt(restante)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* VUELTO GIGANTE (iZi POS / Odoo style) */}
                                {cambio > 0 ? (
                                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center shadow-sm">
                                        <span className="text-xs font-black text-amber-800 uppercase tracking-widest block mb-1">
                                            Cambio / Vuelto a Entregar
                                        </span>
                                        <div className="text-3xl font-black text-amber-600 font-mono">
                                            Bs. {fmt(cambio)}
                                        </div>
                                    </div>
                                ) : ticketCovered ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                                        <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                                            <CheckCircle2 size={16} /> Pago Exacto Cubierto
                                        </span>
                                    </div>
                                ) : null}

                                {cliente.razon_social && (
                                    <div className="text-[11px] text-gray-500 bg-white rounded-xl p-2.5 border border-gray-100 truncate">
                                        <span className="font-bold text-gray-700">Cliente: </span>
                                        {cliente.razon_social} {cliente.nit ? `(NIT: ${cliente.nit})` : ''}
                                    </div>
                                )}
                            </div>

                            {/* Botones de Finalización */}
                            <div className="pt-6 space-y-2">
                                <button
                                    type="button"
                                    onClick={onFinalize}
                                    disabled={!canFinalize || isSubmitting}
                                    className={`w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                                        canFinalize && !isSubmitting
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 cursor-pointer'
                                            : 'bg-gray-300 shadow-none cursor-not-allowed'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            <span>Cobrar e Imprimir (F4)</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-2.5 rounded-xl text-gray-500 hover:text-gray-800 text-xs font-bold transition-colors cursor-pointer text-center"
                                >
                                    Seguir Agregando Productos
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
