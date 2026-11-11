import React from 'react';
import { Sparkles, Banknote, QrCode, AlertCircle, Gift, ArrowRight } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';

interface Props {
    selectedPremio: PremioMomentosTaboada;
    ticketsDisponibles: number;
    saldoFinalProyectado: number;
    selectedSucursal: string;
    onSelectSucursal: (sucursalId: string) => void;
    sucursales: Sucursal[];
    metodoPago: 'EFECTIVO' | 'QR';
    onSelectMetodoPago: (metodo: 'EFECTIVO' | 'QR') => void;
    notas: string;
    onChangeNotas: (notas: string) => void;
    actionError: string | null;
    isSubmitting: boolean;
    onConfirmarCanje: () => void;
}

export const CanjeLiquidacionSection: React.FC<Props> = ({
    selectedPremio,
    ticketsDisponibles,
    saldoFinalProyectado,
    selectedSucursal,
    onSelectSucursal,
    sucursales,
    metodoPago,
    onSelectMetodoPago,
    notas,
    onChangeNotas,
    actionError,
    isSubmitting,
    onConfirmarCanje,
}) => {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-6 rounded-3xl border-2 border-amber-300 shadow-md space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                <div>
                    <h4 className="text-base font-bold text-amber-950 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <span>Liquidación de Canje y Saldo Final</span>
                    </h4>
                    <p className="text-xs text-amber-800">
                        Verifica la sucursal de entrega, el método de copago y el saldo restante del cliente.
                    </p>
                </div>
                <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-xl text-xs font-black">
                    Premio: {selectedPremio.nombre}
                </span>
            </div>

            {/* Comparador de Saldo Final */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-amber-200 text-center">
                    <span className="text-xs font-semibold text-gray-500 block mb-1">
                        Tickets Disponibles
                    </span>
                    <span className="text-2xl font-black text-gray-900">
                        {ticketsDisponibles}
                    </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 text-center">
                    <span className="text-xs font-semibold text-rose-600 block mb-1">
                        Tickets a Descontar
                    </span>
                    <span className="text-2xl font-black text-rose-700">
                        -{selectedPremio.sellos_requeridos}
                    </span>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300 text-center">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block mb-1">
                        Saldo Final Restante
                    </span>
                    <span className="text-3xl font-black text-emerald-700">
                        {saldoFinalProyectado} tickets
                    </span>
                </div>
            </div>

            {/* Sucursal, Método de Pago y Copago */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Sucursal */}
                <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                        Sucursal de Entrega (Descuento Stock):
                    </label>
                    <select
                        value={selectedSucursal}
                        onChange={e => onSelectSucursal(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    >
                        {sucursales.map(s => {
                            const sId = s._id || s.id || '';
                            return (
                                <option key={sId} value={sId}>
                                    {s.nombre} (Stock: {selectedPremio.stock_por_sucursal[sId] || 0})
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Método de Pago del Copago */}
                <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                        Método Cobro Copago (Bs {selectedPremio.copago_bs.toFixed(2)}):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => onSelectMetodoPago('EFECTIVO')}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                metodoPago === 'EFECTIVO'
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Efectivo</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onSelectMetodoPago('QR')}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                metodoPago === 'QR'
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Pago QR</span>
                        </button>
                    </div>
                </div>

                {/* Notas / Observaciones */}
                <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                        Notas Opcionales:
                    </label>
                    <input
                        type="text"
                        value={notas}
                        onChange={e => onChangeNotas(e.target.value)}
                        placeholder="Ej: Entregado con empaque especial"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-medium"
                    />
                </div>
            </div>

            {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                </div>
            )}

            {/* Botón de Confirmación Definitivo */}
            <div className="pt-2 flex justify-end">
                <button
                    onClick={onConfirmarCanje}
                    disabled={isSubmitting}
                    className="px-8 py-3.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                    <Gift className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>
                        {isSubmitting
                            ? 'Registrando Canje...'
                            : `Confirmar Canje: ${selectedPremio.nombre} (Cobrar Bs ${selectedPremio.copago_bs.toFixed(2)})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
