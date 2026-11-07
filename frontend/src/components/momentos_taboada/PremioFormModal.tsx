import React, { useState, useEffect } from 'react';
import { X, Award, Save, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';
import { createMomentosTaboadaPremio, updateMomentosTaboadaPremio } from '../../api/api';

interface Props {
    isOpen: boolean;
    premio: PremioMomentosTaboada | null;
    sucursales: Sucursal[];
    onClose: () => void;
    onSuccess: () => void;
}

export const PremioFormModal: React.FC<Props> = ({
    isOpen,
    premio,
    sucursales,
    onClose,
    onSuccess,
}) => {
    const isEdit = !!premio;

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [sellosRequeridos, setSellosRequeridos] = useState<number>(5);
    const [copagoBs, setCopagoBs] = useState<number>(19);
    const [imagenUrl, setImagenUrl] = useState('');
    const [codigo, setCodigo] = useState('');
    const [stockPorSucursal, setStockPorSucursal] = useState<Record<string, number>>({});

    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (premio) {
            setNombre(premio.nombre || '');
            setDescripcion(premio.descripcion || '');
            setSellosRequeridos(premio.sellos_requeridos ?? 5);
            setCopagoBs(premio.copago_bs ?? 0);
            setImagenUrl(premio.imagen_url || '');
            setCodigo(premio.codigo || '');
            setStockPorSucursal(premio.stock_por_sucursal || {});
        } else {
            setNombre('');
            setDescripcion('');
            setSellosRequeridos(5);
            setCopagoBs(19);
            setImagenUrl('');
            setCodigo('');
            // Inicializar stock en 0 para todas las sucursales
            const initialStock: Record<string, number> = {};
            sucursales.forEach(s => {
                const sId = s._id || s.id || '';
                if (sId) initialStock[sId] = 0;
            });
            setStockPorSucursal(initialStock);
        }
        setErrorMsg(null);
    }, [premio, sucursales, isOpen]);

    if (!isOpen) return null;

    const handleStockBranchChange = (branchId: string, val: number) => {
        setStockPorSucursal(prev => ({
            ...prev,
            [branchId]: Math.max(0, val),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            setErrorMsg('El nombre del premio es obligatorio.');
            return;
        }
        if (sellosRequeridos < 1) {
            setErrorMsg('Los sellos requeridos deben ser al menos 1.');
            return;
        }
        if (copagoBs < 0) {
            setErrorMsg('El copago en Bs no puede ser negativo.');
            return;
        }

        try {
            setIsSaving(true);
            setErrorMsg(null);

            if (isEdit && (premio?.id || premio?._id)) {
                const pId = premio.id || premio._id || '';
                await updateMomentosTaboadaPremio(pId, {
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    sellos_requeridos: Number(sellosRequeridos),
                    copago_bs: Number(copagoBs),
                    imagen_url: imagenUrl.trim() || undefined,
                    codigo: codigo.trim() || undefined,
                    stock_por_sucursal: stockPorSucursal,
                });
            } else {
                await createMomentosTaboadaPremio({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    sellos_requeridos: Number(sellosRequeridos),
                    copago_bs: Number(copagoBs),
                    imagen_url: imagenUrl.trim() || undefined,
                    codigo: codigo.trim() || undefined,
                    stock_por_sucursal: stockPorSucursal,
                });
            }

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar el premio';
            setErrorMsg(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-amber-900/10">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2c1d11] to-[#4a2e1b] text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                            <Award className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-serif text-[#fdf8f2]">
                                {isEdit ? 'Editar Premio' : 'Crear Nuevo Premio'}
                            </h3>
                            <p className="text-xs text-amber-200/80">
                                {isEdit ? 'Modifica detalles, sellos, copago e inventario' : 'Añade un nuevo artículo canjeable a Momentos Taboada'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                    {errorMsg && (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Información Básica */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                Nombre del Premio *
                            </label>
                            <input
                                type="text"
                                required
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Ej: Taza Negra Edición Especial"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                Descripción Detallada
                            </label>
                            <textarea
                                rows={2}
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                placeholder="Ej: 1 taza de cerámica negra con logo dorado y acabado mate"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm resize-none"
                            />
                        </div>

                        {/* Requisitos: Sellos y Copago */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Sellos Requeridos *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={sellosRequeridos}
                                        onChange={e => setSellosRequeridos(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm pl-10"
                                    />
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 font-black text-sm">
                                        🏷️
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-500 mt-1 block">
                                    Cantidad de sellos que el cliente debe redimir.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Copago en Bs *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.5"
                                        required
                                        value={copagoBs}
                                        onChange={e => setCopagoBs(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm pl-12"
                                    />
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 font-black text-xs">
                                        Bs.
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-500 mt-1 block">
                                    Monto en efectivo/QR que ingresa al fondo promocional.
                                </span>
                            </div>
                        </div>

                        {/* URL Imagen con Previsualización */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                URL de la Imagen
                            </label>
                            <div className="flex gap-3 items-center">
                                <div className="relative flex-1">
                                    <input
                                        type="url"
                                        value={imagenUrl}
                                        onChange={e => setImagenUrl(e.target.value)}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {imagenUrl ? (
                                        <img
                                            src={imagenUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={e => {
                                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100';
                                            }}
                                        />
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Código Identificador Opcional */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                Código Identificador (Opcional)
                            </label>
                            <input
                                type="text"
                                value={codigo}
                                onChange={e => setCodigo(e.target.value.toUpperCase())}
                                placeholder="Ej: TAZA_NEGRA_2026 (se genera automático si se deja en blanco)"
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                            />
                        </div>
                    </div>

                    {/* Asignación de Inventario / Stock por Sucursal */}
                    <div className="pt-4 border-t border-gray-200">
                        <div className="mb-3">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span>📦</span> Asignación de Inventario por Sucursal
                            </h4>
                            <p className="text-xs text-gray-500">
                                Define la cantidad de unidades físicas disponibles para canje en cada sucursal.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                            {sucursales.map(s => {
                                const sId = s._id || s.id || '';
                                const qty = stockPorSucursal[sId] ?? 0;
                                return (
                                    <div
                                        key={sId}
                                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/60"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <span className="block text-xs font-bold text-gray-900 truncate">
                                                {s.nombre}
                                            </span>
                                            <span className="block text-[10px] text-gray-500 truncate">
                                                {s.ciudad || 'Central'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <input
                                                type="number"
                                                min={0}
                                                value={qty}
                                                onChange={e =>
                                                    handleStockBranchChange(sId, parseInt(e.target.value) || 0)
                                                }
                                                className="w-20 px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-900 font-bold text-center text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                            />
                                            <span className="text-[11px] font-semibold text-gray-500">u.</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Guardando...' : isEdit ? 'Actualizar Premio' : 'Crear Premio'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
