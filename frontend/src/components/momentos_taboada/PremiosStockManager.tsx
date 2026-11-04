import React, { useState } from 'react';
import { Award, Package, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';
import { updateMomentosTaboadaStock } from '../../api/api';

interface Props {
    premios: PremioMomentosTaboada[];
    sucursales: Sucursal[];
    onRefresh: () => void;
}

export const PremiosStockManager: React.FC<Props> = ({ premios, sucursales, onRefresh }) => {
    const [selectedSucursal, setSelectedSucursal] = useState<string>(
        sucursales[0]?._id || sucursales[0]?.id || ''
    );
    const [editingStock, setEditingStock] = useState<Record<string, number>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleStockChange = (premioId: string, val: number) => {
        setEditingStock(prev => ({ ...prev, [premioId]: Math.max(0, val) }));
    };

    const handleSaveStock = async (premio: PremioMomentosTaboada) => {
        if (!selectedSucursal) return;
        const pId = premio.id || premio._id || '';
        const nuevo = editingStock[pId] !== undefined 
            ? editingStock[pId] 
            : (premio.stock_por_sucursal[selectedSucursal] || 0);

        try {
            setSavingId(pId);
            setErrorMsg(null);
            await updateMomentosTaboadaStock(pId, selectedSucursal, nuevo);
            setSuccessMsg(`Stock actualizado para ${premio.nombre}`);
            setTimeout(() => setSuccessMsg(null), 3000);
            onRefresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar stock';
            setErrorMsg(msg);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header y Selector de Sucursal */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-600" />
                        Premios Oficiales & Stock por Sucursal
                    </h3>
                    <p className="text-sm text-gray-500">
                        Gestiona las existencias físicas de cada premio de la promoción en las diferentes tiendas.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                        Sucursal Activa:
                    </label>
                    <select
                        value={selectedSucursal}
                        onChange={e => {
                            setSelectedSucursal(e.target.value);
                            setEditingStock({});
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
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
            </div>

            {/* Mensajes de feedback */}
            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Cuadrícula de Premios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {premios.map(premio => {
                    const pId = premio.id || premio._id || '';
                    const stockActual = premio.stock_por_sucursal[selectedSucursal] ?? 0;
                    const stockInputVal = editingStock[pId] !== undefined ? editingStock[pId] : stockActual;
                    const isSaving = savingId === pId;

                    return (
                        <div
                            key={pId}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:border-amber-200 transition-all"
                        >
                            <div className="p-5">
                                {/* Badge de Requisitos */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                                        {premio.sellos_requeridos} Sellos
                                    </span>
                                    <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-extrabold rounded-full border border-rose-200">
                                        + Bs {premio.copago_bs.toFixed(2)}
                                    </span>
                                </div>

                                {/* Imagen */}
                                <div className="w-full h-40 bg-gray-50 rounded-xl flex items-center justify-center mb-4 overflow-hidden border border-gray-100">
                                    {premio.imagen_url ? (
                                        <img
                                            src={premio.imagen_url}
                                            alt={premio.nombre}
                                            className="w-full h-full object-cover"
                                            onError={e => {
                                                // Fallback si la imagen no carga
                                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400';
                                            }}
                                        />
                                    ) : (
                                        <Package className="w-12 h-12 text-gray-300" />
                                    )}
                                </div>

                                <h4 className="font-bold text-gray-900 text-base mb-1">
                                    {premio.nombre}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                                    {premio.descripcion}
                                </p>

                                {/* Indicador de Stock en la sucursal actual */}
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-gray-500 font-medium">Stock en esta tienda:</span>
                                        <span className={`font-bold ${stockActual > 5 ? 'text-emerald-700' : stockActual > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                                            {stockActual > 0 ? `${stockActual} disponibles` : 'AGOTADO'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${stockActual > 5 ? 'bg-emerald-500' : stockActual > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            style={{ width: `${Math.min(100, (stockActual / 20) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Control de edición de stock */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                                        Ajustar Unidades:
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={stockInputVal}
                                        onChange={e => handleStockChange(pId, parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 bg-white text-center focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSaveStock(premio)}
                                    disabled={isSaving || stockInputVal === stockActual}
                                    className={`px-3 py-2 mt-4 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                                        stockInputVal === stockActual
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                                    }`}
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSaving ? '...' : 'Fijar'}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
