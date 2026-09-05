import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus, Trash2, Edit2, Save, X, Eye, EyeOff, Upload, Loader2, Calendar } from 'lucide-react';
import { client, uploadImage } from '../api/api';
import { toast } from 'sonner';

interface WebReward {
    id: string;
    title: string;
    tag: string;
    desc: string;
    img: string;
    validity: string;
    validity_days?: number;
    is_active: boolean;
}

export default function PremiosWebPage() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<WebReward>>({});

    
    const { data: usage } = useQuery({
        queryKey: ['premios-uso'],
        queryFn: async () => {
            const res = await client<Record<string, number>>('/comunidad/premios-uso');
            return res;
        }
    });

    const { data: config, isLoading } = useQuery({
        queryKey: ['web-config'],
        queryFn: async () => {
            const res = await client<any>('/web-config');
            return res;
        }
    });

    const mutation = useMutation({
        mutationFn: async (newConfig: any) => {
            return await client('/web-config', {
                method: 'PUT',
                body: newConfig
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['web-config'] });
            toast.success("Premios actualizados correctamente");
            setIsEditing(null);
        },
        onError: () => {
            toast.error("Error al actualizar premios");
        }
    });

    if (isLoading) {
        return <div className="p-6">Cargando...</div>;
    }

    const rewards: WebReward[] = config?.rewards || [];

    
    const handleEditClick = (reward: WebReward) => {
        const usos = usage?.[reward.id] || 0;
        if (usos > 0) {
            const ok = confirm(`¡ATENCIÓN! Este premio ya ha sido canjeado por ${usos} cliente(s).

Si cambias el título, descripción o condiciones, estarás modificando el premio para quienes ya lo tienen, lo que podría perjudicar la experiencia del cliente.

Se recomienda OCULTAR este premio y crear uno nuevo en lugar de editarlo.

¿Estás absolutamente seguro de que quieres editarlo?`);
            if (!ok) return;
        }
        setIsEditing(reward.id);
        
        // Parse validity_days fallback
        let vDays = reward.validity_days;
        if (!vDays) {
            if (reward.validity.toLowerCase().includes('semana')) vDays = 14;
            else if (reward.validity.toLowerCase().includes('mes')) vDays = 30;
            else vDays = 14;
        }
        
        setEditForm({ ...reward, validity_days: vDays });
        setIsModalOpen(true);
    };


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            const res = await uploadImage(file);
            setEditForm({ ...editForm, img: res.url });
            toast.success("Foto del premio subida correctamente");
        } catch (error) {
            toast.error("Error al subir la foto");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveForm = () => {
        if (!editForm.title || !editForm.desc || !editForm.validity_days) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }
        
        let updatedRewards = [...rewards];
        
        if (isEditing) {
            updatedRewards = updatedRewards.map(r => r.id === isEditing ? { ...r, ...editForm, validity: `${editForm.validity_days} días` } as WebReward : r);
        } else {
            const newReward: WebReward = {
                id: `premio_${Date.now()}`,
                title: editForm.title || '',
                tag: editForm.tag || 'Premio',
                desc: editForm.desc || '',
                img: editForm.img || '/img/placeholder.webp',
                validity: `${editForm.validity_days} días`,
                validity_days: editForm.validity_days,
                is_active: editForm.is_active ?? true
            };
            updatedRewards.push(newReward);
        }
        mutation.mutate({ rewards: updatedRewards });
        setIsModalOpen(false);
    };

    const handleOpenAdd = () => {
        setIsEditing(null);
        setEditForm({ validity_days: 14, is_active: true });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        
        const usos = usage?.[id] || 0;
        if (usos > 0) {
            const ok = confirm(`¡CUIDADO! Este premio ya ha sido canjeado por ${usos} cliente(s).

Si lo eliminas, podría desaparecer de sus perfiles o causar errores.
Lo recomendable es simplemente cambiar su estado a 'Oculto'.

¿Estás seguro de ELIMINARLO permanentemente?`);
            if (!ok) return;
        } else {
            if (!confirm('¿Estás seguro de eliminar este premio?')) return;
        }

        const updatedRewards = rewards.filter(r => r.id !== id);
        mutation.mutate({ rewards: updatedRewards });
    };

    const toggleActive = (reward: WebReward) => {
        const updatedRewards = rewards.map(r => r.id === reward.id ? { ...r, is_active: !r.is_active } : r);
        mutation.mutate({ rewards: updatedRewards });
    };

    return (
        <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Gift className="text-indigo-600" />
                        Premios y Beneficios Web
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona los regalos dinámicos que se muestran en la landing page.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                    <Plus size={16} />
                    Nuevo Premio
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                        <tr>
                            <th className="py-4 px-6 font-semibold">Premio</th>
                            <th className="py-4 px-6 font-semibold">Descripción</th>
                            <th className="py-4 px-6 font-semibold">Validez</th>
                            <th className="py-4 px-6 font-semibold">Estado</th>
                            <th className="py-4 px-6 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rewards.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-400">No hay premios configurados.</td>
                            </tr>
                        )}
                        {rewards.map(reward => (
                            <tr key={reward.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                            <img src={reward.img} alt={reward.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                            <div>
                                                <p className="font-bold text-gray-900">{reward.title}</p>
                                                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{reward.tag}</span>
                                            </div>
                                        </div>
                                </td>
                                <td className="py-4 px-6 max-w-xs">
                                    <p className="text-gray-500 line-clamp-2">{reward.desc}</p>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium text-xs border border-amber-100">{reward.validity}</span>
                                </td>
                                <td className="py-4 px-6">
                                    <button onClick={() => toggleActive(reward)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${reward.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {reward.is_active ? <><Eye size={14}/> Visible</> : <><EyeOff size={14}/> Oculto</>}
                                    </button>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEditClick(reward)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(reward.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Editar Premio' : 'Nuevo Premio'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex flex-col gap-4">
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Premio <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Ej: Trufas de Chocolate" />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Etiqueta</label>
                                    <input type="text" className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={editForm.tag || ''} onChange={e => setEditForm({...editForm, tag: e.target.value})} placeholder="Ej: EXCLUSIVO" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Días de Validez <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="number" min="1" className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                            value={editForm.validity_days || ''} onChange={e => setEditForm({...editForm, validity_days: parseInt(e.target.value) || 0})} placeholder="Ej: 14" />
                                        <Calendar size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                                <textarea className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-3 py-2 text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={editForm.desc || ''} onChange={e => setEditForm({...editForm, desc: e.target.value})} placeholder="Condiciones del premio..." />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen del Premio</label>
                                <div className="flex items-center gap-4">
                                    {editForm.img && (
                                        <img src={editForm.img} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                                    )}
                                    <label className={`flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none border-gray-200' : 'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}`}>
                                        {isUploading ? <Loader2 size={24} className="text-indigo-500 animate-spin mb-1" /> : <Upload size={24} className="text-indigo-400 mb-1" />}
                                        <span className="text-xs font-semibold text-gray-600">{isUploading ? 'Subiendo...' : 'Subir a Cloudinary'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <input type="checkbox" checked={editForm.is_active ?? true} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                                <span className="text-sm font-semibold text-gray-800">Premio Activo y Visible</span>
                            </label>

                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button onClick={handleSaveForm} disabled={isUploading || mutation.isPending} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2">
                                <Save size={16} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

