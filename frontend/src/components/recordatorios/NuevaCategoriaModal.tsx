import React, { useState } from 'react';
import { X, Tag, Plus, Loader2 } from 'lucide-react';
import { createRecordatorioCategoria } from '../../api/api';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (nuevaCategoria: string) => void;
}

export const NuevaCategoriaModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [nombre, setNombre] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const limpio = nombre.trim();
        if (!limpio) {
            setErrorMsg('Ingresa un nombre para la categoría.');
            return;
        }

        try {
            setIsSaving(true);
            setErrorMsg(null);
            const res = await createRecordatorioCategoria({ nombre: limpio });
            toast.success(`Categoría "${res.nombre}" creada con éxito.`);
            setNombre('');
            onSuccess(res.nombre);
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al crear la categoría';
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                            <Tag className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Nueva Categoría</h3>
                            <p className="text-xs text-gray-500">Agrega un área para clasificar incidencias</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                            Nombre de la Categoría
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            placeholder="Ej. Logística, Mantenimiento, Limpieza..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Crear Categoría</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
