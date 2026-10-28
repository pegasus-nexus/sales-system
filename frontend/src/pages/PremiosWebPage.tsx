import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Gift, Plus, Trash2, Eye, EyeOff, Upload, Loader2, Calendar, 
    Download, ExternalLink, Lock, CheckCircle2, AlertCircle, X, ShieldAlert 
} from 'lucide-react';
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
    start_date?: string;
    end_date?: string;
    created_at?: string;
    is_active: boolean;
    deleted?: boolean;
}

export default function PremiosWebPage() {
    const queryClient = useQueryClient();
    const [createForm, setCreateForm] = useState<Partial<WebReward>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null);

    // Obtener fecha de hoy en formato YYYY-MM-DD para validación de fecha mínima
    const todayStr = new Date().toISOString().split('T')[0];

    // Obtener uso de cada premio (cuántos clientes lo canjearon)
    const { data: usage } = useQuery({
        queryKey: ['premios-uso'],
        queryFn: async () => {
            const res = await client<Record<string, number>>('/comunidad/premios-uso');
            return res;
        }
    });

    // Obtener configuración web
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
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err?.message || "Error al actualizar premios");
        }
    });

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-3 text-indigo-600 font-semibold">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Cargando catálogo de premios...</span>
                </div>
            </div>
        );
    }

    const rewards: WebReward[] = config?.rewards || [];

    // Subir imagen a Cloudinary / almacenamiento
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño máximo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe superar los 5MB");
            return;
        }

        try {
            setIsUploading(true);
            const res = await uploadImage(file);
            setCreateForm(prev => ({ ...prev, img: res.url }));
            toast.success("Foto del premio subida con éxito");
        } catch (error) {
            toast.error("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    // Descargar imagen del premio
    const handleDownloadImage = async (url: string, filename: string) => {
        try {
            toast.info("Iniciando descarga de imagen...");
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${filename.replace(/\s+/g, '_')}_premio.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Descarga completada");
        } catch (err) {
            // Fallback: abrir en nueva pestaña
            window.open(url, '_blank');
        }
    };

    // Abrir modal de creación de premio
    const handleOpenAdd = () => {
        setCreateForm({
            tag: 'Premio',
            validity_days: 14,
            start_date: todayStr,
            end_date: '',
            is_active: true,
            img: ''
        });
        setIsModalOpen(true);
    };

    // Guardar nuevo premio (Creación inmutable)
    const handleSaveNewReward = () => {
        if (!createForm.title?.trim() || !createForm.desc?.trim()) {
            toast.error("Por favor completa el nombre y la descripción del premio");
            return;
        }

        if (!createForm.validity_days || createForm.validity_days <= 0) {
            toast.error("Los días de validez deben ser mayores a 0");
            return;
        }

        // Validación: Fecha de inicio no puede ser anterior a hoy
        const startDate = createForm.start_date || todayStr;
        if (startDate < todayStr) {
            toast.error("La fecha de lanzamiento no puede ser anterior a hoy");
            return;
        }

        // Validación: Fecha de fin debe ser posterior a la de inicio
        if (createForm.end_date && createForm.end_date < startDate) {
            toast.error("La fecha de finalización no puede ser anterior a la de lanzamiento");
            return;
        }

        // Generar ID único inmutable con prefijo y timestamp
        const newRewardId = `premio_${Date.now()}`;

        const newReward: WebReward = {
            id: newRewardId,
            title: createForm.title.trim(),
            tag: createForm.tag?.trim() || 'Premio',
            desc: createForm.desc.trim(),
            img: createForm.img || '/img/placeholder.webp',
            validity: `${createForm.validity_days} días`,
            validity_days: createForm.validity_days,
            start_date: startDate,
            end_date: createForm.end_date || undefined,
            created_at: new Date().toISOString(),
            is_active: createForm.is_active ?? true,
            deleted: false
        };

        const updatedRewards = [...rewards, newReward];
        mutation.mutate({ rewards: updatedRewards });
    };

    // Soft delete: los datos nunca se borran para salvaguardar canjes históricos
    const handleDelete = (reward: WebReward) => {
        const usos = usage?.[reward.id] || 0;
        
        let confirmMsg = `¿Deseas dar de baja el premio "${reward.title}"?`;
        if (usos > 0) {
            confirmMsg = `¡ATENCIÓN! Este premio ha sido canjeado por ${usos} cliente(s).\n\nAl darlo de baja pasará a estado inactivo (soft-delete). Los clientes que ya lo reclamaron lo conservarán intacto en su historial sin verse afectados.\n\n¿Confirmar baja?`;
        }

        if (!confirm(confirmMsg)) return;

        // Se marca como deleted=true e is_active=false. NUNCA se remueve del array.
        const updatedRewards = rewards.map(r => r.id === reward.id ? { ...r, is_active: false, deleted: true } : r);
        mutation.mutate({ rewards: updatedRewards });
        toast.info("Premio archivado (soft-delete)");
    };

    // Alternar visibilidad (Visible en la web vs Oculto)
    const toggleActive = (reward: WebReward) => {
        const nextState = !reward.is_active;
        const updatedRewards = rewards.map(r => r.id === reward.id ? { ...r, is_active: nextState } : r);
        mutation.mutate({ rewards: updatedRewards });
        toast.success(nextState ? `Premio "${reward.title}" visible en la web` : `Premio "${reward.title}" ocultado de la web`);
    };

    // Filtrar premios no eliminados (los soft-deleted permanecen en BD para auditoría y reclamos)
    const activeDisplayRewards = rewards.filter(r => !r.deleted);

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Gift className="text-indigo-600" />
                        Premios y Beneficios Web
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Configura los cupones y beneficios canjeables por los miembros de la comunidad en la web.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenAdd}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                    >
                        <Plus size={18} />
                        Crear Nuevo Premio
                    </button>
                </div>
            </div>

            {/* Banner de Garantía y Buenas Prácticas */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="text-xs leading-relaxed">
                    <span className="font-bold">Política de Integridad y Transparencia: </span>
                    Por protección al consumidor y seguridad de los cupones canjeados, <span className="font-semibold">los premios no son editables</span> una vez emitidos. Si necesitas cambiar condiciones, desactiva el premio actual y crea uno nuevo. Las eliminaciones aplican <span className="font-semibold">soft-delete</span> para preservar el historial de canjes de tus clientes.
                </div>
            </div>

            {/* Tabla de Premios */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="py-4 px-6 font-semibold">Premio / Imagen</th>
                                <th className="py-4 px-6 font-semibold">Descripción y Fechas</th>
                                <th className="py-4 px-6 font-semibold">Validez</th>
                                <th className="py-4 px-6 font-semibold text-center">Canjes</th>
                                <th className="py-4 px-6 font-semibold text-center">Publicación Web</th>
                                <th className="py-4 px-6 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeDisplayRewards.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-400">
                                        <Gift className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="font-semibold text-gray-700">No hay premios configurados</p>
                                        <p className="text-xs text-gray-400 mt-1">Crea el primer beneficio para tus miembros de la comunidad.</p>
                                    </td>
                                </tr>
                            ) : (
                                activeDisplayRewards.map(reward => {
                                    const canjesCount = usage?.[reward.id] || 0;
                                    return (
                                        <tr key={reward.id} className="hover:bg-gray-50/40 transition-colors">
                                            {/* Premio e Imagen */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative group shrink-0">
                                                        <img 
                                                            src={reward.img || '/img/placeholder.webp'} 
                                                            alt={reward.title} 
                                                            className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-200 shadow-xs cursor-pointer group-hover:opacity-80 transition-opacity"
                                                            onClick={() => setPreviewImageModal({ url: reward.img || '/img/placeholder.webp', title: reward.title })}
                                                            onError={(e) => (e.currentTarget.src = '/img/placeholder.webp')}
                                                        />
                                                        <button 
                                                            onClick={() => setPreviewImageModal({ url: reward.img || '/img/placeholder.webp', title: reward.title })}
                                                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                                            title="Ver imagen completa"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-snug">{reward.title}</p>
                                                        <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                                            {reward.tag}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Descripción y Fechas */}
                                            <td className="py-4 px-6 max-w-sm">
                                                <p className="text-gray-600 line-clamp-2 text-xs mb-1.5">{reward.desc}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                    <Calendar size={13} className="text-gray-400 shrink-0" />
                                                    <span>Lanzamiento: <strong className="text-gray-600">{reward.start_date || 'Inmediato'}</strong></span>
                                                    {reward.end_date && (
                                                        <span>• Fin: <strong className="text-amber-700">{reward.end_date}</strong></span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Validez */}
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg font-semibold text-xs border border-amber-200">
                                                    {reward.validity || `${reward.validity_days || 14} días`}
                                                </span>
                                            </td>

                                            {/* Canjes */}
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${canjesCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
                                                    <CheckCircle2 size={13} />
                                                    {canjesCount} {canjesCount === 1 ? 'canje' : 'canjes'}
                                                </span>
                                            </td>

                                            {/* Publicación Web Check/Toggle */}
                                            <td className="py-4 px-6 text-center">
                                                <button 
                                                    onClick={() => toggleActive(reward)} 
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                                        reward.is_active 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                                    }`}
                                                    title={reward.is_active ? "Clic para ocultar de la web" : "Clic para hacer visible en la web"}
                                                >
                                                    {reward.is_active ? (
                                                        <>
                                                            <Eye size={14} className="text-emerald-600" />
                                                            <span>Visible en Web</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff size={14} className="text-gray-400" />
                                                            <span>Oculto</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Descargar Imagen */}
                                                    {reward.img && (
                                                        <button 
                                                            onClick={() => handleDownloadImage(reward.img, reward.title)}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                                                            title="Descargar imagen del premio"
                                                        >
                                                            <Download size={17} />
                                                        </button>
                                                    )}

                                                    {/* Indicador de Inmutabilidad */}
                                                    <span 
                                                        className="p-2 text-gray-300 hover:text-gray-400 cursor-help"
                                                        title="Premio protegido: no se permite editar campos de contenido para evitar discrepancias con clientes que ya lo canjearon."
                                                    >
                                                        <Lock size={17} />
                                                    </span>

                                                    {/* Dar de baja (Soft-delete) */}
                                                    <button 
                                                        onClick={() => handleDelete(reward)} 
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                                        title="Dar de baja / Archivar premio"
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Crear Nuevo Premio */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Gift size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Crear Nuevo Premio Web</h2>
                                    <p className="text-xs text-gray-500">Este premio será canjeable por los miembros en la web</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="p-2 text-gray-400 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-gray-800">
                            {/* Nombre del Premio */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Nombre del Premio <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400" 
                                    value={createForm.title || ''} 
                                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })} 
                                    placeholder="Ej: Caja de Trufas Artesanales de Chocolate" 
                                />
                            </div>

                            {/* Etiqueta y Días de Validez */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Etiqueta / Badge
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400" 
                                        value={createForm.tag || ''} 
                                        onChange={e => setCreateForm({ ...createForm, tag: e.target.value })} 
                                        placeholder="Ej: EXCLUSIVO COMUNIDAD" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Días para Canjear <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="365"
                                            className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                            value={createForm.validity_days || ''} 
                                            onChange={e => setCreateForm({ ...createForm, validity_days: parseInt(e.target.value) || 0 })} 
                                            placeholder="14" 
                                        />
                                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Fechas de Lanzamiento y Finalización */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Fecha de Lanzamiento (Inicio) <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        min={todayStr}
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" 
                                        value={createForm.start_date || todayStr} 
                                        onChange={e => setCreateForm({ ...createForm, start_date: e.target.value })} 
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block">No puede ser anterior a hoy ({todayStr})</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Fecha de Finalización (Opcional)
                                    </label>
                                    <input 
                                        type="date" 
                                        min={createForm.start_date || todayStr}
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" 
                                        value={createForm.end_date || ''} 
                                        onChange={e => setCreateForm({ ...createForm, end_date: e.target.value })} 
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block">Dejar vacío si es permanente</span>
                                </div>
                            </div>

                            {/* Descripción y Condiciones */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Descripción y Condiciones <span className="text-red-500">*</span>
                                </label>
                                <textarea 
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2.5 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400" 
                                    value={createForm.desc || ''} 
                                    onChange={e => setCreateForm({ ...createForm, desc: e.target.value })} 
                                    placeholder="Detalla qué incluye el premio, restricciones y sucursal de retiro..." 
                                />
                            </div>

                            {/* Imagen del Premio */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Imagen del Premio
                                </label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {createForm.img ? (
                                        <div className="relative group shrink-0">
                                            <img 
                                                src={createForm.img} 
                                                alt="Preview" 
                                                className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm" 
                                                onError={(e) => (e.currentTarget.src = '/img/placeholder.webp')}
                                            />
                                            <button 
                                                onClick={() => setCreateForm(prev => ({ ...prev, img: '' }))}
                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                                                title="Eliminar imagen"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                                            <Gift size={24} />
                                        </div>
                                    )}

                                    <div className="flex-1 w-full flex flex-col gap-2">
                                        <label className={`flex items-center justify-center gap-2 h-11 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                            isUploading 
                                                ? 'opacity-50 pointer-events-none border-gray-200 bg-gray-50' 
                                                : 'border-indigo-200 hover:bg-indigo-50/70 hover:border-indigo-400'
                                        }`}>
                                            {isUploading ? <Loader2 size={18} className="text-indigo-600 animate-spin" /> : <Upload size={18} className="text-indigo-600" />}
                                            <span className="text-xs font-bold text-indigo-700">
                                                {isUploading ? 'Subiendo imagen...' : 'Seleccionar foto desde tu equipo'}
                                            </span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                        </label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-gray-400" 
                                            value={createForm.img || ''} 
                                            onChange={e => setCreateForm(prev => ({ ...prev, img: e.target.value }))} 
                                            placeholder="O pega una URL directa (https://...)" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Checkbox: Publicar de inmediato en la web */}
                            <label className="flex items-center gap-3 cursor-pointer bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 hover:bg-gray-100/60 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={createForm.is_active ?? true} 
                                    onChange={e => setCreateForm({ ...createForm, is_active: e.target.checked })} 
                                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer" 
                                />
                                <div className="text-xs">
                                    <span className="font-bold text-gray-900 block">Mostrar inmediatamente en la página web</span>
                                    <span className="text-gray-500">Si está marcado, los miembros de la comunidad lo verán activo para canje.</span>
                                </div>
                            </label>

                            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-start gap-2 text-indigo-900 text-xs">
                                <AlertCircle size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                                <span>
                                    <strong>Recuerda:</strong> Una vez guardado, el premio quedará registrado de forma inmutable para evitar discrepancias con clientes que lo canjeen. Podrás activar/desactivar su visibilidad en cualquier momento.
                                </span>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveNewReward} 
                                disabled={isUploading || mutation.isPending} 
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                <span>{mutation.isPending ? 'Guardando...' : 'Crear Premio'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Previsualización de Imagen Completa */}
            {previewImageModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
                    onClick={() => setPreviewImageModal(null)}
                >
                    <div 
                        className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                            <h3 className="font-bold text-sm truncate">{previewImageModal.title}</h3>
                            <button 
                                onClick={() => setPreviewImageModal(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bg-gray-950 p-4 flex items-center justify-center min-h-[300px]">
                            <img 
                                src={previewImageModal.url} 
                                alt={previewImageModal.title} 
                                className="max-h-[60vh] max-w-full object-contain rounded-lg"
                                onError={(e) => (e.currentTarget.src = '/img/placeholder.webp')}
                            />
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-500 truncate max-w-xs">{previewImageModal.url}</span>
                            <button
                                onClick={() => handleDownloadImage(previewImageModal.url, previewImageModal.title)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Download size={15} /> Descargar Imagen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
