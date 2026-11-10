import React, { useState } from 'react';
import { MinusCircle, X, CheckCircle2, AlertCircle, Banknote, QrCode } from 'lucide-react';
import type { Sucursal } from '../../api/types';
import { registrarEgresoMomentosTaboadaCajaChica } from '../../api/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    sucursales: Sucursal[];
    defaultSucursalId?: string;
    onSuccess: () => void;
}

export const RegistrarEgresoCajaModal: React.FC<Props> = ({
    isOpen,
    onClose,
    sucursales,
    defaultSucursalId,
    onSuccess,
}) => {
    const [sucursalId, setSucursalId] = useState<string>(
        defaultSucursalId || sucursales[0]?._id || sucursales[0]?.id || ''
    );
    const [monto, setMonto] = useState<number>(100);
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
    const [descripcion, setDescripcion] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (monto <= 0) {
            setErrorMsg('El monto del egreso debe ser mayor a Bs 0.00');
            return;
        }
        if (!descripcion.trim()) {
            setErrorMsg('Debes ingresar una descripción o motivo del gasto');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMsg(null);
            await registrarEgresoMomentosTaboadaCajaChica({
                sucursal_id: sucursalId,
                monto,
                metodo_pago: metodoPago,
                descripcion: descripcion.trim(),
            });
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar egreso';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-stone-900 to-rose-950 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-300">
                            <MinusCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[#fdf8f2]">
                                Registrar Gasto / Salida de Fondo
                            </h3>
                            <p className="text-xs text-rose-200/80">
                                Caja Chica Promocional (Insumos o Tazas)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Sucursal */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Sucursal / Fondo:
                        </label>
                        <select
                            value={sucursalId}
                            onChange={e => setSucursalId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                        >
                            {sucursales.map(s => {
                                const sId = s._id || s.id || '';
                                return (
                                    <option key={sId} value={sId}>
                                        {s.nombre} ({s.ciudad})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Monto en Bs */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Monto a Egresar (Bs):
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.5"
                            value={monto}
                            onChange={e => setMonto(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-base font-black text-rose-700 bg-white outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                        />
                    </div>

                    {/* Método de Pago */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Medio de Pago Utilizado:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setMetodoPago('EFECTIVO')}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    metodoPago === 'EFECTIVO'
                                        ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-600'
                                }`}
                            >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Efectivo</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMetodoPago('QR')}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    metodoPago === 'QR'
                                        ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-600'
                                }`}
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Pago QR</span>
                            </button>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Concepto / Detalle del Gasto:
                        </label>
                        <input
                            type="text"
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Ej: Pago de 50 cajas para empaque de tazas, flete..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-rose-500 shadow-sm font-medium"
                        />
                    </div>

                    {/* Botones */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? 'Registrando...' : 'Registrar Salida'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegistrarEgresoCajaModal;
