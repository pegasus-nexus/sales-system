import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, CreditCard, Search, User, CheckCircle2,
    Send, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getCuentasCredito, getDeudasPorCuenta, registrarAbonosMultiple } from '../../api/api';

interface POSSettleDueModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialClientNit?: string;
    initialClientName?: string;
    onPaymentSuccess?: () => void;
}

interface CuentaItem {
    id: string;
    cliente_id: string;
    cliente_nombre: string;
    cliente_nit: string;
    cliente_telefono?: string;
    saldo_total: number;
    limite_credito?: number;
    estado_cuenta: 'AL_DIA' | 'MOROSO';
}

interface DeudaItem {
    id: string;
    sale_id: string;
    sale_id_corto: string;
    numero_ticket: string;
    resumen_items: string;
    monto_original: number;
    saldo_pendiente: number;
    fecha_emision: string;
    estado: string;
}

type MetodoPago = 'EFECTIVO' | 'QR' | 'TARJETA' | 'TRANSFERENCIA';

export default function POSSettleDueModal({
    isOpen,
    onClose,
    initialClientNit,
    initialClientName,
    onPaymentSuccess,
}: POSSettleDueModalProps) {
    const [searchQuery, setSearchQuery] = useState(initialClientNit || initialClientName || '');
    const [searching, setSearching] = useState(false);
    const [cuentasResults, setCuentasResults] = useState<CuentaItem[]>([]);
    const [selectedCuenta, setSelectedCuenta] = useState<CuentaItem | null>(null);

    // Deudas
    const [loadingDeudas, setLoadingDeudas] = useState(false);
    const [deudas, setDeudas] = useState<DeudaItem[]>([]);
    const [selectedDeudaId, setSelectedDeudaId] = useState<string | undefined>(undefined);

    // Formulario de Cobro
    const [montoAbono, setMontoAbono] = useState<string>('');
    const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
    const [notas, setNotas] = useState<string>('Cobro de crédito en POS');
    const [submitting, setSubmitting] = useState(false);

    // Estado de éxito
    const [successData, setSuccessData] = useState<{
        nuevoSaldo: number;
        montoCobrado: number;
        clienteNombre: string;
        clienteTelefono?: string;
    } | null>(null);

    // Búsqueda inicial automática si viene cliente precargado
    useEffect(() => {
        if (isOpen) {
            const query = initialClientNit || initialClientName || '';
            setSearchQuery(query);
            setSuccessData(null);
            setSelectedCuenta(null);
            setDeudas([]);
            setMontoAbono('');
            if (query.trim().length >= 2) {
                buscarCuentas(query);
            }
        }
    }, [isOpen, initialClientNit, initialClientName]);

    const buscarCuentas = async (q: string) => {
        if (!q.trim()) return;
        setSearching(true);
        try {
            const res = (await getCuentasCredito(q, undefined, 1, 10)) as { items: CuentaItem[] };
            setCuentasResults(res?.items || []);
            if (res?.items?.length === 1 && !selectedCuenta) {
                handleSelectCuenta(res.items[0]);
            }
        } catch {
            toast.error('Error al buscar cuentas de crédito');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectCuenta = async (cuenta: CuentaItem) => {
        setSelectedCuenta(cuenta);
        setMontoAbono(String(cuenta.saldo_total));
        setLoadingDeudas(true);
        try {
            const res = (await getDeudasPorCuenta(cuenta.id, 'PENDIENTE')) as DeudaItem[];
            setDeudas(res || []);
        } catch {
            toast.error('Error al cargar deudas pendientes del cliente');
        } finally {
            setLoadingDeudas(false);
        }
    };

    const handleQuickAmount = (type: 'TOTAL' | 'HALF' | 20 | 50 | 100 | 200) => {
        if (!selectedCuenta) return;
        const saldo = selectedCuenta.saldo_total;
        if (type === 'TOTAL') {
            setMontoAbono(String(saldo));
        } else if (type === 'HALF') {
            setMontoAbono((saldo / 2).toFixed(2));
        } else {
            const val = Math.min(type, saldo);
            setMontoAbono(String(val));
        }
    };

    const handleRegistrarCobro = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCuenta) {
            toast.error('Selecciona un cliente para abonar');
            return;
        }
        const montoNum = parseFloat(montoAbono);
        if (isNaN(montoNum) || montoNum <= 0) {
            toast.error('Ingresa un monto válido mayor a 0');
            return;
        }
        if (montoNum > selectedCuenta.saldo_total) {
            toast.warning('El monto ingresado es mayor al saldo pendiente total');
        }

        setSubmitting(true);
        try {
            const payload = {
                pagos: [{ metodo: metodoPago, monto: montoNum }],
                deuda_id: selectedDeudaId || undefined,
                notas: notas.trim() || 'Cobro de crédito en POS',
            };
            const res = (await registrarAbonosMultiple(selectedCuenta.id, payload)) as {
                nuevo_saldo: number;
            };

            setSuccessData({
                nuevoSaldo: res.nuevo_saldo,
                montoCobrado: montoNum,
                clienteNombre: selectedCuenta.cliente_nombre,
                clienteTelefono: selectedCuenta.cliente_telefono,
            });

            toast.success('¡Cobro de crédito registrado y asentado en caja exitosamente!');
            onPaymentSuccess?.();
        } catch (err: unknown) {
            const errorMsg =
                err && typeof err === 'object' && 'message' in err
                    ? String(err.message)
                    : 'Error al procesar el abono. Verifica que tengas caja abierta.';
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendWhatsAppReceipt = () => {
        if (!successData?.clienteTelefono) {
            toast.error('El cliente no tiene teléfono registrado');
            return;
        }
        const phone = successData.clienteTelefono.replace(/\D/g, '');
        const text = encodeURIComponent(
            `Hola ${successData.clienteNombre}, confirmamos tu pago de crédito por Bs. ${successData.montoCobrado.toFixed(2)}. Tu saldo restante actual es de Bs. ${successData.nuevoSaldo.toFixed(2)}. ¡Gracias por tu preferencia!`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 select-none">
                {/* Backdrop con desenfoque */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#080b12]/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-gray-900"
                >
                    {/* Header estilo Odoo Enterprise */}
                    <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    Saldar Deuda / Cobrar Crédito
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        POS Settle Due
                                    </span>
                                </h3>
                                <p className="text-xs text-indigo-200/80">
                                    Registra abonos de clientes directamente en la caja de tu turno actual
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Contenido Principal */}
                    <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                        {!successData ? (
                            <>
                                {/* Buscador de Cliente si no hay ninguno seleccionado */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                                        <Search size={14} className="text-indigo-600" />
                                        <span>Buscar Cliente con Cuenta de Crédito</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && buscarCuentas(searchQuery)}
                                                placeholder="Escribe nombre, NIT o teléfono y presiona Enter..."
                                                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 text-gray-900 bg-white text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors shadow-2xs font-medium"
                                            />
                                            {searching && (
                                                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => buscarCuentas(searchQuery)}
                                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                                        >
                                            Buscar
                                        </button>
                                    </div>

                                    {/* Resultados de búsqueda rápida */}
                                    {cuentasResults.length > 0 && !selectedCuenta && (
                                        <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 max-h-48 overflow-y-auto bg-gray-50/50">
                                            {cuentasResults.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => handleSelectCuenta(c)}
                                                    className="w-full p-3 text-left hover:bg-indigo-50/80 transition-colors flex items-center justify-between cursor-pointer group"
                                                >
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-700">
                                                            {c.cliente_nombre}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500">
                                                            NIT/CI: {c.cliente_nit || 'S/N'} • Tel: {c.cliente_telefono || 'S/T'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-black text-rose-600 block">
                                                            Debe: Bs. {c.saldo_total.toFixed(2)}
                                                        </span>
                                                        <span className="text-[10px] text-indigo-600 font-bold group-hover:underline">
                                                            Seleccionar →
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Tarjeta del Cliente Seleccionado */}
                                {selectedCuenta && (
                                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-black text-gray-900">
                                                        {selectedCuenta.cliente_nombre}
                                                    </h4>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                                        selectedCuenta.estado_cuenta === 'MOROSO'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {selectedCuenta.estado_cuenta}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    NIT/CI: <b>{selectedCuenta.cliente_nit || 'S/N'}</b> • Teléfono: <b>{selectedCuenta.cliente_telefono || 'No registrado'}</b>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right sm:border-l sm:border-indigo-200 sm:pl-4 shrink-0">
                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">
                                                Saldo Pendiente Total
                                            </span>
                                            <span className="text-lg font-black text-rose-600">
                                                Bs. {selectedCuenta.saldo_total.toFixed(2)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCuenta(null);
                                                    setDeudas([]);
                                                }}
                                                className="text-[11px] text-gray-500 hover:text-rose-600 underline block mt-0.5"
                                            >
                                                Cambiar cliente
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de Deudas Pendientes (Opcional) */}
                                {selectedCuenta && deudas.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <span>Deudas asociadas ({deudas.length})</span>
                                                {loadingDeudas && <Loader2 size={12} className="animate-spin text-indigo-600" />}
                                            </span>
                                            <span className="text-[11px] font-normal text-gray-500 lowercase">
                                                (amortización FIFO automática)
                                            </span>
                                        </div>
                                        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-36 overflow-y-auto text-xs bg-gray-50/30">
                                            {deudas.map((d) => (
                                                <div
                                                    key={d.id}
                                                    onClick={() => setSelectedDeudaId(selectedDeudaId === d.id ? undefined : d.id)}
                                                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                                        selectedDeudaId === d.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-100/60'
                                                    }`}
                                                >
                                                    <div>
                                                        <span className="font-bold text-indigo-700">Ticket #{d.sale_id_corto}</span>
                                                        <span className="text-gray-400 mx-1.5">•</span>
                                                        <span className="text-gray-600 truncate max-w-[200px] inline-block align-bottom">{d.resumen_items}</span>
                                                    </div>
                                                    <div className="text-right font-medium">
                                                        <span className="text-gray-900 font-bold">Bs. {d.saldo_pendiente.toFixed(2)}</span>
                                                        <span className="text-[10px] text-gray-400 block">orig: Bs. {d.monto_original.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Formulario de Cobro */}
                                {selectedCuenta && (
                                    <form onSubmit={handleRegistrarCobro} className="space-y-4 pt-2">
                                        {/* Monto a Cobrar */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                                    Monto a Cobrar (Bs.) *
                                                </label>
                                                {/* Atajos Rápidos */}
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickAmount('TOTAL')}
                                                        className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-black transition-colors"
                                                    >
                                                        Total
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickAmount('HALF')}
                                                        className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-[10px] font-bold transition-colors"
                                                    >
                                                        50%
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickAmount(50)}
                                                        className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-[10px] font-bold transition-colors"
                                                    >
                                                        Bs. 50
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickAmount(100)}
                                                        className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-[10px] font-bold transition-colors"
                                                    >
                                                        Bs. 100
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">
                                                    Bs.
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={montoAbono}
                                                    onChange={(e) => setMontoAbono(e.target.value)}
                                                    placeholder="0.00"
                                                    autoFocus
                                                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-indigo-600/60 text-gray-900 bg-white text-2xl font-black font-mono focus:outline-hidden focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        {/* Método de Pago */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                                                Método de Pago Recibido en Caja
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {(['EFECTIVO', 'QR', 'TARJETA', 'TRANSFERENCIA'] as MetodoPago[]).map((metodo) => (
                                                    <button
                                                        key={metodo}
                                                        type="button"
                                                        onClick={() => setMetodoPago(metodo)}
                                                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                            metodoPago === metodo
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {metodo === 'EFECTIVO' && '💵 Efectivo'}
                                                        {metodo === 'QR' && '📱 Pago QR'}
                                                        {metodo === 'TARJETA' && '💳 Tarjeta'}
                                                        {metodo === 'TRANSFERENCIA' && '🏦 Transfer.'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notas / Referencia */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-600 block">
                                                Nota o Referencia (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={notas}
                                                onChange={(e) => setNotas(e.target.value)}
                                                placeholder="Ej. Cobro en efectivo en POS sucursal"
                                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 bg-white text-xs focus:border-indigo-600 transition-colors"
                                            />
                                        </div>

                                        {/* Botón de Confirmación */}
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={18} />
                                                    <span>Registrar Cobro de Bs. {parseFloat(montoAbono || '0').toFixed(2)} en Caja</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </>
                        ) : (
                            /* Vista de Éxito / Recibo */
                            <div className="py-6 flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                    <CheckCircle2 size={36} />
                                </div>

                                <div>
                                    <h4 className="text-xl font-black text-gray-900">
                                        ¡Cobro Registrado con Éxito!
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        El pago ha sido amortizado y asentado automáticamente en el arqueo de tu caja.
                                    </p>
                                </div>

                                <div className="w-full max-w-sm p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                                        <span className="text-gray-500">Cliente:</span>
                                        <span className="font-bold text-gray-900">{successData.clienteNombre}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                                        <span className="text-gray-500">Monto Cobrado:</span>
                                        <span className="font-black text-emerald-600">Bs. {successData.montoCobrado.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                                        <span className="text-gray-500">Método de Pago:</span>
                                        <span className="font-bold text-gray-800">{metodoPago}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-gray-500">Saldo Restante:</span>
                                        <span className="font-black text-rose-600">Bs. {successData.nuevoSaldo.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
                                    {successData.clienteTelefono && (
                                        <button
                                            type="button"
                                            onClick={handleSendWhatsAppReceipt}
                                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Send size={14} />
                                            <span>Enviar WhatsApp</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <span>Volver al POS</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer informativo */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
                        <span>💡 Odoo Settle Due Pattern • Amortización directa en arqueo</span>
                        <span className="font-mono text-gray-500">Pegasus POS Engine</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
