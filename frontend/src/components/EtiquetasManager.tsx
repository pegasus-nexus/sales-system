import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEtiquetas, createEtiqueta, updateEtiqueta } from '../api/api';
import { Plus, Tag, X, Loader2, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_COLORS = [
    { label: 'Gris', value: 'bg-gray-100 text-gray-700 border-gray-200' },
    { label: 'Rojo', value: 'bg-red-100 text-red-700 border-red-200' },
    { label: 'Naranja', value: 'bg-orange-100 text-orange-700 border-orange-200' },
    { label: 'Ambar', value: 'bg-amber-100 text-amber-700 border-amber-200' },
    { label: 'Esmeralda', value: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { label: 'Azul', value: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Indigo', value: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { label: 'Purpura', value: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export default function EtiquetasManager({ onClose }: { onClose: () => void }) {
    const qc = useQueryClient();
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0].value);

    const { data: etiquetas = [], isLoading } = useQuery({
        queryKey: ['etiquetas'],
        queryFn: getEtiquetas,
    });

    const createMut = useMutation({
        mutationFn: createEtiqueta,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['etiquetas'] });
            setNombre('');
            toast.success('Etiqueta creada');
        },
        onError: () => toast.error('Error al crear etiqueta')
    });

    const archiveMut = useMutation({
        mutationFn: (id: string) => updateEtiqueta(id, { is_active: false }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['etiquetas'] });
            toast.success('Etiqueta archivada (oculta)');
        },
        onError: () => toast.error('Error al ocultar etiqueta')
    });

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Tag className="text-indigo-600" size={24} />
                            Etiquetas
                        </h2>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                            Administra las etiquetas de tus pedidos
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 bg-gray-50/50 space-y-6">
                    {/* Formulario de Creación */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Crear Nueva</label>
                        <div className="flex gap-2 mb-3">
                            <input 
                                type="text"
                                placeholder="Ej. Urgente, Revisar..."
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-indigo-50"
                            />
                            <button 
                                onClick={() => createMut.mutate({ nombre, color })}
                                disabled={!nombre.trim() || createMut.isPending}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
                            >
                                {createMut.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setColor(c.value)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${c.value.split(' ')[0]} ${c.value.split(' ')[2]} ${color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'scale-100'}`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Lista de Etiquetas Activas */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 max-h-64 overflow-y-auto">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Activas</label>
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : etiquetas.length === 0 ? (
                            <div className="text-center text-xs text-gray-400 p-4">No hay etiquetas activas.</div>
                        ) : (
                            <div className="space-y-2">
                                {etiquetas.map(eti => (
                                    <div key={eti._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${eti.color}`}>
                                            {eti.nombre}
                                        </div>
                                        <button 
                                            onClick={() => archiveMut.mutate(eti._id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50"
                                            title="Ocultar/Desactivar etiqueta"
                                        >
                                            <ArchiveRestore size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
