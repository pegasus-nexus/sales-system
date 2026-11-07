import React, { useState } from 'react';
import { Award, Package, Save, CheckCircle2, AlertCircle, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';
import { updateMomentosTaboadaStock, deleteMomentosTaboadaPremio } from '../../api/api';
import { PremioFormModal } from './PremioFormModal';

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

    // Estado del modal de crear / editar premio
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPremioToEdit, setSelectedPremioToEdit] = useState<PremioMomentosTaboada | null>(null);

    // Expandir detalle de stock por todas las sucursales
    const [expandedPremioId, setExpandedPremioId] = useState<string | null>(null);

    const handleOpenCreateModal = () => {
        setSelectedPremioToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (premio: PremioMomentosTaboada) => {
        setSelectedPremioToEdit(premio);
        setIsModalOpen(true);
    };

    const handleDeletePremio = async (premio: PremioMomentosTaboada) => {
        const pId = premio.id || premio._id || '';
        if (!pId) return;

        const confirmacion = window.confirm(
            `¿Estás seguro de desactivar el premio "${premio.nombre}"?\nNo se eliminarán registros históricos de canjes pasados.`
        );
        if (!confirmacion) return;

        try {
            setErrorMsg(null);
            await deleteMomentosTaboadaPremio(pId);
            setSuccessMsg(`Premio "${premio.nombre}" desactivado exitosamente.`);
            setTimeout(() => setSuccessMsg(null), 3000);
            onRefresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al desactivar el premio';
            setErrorMsg(msg);
        }
    };

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
            {/* Header, Selector de Sucursal y Botón Nuevo Premio */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-600" />
                        Premios Oficiales & Stock por Sucursal
                    </h3>
                    <p className="text-sm text-gray-500">
                        Crea premios, edita requisitos y gestiona existencias físicas en cada sucursal.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Crear Premio</span>
                    </button>

                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
                            Sucursal:
                        </label>
                        <select
                            value={selectedSucursal}
                            onChange={e => {
                                setSelectedSucursal(e.target.value);
                                setEditingStock({});
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {premios.map(premio => {
                    const pId = premio.id || premio._id || '';
                    const stockActual = premio.stock_por_sucursal[selectedSucursal] ?? 0;
                    const stockInputVal = editingStock[pId] !== undefined ? editingStock[pId] : stockActual;
                    const isSaving = savingId === pId;
                    const isExpanded = expandedPremioId === pId;

                    // Calcular stock total acumulado de todas las sucursales
                    const stockTotalEmpresa = Object.values(premio.stock_por_sucursal || {}).reduce(
                        (a, b) => a + (Number(b) || 0),
                        0
                    );

                    return (
                        <div
                            key={pId}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all group relative"
                        >
                            <div className="p-5">
                                {/* Barra Superior de la Tarjeta con Badges y Acciones */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-black rounded-lg border border-amber-200">
                                            {premio.sellos_requeridos} Sellos
                                        </span>
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-lg border border-emerald-200">
                                            + Bs {premio.copago_bs.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Botones de Edición y Eliminación */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEditModal(premio)}
                                            title="Editar información y requisitos del premio"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePremio(premio)}
                                            title="Desactivar premio"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Imagen */}
                                <div className="w-full h-44 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border border-gray-100 group-hover:border-amber-200 transition-colors">
                                    {premio.imagen_url ? (
                                        <img
                                            src={premio.imagen_url}
                                            alt={premio.nombre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={e => {
                                                (e.currentTarget as HTMLImageElement).src =
                                                    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400';
                                            }}
                                        />
                                    ) : (
                                        <Package className="w-12 h-12 text-gray-300" />
                                    )}
                                </div>

                                <div className="mb-2">
                                    <h4 className="font-bold text-gray-900 text-base leading-snug">
                                        {premio.nombre}
                                    </h4>
                                    <span className="text-[10px] font-mono font-semibold text-gray-400 block mt-0.5">
                                        CÓDIGO: {premio.codigo}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500 line-clamp-2 mb-4 min-h-[32px]">
                                    {premio.descripcion || 'Sin descripción adicional.'}
                                </p>

                                {/* Indicador de Stock en la sucursal actual */}
                                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 mb-3">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-gray-600 font-medium">Stock en tienda activa:</span>
                                        <span
                                            className={`font-black ${
                                                stockActual > 5
                                                    ? 'text-emerald-700'
                                                    : stockActual > 0
                                                    ? 'text-amber-700'
                                                    : 'text-rose-700'
                                            }`}
                                        >
                                            {stockActual > 0 ? `${stockActual} disponibles` : 'AGOTADO'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                stockActual > 5
                                                    ? 'bg-emerald-500'
                                                    : stockActual > 0
                                                    ? 'bg-amber-500'
                                                    : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${Math.min(100, (stockActual / 20) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1.5 pt-1 border-t border-amber-100/60">
                                        <span>Total Empresa:</span>
                                        <span className="font-bold text-gray-700">{stockTotalEmpresa} unidades</span>
                                    </div>
                                </div>

                                {/* Botón para desglosar stock de todas las sucursales */}
                                <button
                                    onClick={() => setExpandedPremioId(isExpanded ? null : pId)}
                                    className="w-full py-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <span>{isExpanded ? 'Ocultar sucursales' : 'Ver stock en todas las sucursales'}</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>

                                {isExpanded && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 max-h-36 overflow-y-auto text-xs">
                                        {sucursales.map(s => {
                                            const sId = s._id || s.id || '';
                                            const branchQty = premio.stock_por_sucursal[sId] ?? 0;
                                            return (
                                                <div key={sId} className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-700 truncate">{s.nombre}</span>
                                                    <span
                                                        className={`font-bold ${
                                                            branchQty > 0 ? 'text-gray-900' : 'text-rose-600'
                                                        }`}
                                                    >
                                                        {branchQty} u.
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Control rápido de edición de stock */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                        Fijar Stock Tienda:
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={stockInputVal}
                                        onChange={e => handleStockChange(pId, parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 bg-white text-center focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSaveStock(premio)}
                                    disabled={isSaving || stockInputVal === stockActual}
                                    className={`px-4 py-2 mt-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                                        stockInputVal === stockActual
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
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

            {/* Modal de Crear / Editar Premio */}
            <PremioFormModal
                isOpen={isModalOpen}
                premio={selectedPremioToEdit}
                sucursales={sucursales}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedPremioToEdit(null);
                }}
                onSuccess={() => {
                    setSuccessMsg(
                        selectedPremioToEdit
                            ? 'Premio actualizado exitosamente.'
                            : 'Nuevo premio creado exitosamente.'
                    );
                    setTimeout(() => setSuccessMsg(null), 3000);
                    onRefresh();
                }}
            />
        </div>
    );
};
