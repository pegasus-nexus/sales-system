import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus, Trash2, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { client } from '../api/api';
import { toast } from 'sonner';

interface WebReward {
    id: string;
    title: string;
    tag: string;
    desc: string;
    img: string;
    validity: string;
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
        setEditForm(reward);
    };

    const handleSave = () => {
        const updatedRewards = rewards.map(r => r.id === isEditing ? { ...r, ...editForm } : r);
        mutation.mutate({ rewards: updatedRewards });
    };

    const handleAdd = () => {
        const newReward: WebReward = {
            id: `premio_${Date.now()}`,
            title: 'Nuevo Premio',
            tag: 'Etiqueta',
            desc: 'DescripciÃ³n del premio...',
            img: '/img/placeholder.webp',
            validity: '1 Mes',
            is_active: true
        };
        mutation.mutate({ rewards: [...rewards, newReward] });
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
                    <p className="text-sm text-gray-500 mt-1">Gestiona los regalos dinÃ¡micos que se muestran en la landing page.</p>
                </div>
                <button
                    onClick={handleAdd}
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
                            <th className="py-4 px-6 font-semibold">DescripciÃ³n</th>
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
                                    {isEditing === reward.id ? (
                                        <div className="flex flex-col gap-2">
                                            <input 
                                                className="border border-gray-200 rounded px-2 py-1 text-sm font-bold"
                                                value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="TÃ­tulo" />
                                            <input 
                                                className="border border-gray-200 rounded px-2 py-1 text-xs"
                                                value={editForm.tag} onChange={e => setEditForm({...editForm, tag: e.target.value})} placeholder="Etiqueta (ej: Regalo VIP)" />
                                            <input 
                                                className="border border-gray-200 rounded px-2 py-1 text-xs text-blue-500"
                                                value={editForm.img} onChange={e => setEditForm({...editForm, img: e.target.value})} placeholder="URL Imagen" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <img src={reward.img} alt={reward.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                            <div>
                                                <p className="font-bold text-gray-900">{reward.title}</p>
                                                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{reward.tag}</span>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-6 max-w-xs">
                                    {isEditing === reward.id ? (
                                        <textarea 
                                            className="border border-gray-200 rounded px-2 py-1 text-sm w-full h-20 resize-none"
                                            value={editForm.desc} onChange={e => setEditForm({...editForm, desc: e.target.value})} placeholder="DescripciÃ³n del premio" />
                                    ) : (
                                        <p className="text-gray-500 line-clamp-2">{reward.desc}</p>
                                    )}
                                </td>
                                <td className="py-4 px-6">
                                    {isEditing === reward.id ? (
                                        <input 
                                            className="border border-gray-200 rounded px-2 py-1 text-sm w-24"
                                            value={editForm.validity} onChange={e => setEditForm({...editForm, validity: e.target.value})} placeholder="Validez" />
                                    ) : (
                                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium text-xs border border-amber-100">{reward.validity}</span>
                                    )}
                                </td>
                                <td className="py-4 px-6">
                                    <button onClick={() => toggleActive(reward)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${reward.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {reward.is_active ? <><Eye size={14}/> Visible</> : <><EyeOff size={14}/> Oculto</>}
                                    </button>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex justify-end gap-2">
                                        {isEditing === reward.id ? (
                                            <>
                                                <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"><Save size={18} /></button>
                                                <button onClick={() => setIsEditing(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><X size={18} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEditClick(reward)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDelete(reward.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

