import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import type { Cliente } from '../../api/clientes';
import { checkHomonimoCliente, type CheckHomonimoResponse } from '../../api/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editingCliente: Cliente | null;
    onSubmit: (formData: {
        nombre: string;
        telefono: string;
        email: string;
        nit_ci: string;
        direccion: string;
        notas: string;
    }) => void;
    isPending: boolean;
}

export const ClienteFormModal: React.FC<Props> = ({
    isOpen,
    onClose,
    editingCliente,
    onSubmit,
    isPending,
}) => {
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        nit_ci: '',
        direccion: '',
        notas: '',
    });

    const [homonimoCheck, setHomonimoCheck] = useState<CheckHomonimoResponse | null>(null);
    const [isValidatingHomonimo, setIsValidatingHomonimo] = useState(false);
    const homonimoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingCliente) {
                setFormData({
                    nombre: editingCliente.nombre || '',
                    telefono: editingCliente.telefono || '',
                    email: editingCliente.email || '',
                    nit_ci: editingCliente.nit_ci || '',
                    direccion: editingCliente.direccion || '',
                    notas: editingCliente.notas || '',
                });
            } else {
                setFormData({
                    nombre: '',
                    telefono: '',
                    email: '',
                    nit_ci: '',
                    direccion: '',
                    notas: '',
                });
            }
            setHomonimoCheck(null);
        }
    }, [isOpen, editingCliente]);

    // Validation homonimo effect with debounce
    useEffect(() => {
        if (!isOpen) {
            setHomonimoCheck(null);
            return;
        }

        const nombre = formData.nombre?.trim() || '';
        const nit = formData.nit_ci?.trim() || '';
        const telefono = formData.telefono?.trim() || '';
        const email = formData.email?.trim() || '';

        if (!nombre && !nit && !telefono && !email) {
            setHomonimoCheck(null);
            return;
        }

        if (homonimoTimerRef.current) {
            clearTimeout(homonimoTimerRef.current);
        }

        homonimoTimerRef.current = setTimeout(async () => {
            setIsValidatingHomonimo(true);
            try {
                const res = await checkHomonimoCliente({
                    nombre: nombre.length >= 2 ? nombre : undefined,
                    nit_ci: nit || undefined,
                    telefono: telefono || undefined,
                    email: email || undefined,
                    exclude_id: editingCliente?._id,
                });
                setHomonimoCheck(res);
            } catch (err) {
                console.error('Error comprobando homonimo:', err);
            } finally {
                setIsValidatingHomonimo(false);
            }
        }, 350);

        return () => {
            if (homonimoTimerRef.current) clearTimeout(homonimoTimerRef.current);
        };
    }, [isOpen, formData.nombre, formData.nit_ci, formData.telefono, formData.email, editingCliente?._id]);

    if (!isOpen) return null;

    const hasDuplicateCollision = Boolean(
        homonimoCheck?.duplicado_nit ||
        homonimoCheck?.duplicado_telefono ||
        homonimoCheck?.duplicado_email
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (hasDuplicateCollision) return;
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {editingCliente ? 'Actualiza los datos del comprador' : 'Registra un nuevo contacto'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Nombre o Razón Social <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-2xs font-medium"
                            placeholder="Ej: Juan Pérez o Empresa S.A."
                        />
                        {isValidatingHomonimo && (
                            <p className="text-[11px] text-gray-500 animate-pulse mt-1">Verificando datos y homónimos...</p>
                        )}
                        {homonimoCheck?.es_homonimo && (
                            <div className="mt-2 bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 flex items-start gap-2 shadow-2xs">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <p className="font-bold">Ya existe cliente con este nombre (Homónimo)</p>
                                    <p className="text-amber-800 mt-0.5 leading-relaxed text-[11px]">
                                        El sistema permite nombres repetidos. El NIT/CI, celular y correo deben ser únicos.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NIT & Teléfono */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                NIT / CI
                            </label>
                            <input
                                type="text"
                                value={formData.nit_ci}
                                onChange={(e) => setFormData({ ...formData, nit_ci: e.target.value })}
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-2xs font-mono"
                                placeholder="Documento"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-2xs font-mono"
                                placeholder="Ej: 71234567"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-2xs"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    {/* Collision Alert Banner */}
                    {hasDuplicateCollision && (
                        <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-red-900 space-y-1 text-xs">
                            <p className="font-bold flex items-center gap-1.5 text-red-700">
                                <AlertTriangle size={15} /> Conflicto de datos duplicados:
                            </p>
                            {homonimoCheck?.duplicado_nit && <p className="text-[11px]">• {homonimoCheck.duplicado_nit}</p>}
                            {homonimoCheck?.duplicado_telefono && <p className="text-[11px]">• {homonimoCheck.duplicado_telefono}</p>}
                            {homonimoCheck?.duplicado_email && <p className="text-[11px]">• {homonimoCheck.duplicado_email}</p>}
                        </div>
                    )}

                    {/* Dirección */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Dirección
                        </label>
                        <textarea
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-2xs resize-none"
                            placeholder="Dirección física..."
                            rows={2}
                        />
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Notas Adicionales
                        </label>
                        <textarea
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-2xs resize-none"
                            placeholder="Preferencias, condiciones especiales..."
                            rows={2}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || hasDuplicateCollision}
                            className="flex-1 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : editingCliente ? (
                                'Guardar Cambios'
                            ) : (
                                'Crear Cliente'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
