import React, { useState } from 'react';
import {
    X, Clock, CheckCircle2, RefreshCw, Trash2,
    Calendar, User, Store, Paperclip, ExternalLink
} from 'lucide-react';
import type { Recordatorio, EstadoRecordatorio } from '../../api/types';
import { changeRecordatorioEstado, deleteRecordatorio } from '../../api/api';
import { toast } from 'sonner';

interface Props {
    recordatorio: Recordatorio | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RecordatorioDetailModal: React.FC<Props> = ({
    recordatorio,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showResolveForm, setShowResolveForm] = useState(false);
    const [notasResolucion, setNotasResolucion] = useState('');

    if (!isOpen || !recordatorio) return null;

    const handleStatusChange = async (nuevoEstado: EstadoRecordatorio, notas?: string) => {
        try {
            setIsUpdating(true);
            await changeRecordatorioEstado(recordatorio.id, {
                estado: nuevoEstado,
                notas_resolucion: notas,
            });
            toast.success(`Estado actualizado a ${nuevoEstado.replace('_', ' ')}.`);
            setShowResolveForm(false);
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
            toast.error(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de desactivar este recordatorio?')) return;
        try {
            setIsDeleting(true);
            await deleteRecordatorio(recordatorio.id);
            toast.success('Recordatorio desactivado exitosamente.');
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al eliminar recordatorio';
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'ALTA':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Alta</span>;
            case 'MEDIA':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Media</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Baja</span>;
        }
    };

    const getStatusBadge = (e: string) => {
        switch (e) {
            case 'PENDIENTE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pendiente</span>
                    </span>
                );
            case 'EN_SEGUIMIENTO':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>En seguimiento</span>
                    </span>
                );
            case 'RESUELTO':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resuelto</span>
                    </span>
                );
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{e}</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/60">
                    <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-700">
                                {recordatorio.categoria}
                            </span>
                            {getPriorityBadge(recordatorio.prioridad)}
                            {getStatusBadge(recordatorio.estado)}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 pt-1 leading-snug">
                            {recordatorio.titulo}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-white transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    {/* Metadatos */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs">
                        <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="truncate">
                                Creado por: <b>{recordatorio.creado_por_nombre}</b>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Store className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="truncate">
                                Sucursal: <b>{recordatorio.sucursal_nombre || 'General'}</b>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>
                                Fecha: {new Date(recordatorio.created_at).toLocaleDateString()} {new Date(recordatorio.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {recordatorio.fecha_limite && (
                            <div className="flex items-center gap-2 text-rose-600 font-semibold">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>
                                    Límite: {new Date(recordatorio.fecha_limite).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Descripción / Detalle
                        </h4>
                        <div className="p-4 bg-white rounded-2xl border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {recordatorio.descripcion || <span className="text-gray-400 italic">Sin descripción adicional.</span>}
                        </div>
                    </div>

                    {/* Datos de Resolución si está resuelto */}
                    {recordatorio.estado === 'RESUELTO' && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Resuelto por {recordatorio.resuelto_por_nombre || 'un administrador'}</span>
                                {recordatorio.resuelto_en && (
                                    <span className="text-emerald-600 font-normal">
                                        el {new Date(recordatorio.resuelto_en).toLocaleDateString()} a las {new Date(recordatorio.resuelto_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            {recordatorio.notas_resolucion && (
                                <p className="text-xs text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                                    <b>Notas de solución:</b> {recordatorio.notas_resolucion}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Adjuntos */}
                    {recordatorio.adjuntos && recordatorio.adjuntos.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Archivos Adjuntos ({recordatorio.adjuntos.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {recordatorio.adjuntos.map((adj, idx) => (
                                    <a
                                        key={idx}
                                        href={adj.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all group shadow-2xs"
                                    >
                                        {adj.tipo?.startsWith('image/') ? (
                                            <img
                                                src={adj.url}
                                                alt="Preview"
                                                className="w-10 h-10 rounded-xl object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                                <Paperclip className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="overflow-hidden flex-1">
                                            <p className="text-xs font-bold text-gray-900 truncate">
                                                {adj.nombre_archivo || 'Ver archivo'}
                                            </p>
                                            <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1 group-hover:underline">
                                                Abrir <ExternalLink className="w-2.5 h-2.5" />
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Formulario para Resolver con Notas */}
                    {showResolveForm && (
                        <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in">
                            <h4 className="text-xs font-bold text-purple-900">
                                Confirmar Resolución de Incidencia
                            </h4>
                            <textarea
                                rows={2}
                                value={notasResolucion}
                                onChange={e => setNotasResolucion(e.target.value)}
                                placeholder="Escribe las acciones realizadas o solución aplicada..."
                                className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-gray-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowResolveForm(false)}
                                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-semibold rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange('RESUELTO', notasResolucion)}
                                    disabled={isUpdating}
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                    Confirmar y Resolver
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 px-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting || isUpdating}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Desactivar recordatorio"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Desactivar</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {recordatorio.estado !== 'EN_SEGUIMIENTO' && recordatorio.estado !== 'RESUELTO' && (
                            <button
                                type="button"
                                onClick={() => handleStatusChange('EN_SEGUIMIENTO')}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Iniciar Seguimiento</span>
                            </button>
                        )}

                        {recordatorio.estado !== 'RESUELTO' && (
                            <button
                                type="button"
                                onClick={() => setShowResolveForm(true)}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Marcar como Resuelto</span>
                            </button>
                        )}

                        {recordatorio.estado === 'RESUELTO' && (
                            <button
                                type="button"
                                onClick={() => handleStatusChange('PENDIENTE')}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-white font-bold text-xs transition-colors cursor-pointer"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Reabrir Incidencia</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
