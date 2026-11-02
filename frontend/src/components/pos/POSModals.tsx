import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TicketPrinter } from '../TicketPrinter';
import type { Sale } from '../../api/types';

interface POSModalsProps {
    showDuplicateWarning: boolean;
    onCancelDuplicate: () => void;
    onConfirmDuplicate: () => void;
    lastSale: Sale | null;
    onPrint: () => void;
    onNextSale: () => void;
    tenantName?: string;
    sucursalName?: string;
    ticketFooter?: string;
    logoBase64?: string;
    direccion?: string;
    telefono?: string;
}

const fmt = (n?: number) => (n || 0).toFixed(2);

export function POSModals({
    showDuplicateWarning,
    onCancelDuplicate,
    onConfirmDuplicate,
    lastSale,
    onPrint,
    onNextSale,
    tenantName,
    sucursalName,
    ticketFooter,
    logoBase64,
    direccion,
    telefono,
}: POSModalsProps) {
    return (
        <>
            {/* Advertencia de Venta Idéntica Consecutiva */}
            <AnimatePresence>
                {showDuplicateWarning && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-200"
                        >
                            <div className="flex items-center gap-3 text-amber-600 mb-3">
                                <AlertTriangle size={24} />
                                <h3 className="text-base font-bold text-gray-900">¿Venta idéntica consecutiva?</h3>
                            </div>
                            <p className="text-xs text-gray-600 mb-4">
                                Acabas de registrar una venta con los mismos productos hace unos instantes.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onCancelDuplicate}
                                    className="flex-1 py-2 rounded-xl font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirmDuplicate}
                                    className="flex-1 py-2 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer"
                                >
                                    Sí, es otra venta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Impresión / Venta Exitosa */}
            <AnimatePresence>
                {lastSale && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 print:hidden">
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center"
                        >
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle2 size={28} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-1">¡Venta Registrada!</h3>
                            <p className="text-xs text-gray-500 mb-5">El cobro ha ingresado a caja correctamente.</p>

                            <div className="w-full bg-gray-50 rounded-2xl p-3.5 mb-5 border border-gray-100 text-left space-y-1.5">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Total:</span>
                                    <span className="font-mono font-bold text-gray-900">
                                        Bs. {fmt(lastSale.total)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Pagado:</span>
                                    <span className="font-mono font-bold text-emerald-600">
                                        Bs. {fmt(lastSale.pagos.reduce((a, b) => a + b.monto, 0))}
                                    </span>
                                </div>
                                {(() => {
                                    const totalPagado = lastSale.pagos.reduce((acc, p) => acc + p.monto, 0);
                                    const cambioEntregado = totalPagado - lastSale.total;
                                    if (cambioEntregado > 0.01) {
                                        return (
                                            <div className="flex justify-between text-xs font-bold text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                                                <span>Cambio entregado:</span>
                                                <span className="font-mono">Bs. {fmt(cambioEntregado)}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <div className="w-full space-y-2">
                                <button
                                    type="button"
                                    onClick={onPrint}
                                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gray-900 hover:bg-black transition-colors cursor-pointer"
                                >
                                    Imprimir {lastSale.cliente?.es_factura ? 'Factura/NIT' : 'Recibo'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onNextSale}
                                    className="w-full py-2 rounded-xl font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Siguiente Venta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hidden thermal print wrapper */}
            <div className="print-only">
                {lastSale && (
                    <TicketPrinter
                        sale={lastSale}
                        tenantName={tenantName || 'Mi Tienda'}
                        sucursalName={sucursalName}
                        ticketFooter={ticketFooter}
                        logoBase64={logoBase64}
                        direccion={direccion}
                        telefono={telefono}
                    />
                )}
            </div>
        </>
    );
}
