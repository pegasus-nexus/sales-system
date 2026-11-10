import React, { useState } from 'react';
import { X, Paperclip, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type {
    PrioridadRecordatorio,
    EstadoRecordatorio,
    AdjuntoRecordatorio,
    Sucursal,
} from '../../api/types';
import { createRecordatorio, uploadImage } from '../../api/api';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    categorias: string[];
    onOpenNuevaCategoria: () => void;
    onSuccess: () => void;
    sucursales: Sucursal[];
    currentSucursalId?: string;
}

export const RecordatorioDrawer: React.FC<Props> = ({
    isOpen,
    onClose,
    categorias,
    onOpenNuevaCategoria,
    onSuccess,
    sucursales,
    currentSucursalId,
}) => {
    const [titulo, setTitulo] = useState('');
    const [categoria, setCategoria] = useState(categorias[0] || 'Caja');
    const [descripcion, setDescripcion] = useState('');
    const [prioridad, setPrioridad] = useState<PrioridadRecordatorio>('MEDIA');
    const [estado, setEstado] = useState<EstadoRecordatorio>('PENDIENTE');
    const [sucursalId, setSucursalId] = useState<string>(currentSucursalId || '');
    const [fechaLimite, setFechaLimite] = useState<string>('');

    // Adjuntos
    const [adjuntos, setAdjuntos] = useState<AdjuntoRecordatorio[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            setUploadError('El archivo no debe superar los 8MB.');
            return;
        }

        try {
            setIsUploading(true);
            setUploadError(null);
            const res = await uploadImage(file);
            if (res && res.url) {
                setAdjuntos(prev => [
                    ...prev,
                    {
                        url: res.url,
                        nombre_archivo: file.name,
                        tipo: file.type || 'image/jpeg',
                    },
                ]);
                toast.success('Archivo adjuntado correctamente.');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al subir el archivo a la nube';
            setUploadError(msg);
            toast.error(msg);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveAdjunto = (index: number) => {
        setAdjuntos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const limpioTitulo = titulo.trim();
        if (!limpioTitulo) {
            setErrorMsg('El título del recordatorio es obligatorio.');
            return;
        }

        const sucursalSeleccionada = sucursales.find(s => s._id === sucursalId);

        try {
            setIsSaving(true);
            setErrorMsg(null);

            await createRecordatorio({
                titulo: limpioTitulo,
                categoria: categoria || 'General',
                descripcion: descripcion.trim() || undefined,
                prioridad,
                estado,
                sucursal_id: sucursalId || undefined,
                sucursal_nombre: sucursalSeleccionada?.nombre || undefined,
                fecha_limite: fechaLimite ? new Date(fechaLimite).toISOString() : undefined,
                adjuntos,
            });

            toast.success('Recordatorio creado exitosamente.');
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar el recordatorio';
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-gray-200 animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Nuevo recordatorio</h2>
                        <p className="text-xs text-gray-500">Control de actividades e incidencias</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form id="recordatorio-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Título */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            required
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            placeholder="Escribe un título..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-gray-700">
                                Categoría
                            </label>
                            <button
                                type="button"
                                onClick={onOpenNuevaCategoria}
                                className="text-xs text-purple-600 hover:text-purple-800 font-bold hover:underline cursor-pointer"
                            >
                                + Nueva categoría
                            </button>
                        </div>
                        <select
                            value={categoria}
                            onChange={e => setCategoria(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm cursor-pointer"
                        >
                            {categorias.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sucursal (Opcional) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Sucursal asignada
                        </label>
                        <select
                            value={sucursalId}
                            onChange={e => setSucursalId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm cursor-pointer"
                        >
                            <option value="">Todas / Empresa General</option>
                            {sucursales.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            rows={3}
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Escribe una descripción..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm resize-none"
                        />
                    </div>

                    {/* Prioridad (Segmented Control estilo píldora) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Prioridad
                        </label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl border border-gray-200">
                            {(['BAJA', 'MEDIA', 'ALTA'] as PrioridadRecordatorio[]).map(p => {
                                const isSelected = prioridad === p;
                                const label = p === 'BAJA' ? 'Baja' : p === 'MEDIA' ? 'Media' : 'Alta';
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPrioridad(p)}
                                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            isSelected
                                                ? p === 'ALTA'
                                                    ? 'bg-rose-500 text-white shadow-xs'
                                                    : p === 'MEDIA'
                                                    ? 'bg-amber-500 text-white shadow-xs'
                                                    : 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Estado inicial
                        </label>
                        <select
                            value={estado}
                            onChange={e => setEstado(e.target.value as EstadoRecordatorio)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm cursor-pointer"
                        >
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="EN_SEGUIMIENTO">En seguimiento</option>
                            <option value="RESUELTO">Resuelto</option>
                        </select>
                    </div>

                    {/* Fecha Límite (Opcional) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Fecha Límite (Opcional)
                        </label>
                        <input
                            type="datetime-local"
                            value={fechaLimite}
                            onChange={e => setFechaLimite(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    {/* Adjuntos / Evidencia */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Evidencia / Adjuntos
                        </label>

                        {/* Botón de subida estilo Dropzone */}
                        <label className="w-full border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-purple-50/30">
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                                    <span className="text-xs font-semibold text-purple-600">Subiendo a la nube...</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                        <Paperclip className="w-4 h-4 text-purple-600" />
                                        <span>Adjuntar captura o documento</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        Capturas de error, fotos de inventario o comprobantes (JPG, PNG, PDF máx. 8MB)
                                    </p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*, application/pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>

                        {uploadError && (
                            <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{uploadError}</span>
                            </p>
                        )}

                        {/* Lista de adjuntos cargados */}
                        {adjuntos.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {adjuntos.map((adj, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2.5 bg-purple-50/60 border border-purple-100 rounded-xl text-xs"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            {adj.tipo?.startsWith('image/') ? (
                                                <img
                                                    src={adj.url}
                                                    alt="Thumbnail"
                                                    className="w-8 h-8 rounded-lg object-cover border border-purple-200 shrink-0"
                                                />
                                            ) : (
                                                <Paperclip className="w-4 h-4 text-purple-600 shrink-0" />
                                            )}
                                            <span className="font-semibold text-gray-800 truncate">
                                                {adj.nombre_archivo || 'Archivo adjunto'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAdjunto(idx)}
                                            className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                            title="Quitar archivo"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-white transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="recordatorio-drawer-form"
                        disabled={isSaving || isUploading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Guardar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
