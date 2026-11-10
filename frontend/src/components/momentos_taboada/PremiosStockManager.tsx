import React, { useState } from 'react';
import {
    Award,
    Package,
    Save,
    CheckCircle2,
    AlertCircle,
    Plus,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronUp,
    PackagePlus,
    ArrowLeftRight,
    History,
} from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';
import { updateMomentosTaboadaStock, deleteMomentosTaboadaPremio } from '../../api/api';
import { PremioFormModal } from './PremioFormModal';
import { SurtirStockModal } from './SurtirStockModal';
import { TrasladarStockModal } from './TrasladarStockModal';
import { MovimientosStockTable } from './MovimientosStockTable';

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

    // Modales
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedPremioToEdit, setSelectedPremioToEdit] = useState<PremioMomentosTaboada | null>(null);
    const [surtirPremio, setSurtirPremio] = useState<PremioMomentosTaboada | null>(null);
    const [trasladarPremio, setTrasladarPremio] = useState<PremioMomentosTaboada | null>(null);
    const [showMovimientos, setShowMovimientos] = useState<boolean>(false);

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
            {/* Header, Selector de Sucursal y Botones */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-600" />
                        Gestión de Premios & Logística de Surtido
                    </h3>
                    <p className="text-xs text-gray-500">
                        Crea premios, surte existencias desde fábrica y traslada premios entre tiendas con auditoría.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setShowMovimientos(!showMovimientos)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            showMovimientos
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        <span>{showMovimientos ? 'Ocultar Auditoría' : 'Auditoría Surtidos'}</span>
                    </button>

                    <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Crear Premio</span>
                    </button>

                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
                            Tienda Activa:
                        </label>
                        <select
                            value={selectedSucursal}
                            onChange={e => {
                                setSelectedSucursal(e.target.value);
                                setEditingStock({});
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
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
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Auditoría de Surtidos y Traslados (Collapsible) */}
            {showMovimientos && (
                <MovimientosStockTable sucursalId={selectedSucursal} />
            )}

            {/* Cuadrícula de Premios Oficiales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {premios.map(premio => {
                    const pId = premio.id || premio._id || '';
                    const stockActual = premio.stock_por_sucursal[selectedSucursal] ?? 0;
                    const stockInputVal = editingStock[pId] !== undefined ? editingStock[pId] : stockActual;
                    const isSaving = savingId === pId;
                    const isExpanded = expandedPremioId === pId;

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
                                {/* Barra Superior con Badges y Acciones */}
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
                                            title="Editar información y requisitos"
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
                                <div className="w-full h-40 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 overflow-hidden border border-gray-100 group-hover:border-amber-200 transition-colors">
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

                                <div className="mb-1">
                                    <h4 className="font-bold text-gray-900 text-base leading-snug">
                                        {premio.nombre}
                                    </h4>
                                    <span className="text-[10px] font-mono font-semibold text-gray-400 block">
                                        CÓDIGO: {premio.codigo}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500 line-clamp-2 mb-3 min-h-[30px]">
                                    {premio.descripcion || 'Sin descripción adicional.'}
                                </p>

                                {/* Semáforo de Existencias por Tienda */}
                                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 mb-3">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-gray-600 font-medium">Estado en tienda activa:</span>
                                        <span
                                            className={`font-black text-xs px-2 py-0.5 rounded-md ${
                                                stockActual > 3
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : stockActual > 0
                                                    ? 'bg-amber-100 text-amber-900 animate-pulse'
                                                    : 'bg-rose-100 text-rose-800 font-black'
                                            }`}
                                        >
                                            {stockActual > 3
                                                ? `🟢 ${stockActual} u. (Óptimo)`
                                                : stockActual > 0
                                                ? `🟡 ${stockActual} u. (Crítico)`
                                                : '🔴 Agotado'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 pt-1 border-t border-amber-100/60">
                                        <span>Total Empresa:</span>
                                        <span className="font-bold text-gray-700">{stockTotalEmpresa} unidades</span>
                                    </div>
                                </div>

                                {/* Acciones de Logística: Surtir & Trasladar */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button
                                        onClick={() => setSurtirPremio(premio)}
                                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                                    >
                                        <PackagePlus className="w-3.5 h-3.5" />
                                        <span>+ Surtir</span>
                                    </button>

                                    <button
                                        onClick={() => setTrasladarPremio(premio)}
                                        className="py-1.5 px-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                                    >
                                        <ArrowLeftRight className="w-3.5 h-3.5" />
                                        <span>⇄ Trasladar</span>
                                    </button>
                                </div>

                                {/* Desglose de Stock por Sucursal */}
                                <button
                                    onClick={() => setExpandedPremioId(isExpanded ? null : pId)}
                                    className="w-full py-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <span>{isExpanded ? 'Ocultar sucursales' : 'Ver stock en todas las sucursales'}</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>

                                {isExpanded && (
                                    <div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 max-h-36 overflow-y-auto text-xs">
                                        {sucursales.map(s => {
                                            const sId = s._id || s.id || '';
                                            const branchQty = premio.stock_por_sucursal[sId] ?? 0;
                                            return (
                                                <div key={sId} className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-700 truncate">{s.nombre}</span>
                                                    <span
                                                        className={`font-bold ${
                                                            branchQty > 3
                                                                ? 'text-gray-900'
                                                                : branchQty > 0
                                                                ? 'text-amber-700'
                                                                : 'text-rose-600'
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

                            {/* Control manual de ajuste de stock */}
                            <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                                        Fijar Stock Directo:
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={stockInputVal}
                                        onChange={e => handleStockChange(pId, parseInt(e.target.value) || 0)}
                                        className="w-full px-2.5 py-1 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-white text-center focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSaveStock(premio)}
                                    disabled={isSaving || stockInputVal === stockActual}
                                    className={`px-3 py-1.5 mt-3.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-sm ${
                                        stockInputVal === stockActual
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-amber-700 hover:bg-amber-800 text-white'
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

            {/* Modal de Surtir Stock (+X) */}
            <SurtirStockModal
                isOpen={surtirPremio !== null}
                premio={surtirPremio}
                sucursales={sucursales}
                defaultSucursalId={selectedSucursal}
                onClose={() => setSurtirPremio(null)}
                onSuccess={() => {
                    setSuccessMsg('Stock surtido con éxito.');
                    setTimeout(() => setSuccessMsg(null), 3000);
                    onRefresh();
                }}
            />

            {/* Modal de Trasladar Stock */}
            <TrasladarStockModal
                isOpen={trasladarPremio !== null}
                premio={trasladarPremio}
                sucursales={sucursales}
                defaultOrigenId={selectedSucursal}
                onClose={() => setTrasladarPremio(null)}
                onSuccess={() => {
                    setSuccessMsg('Traslado de stock completado exitosamente.');
                    setTimeout(() => setSuccessMsg(null), 3000);
                    onRefresh();
                }}
            />
        </div>
    );
};
export default PremiosStockManager;
