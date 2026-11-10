import React, { useState } from 'react';
import { PackagePlus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';
import { surtirMomentosTaboadaStock } from '../../api/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    premio: PremioMomentosTaboada | null;
    sucursales: Sucursal[];
    defaultSucursalId?: string;
    onSuccess: () => void;
}

export const SurtirStockModal: React.FC<Props> = ({
    isOpen,
    onClose,
    premio,
    sucursales,
    defaultSucursalId,
    onSuccess,
}) => {
    const [sucursalId, setSucursalId] = useState<string>(
        defaultSucursalId || sucursales[0]?._id || sucursales[0]?.id || ''
    );
    const [cantidad, setCantidad] = useState<number>(10);
    const [motivo, setMotivo] = useState<string>('Lote de fábrica / Reposición regular');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen || !premio) return null;

    const pId = premio.id || premio._id || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cantidad <= 0) {
            setErrorMsg('La cantidad a surtir debe ser al menos 1 unidad');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMsg(null);
            await surtirMomentosTaboadaStock(pId, sucursalId, cantidad, motivo.trim());
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al surtir stock';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const stockActual = premio.stock_por_sucursal[sucursalId] ?? 0;
    const nuevoStockProyectado = stockActual + (cantidad > 0 ? cantidad : 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2c1d11] to-[#4a2e1b] p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-300">
                            <PackagePlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[#fdf8f2]">
                                Surtir / Reabastecer Stock
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

                    {/* Sucursal Destino */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Sucursal a Surtir:
                        </label>
                        <select
                            value={sucursalId}
                            onChange={e => setSucursalId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        >
                            {sucursales.map(s => {
                                const sId = s._id || s.id || '';
                                return (
                                    <option key={sId} value={sId}>
                                        {s.nombre} ({s.ciudad}) — Stock actual: {premio.stock_por_sucursal[sId] || 0}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Cantidad a Surtir */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Cantidad de Unidades a Inyectar:
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={cantidad}
                            onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-black text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        />
                    </div>

                    {/* Comparador de Stock */}
                    <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 grid grid-cols-2 gap-2 text-center text-xs">
                        <div>
                            <span className="text-gray-500 block">Stock Actual</span>
                            <span className="text-base font-black text-gray-800">{stockActual} unid</span>
                        </div>
                        <div className="border-l border-amber-200 pl-2">
                            <span className="text-emerald-700 font-bold block">Nuevo Stock</span>
                            <span className="text-base font-black text-emerald-800">{nuevoStockProyectado} unid</span>
                        </div>
                    </div>

                    {/* Motivo / Lote */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                            Motivo o Referencia de Auditoría:
                        </label>
                        <input
                            type="text"
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder="Ej: Lote #4 de cerámica, reposición de fábrica..."
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
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? 'Surtir...' : 'Confirmar Surtido'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default SurtirStockModal;
