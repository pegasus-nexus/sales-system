import React, { useState } from 'react';
import { ArrowLeftRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';
import { trasladarMomentosTaboadaStock } from '../../api/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    premio: PremioMomentosTaboada | null;
    sucursales: Sucursal[];
    defaultOrigenId?: string;
    onSuccess: () => void;
}

export const TrasladarStockModal: React.FC<Props> = ({
    isOpen,
    onClose,
    premio,
    sucursales,
    defaultOrigenId,
    onSuccess,
}) => {
    const [origenId, setOrigenId] = useState<string>(
        defaultOrigenId || sucursales[0]?._id || sucursales[0]?.id || ''
    );
    const [destinoId, setDestinoId] = useState<string>(
        sucursales[1]?._id || sucursales[1]?.id || sucursales[0]?._id || ''
    );
    const [cantidad, setCantidad] = useState<number>(5);
    const [motivo, setMotivo] = useState<string>('Equilibrio de stock entre sucursales');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen || !premio) return null;

    const pId = premio.id || premio._id || '';
    const stockOrigen = premio.stock_por_sucursal[origenId] ?? 0;
    const stockDestino = premio.stock_por_sucursal[destinoId] ?? 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (origenId === destinoId) {
            setErrorMsg('La sucursal de origen y destino deben ser distintas');
            return;
        }
        if (cantidad <= 0) {
            setErrorMsg('La cantidad a trasladar debe ser mayor a 0');
            return;
        }
        if (cantidad > stockOrigen) {
            setErrorMsg(`Stock insuficiente en origen. Solo hay ${stockOrigen} unidades disponibles.`);
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMsg(null);
            await trasladarMomentosTaboadaStock(pId, origenId, destinoId, cantidad, motivo.trim());
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al realizar el traslado';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2c1d11] to-[#4a2e1b] p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-300">
                            <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[#fdf8f2]">
                                Trasladar Premios entre Tiendas
                            </h3>
                            <p className="text-xs text-amber-200/80">
                                {premio.nombre}
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

                    {/* Sucursal Origen */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Sucursal Origen (De donde sale el stock):
                        </label>
                        <select
                            value={origenId}
                            onChange={e => setOrigenId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        >
                            {sucursales.map(s => {
                                const sId = s._id || s.id || '';
                                return (
                                    <option key={sId} value={sId}>
                                        {s.nombre} ({s.ciudad}) — Disponible: {premio.stock_por_sucursal[sId] || 0}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Sucursal Destino */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Sucursal Destino (Donde entra el stock):
                        </label>
                        <select
                            value={destinoId}
                            onChange={e => setDestinoId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        >
                            {sucursales
                                .filter(s => (s._id || s.id) !== origenId)
                                .map(s => {
                                    const sId = s._id || s.id || '';
                                    return (
                                        <option key={sId} value={sId}>
                                            {s.nombre} ({s.ciudad}) — Actual: {premio.stock_por_sucursal[sId] || 0}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>

                    {/* Cantidad a Mover */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-700">
                                Cantidad a Trasladar:
                            </label>
                            <span className="text-[11px] text-gray-500">
                                Máximo disponible: <b>{stockOrigen}</b>
                            </span>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max={stockOrigen}
                            value={cantidad}
                            onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-black text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        />
                    </div>

                    {/* Proyección del Movimiento */}
                    <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 grid grid-cols-2 gap-2 text-center text-xs">
                        <div>
                            <span className="text-gray-500 block">Quedará en Origen</span>
                            <span className="text-sm font-black text-rose-700">
                                {Math.max(0, stockOrigen - cantidad)} unid
                            </span>
                        </div>
                        <div className="border-l border-amber-200 pl-2">
                            <span className="text-emerald-700 font-bold block">Nuevo en Destino</span>
                            <span className="text-sm font-black text-emerald-800">
                                {stockDestino + (cantidad > 0 ? cantidad : 0)} unid
                            </span>
                        </div>
                    </div>

                    {/* Motivo */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Motivo del Traslado:
                        </label>
                        <input
                            type="text"
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder="Ej: Reposición por alta demanda en El Prado..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-medium"
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
                            disabled={isSubmitting || stockOrigen <= 0}
                            className="px-5 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? 'Moviendo...' : 'Confirmar Traslado'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default TrasladarStockModal;
