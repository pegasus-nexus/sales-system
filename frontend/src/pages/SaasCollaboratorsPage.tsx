import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Mail, Lock, User as UserIcon, Shield, Copy, Check, Edit2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getSaasStaff, createSaasStaff, updateSaasStaff, deleteSaasStaff } from '../api/api';
import { useConfirm } from '../components/ConfirmModal';
import { useErrorModal } from '../components/ErrorModal';

export default function SaasCollaboratorsPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const { showError } = useErrorModal();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [editingStaff, setEditingStaff] = useState<{ id: string; full_name: string; email: string; password?: string } | null>(null);
    const [createdCredentials, setCreatedCredentials] = useState<{ username: string; email: string; password: string; full_name: string } | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: ''
    });

    const { data: staff = [], isLoading } = useQuery({
        queryKey: ['saas-staff'],
        queryFn: getSaasStaff
    });

    const createMutation = useMutation({
        mutationFn: createSaasStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saas-staff'] });
            toast.success('Colaborador creado exitosamente');
            setCreatedCredentials({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name
            });
            setIsCreateModalOpen(false);
            setFormData({ username: '', email: '', full_name: '', password: '' });
        },
        onError: (error: any) => {
            showError(error.message || 'Error al crear colaborador');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateSaasStaff(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saas-staff'] });
            toast.success('Colaborador actualizado exitosamente');
            setEditingStaff(null);
        },
        onError: (error: any) => {
            showError(error.message || 'Error al actualizar colaborador');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSaasStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saas-staff'] });
            toast.success('Colaborador eliminado');
        },
        onError: (error: any) => {
            showError(error.message || 'Error al eliminar colaborador');
        }
    });

    const handleDelete = async (id: string, name: string) => {
        if (await confirm({
            title: 'Eliminar Colaborador',
            message: `¿Estás seguro de que deseas eliminar al colaborador "${name}"? Perderá acceso inmediato al panel de administración SaaS.`,
            confirmLabel: 'Sí, Eliminar',
            cancelLabel: 'Cancelar',
            type: 'danger'
        })) {
            deleteMutation.mutate(id);
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-black" />
                        Equipo SaaS
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona los colaboradores con acceso a la administración del sistema.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Colaborador
                </button>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="p-5 font-bold text-gray-900">Nombre</th>
                                <th className="p-5 font-bold text-gray-900">Usuario</th>
                                <th className="p-5 font-bold text-gray-900">Email</th>
                                <th className="p-5 font-bold text-gray-900 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {staff.map((s) => (
                                <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-5 font-medium text-gray-900">{s.full_name}</td>
                                    <td className="p-5 text-gray-500">{s.username}</td>
                                    <td className="p-5 text-gray-500">{s.email}</td>
                                    <td className="p-5 text-right flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => setEditingStaff({ id: s._id, full_name: s.full_name, email: s.email, password: '' })}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Editar colaborador"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(s._id, s.full_name)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar colaborador"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="font-medium text-gray-900">No hay colaboradores registrados</p>
                                        <p className="text-sm mt-1">Añade a tu equipo usando el botón superior.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Creación */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-black" />
                                    Nuevo Colaborador
                                </h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                            placeholder="Ej. Juan Pérez"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de Usuario</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                            placeholder="Ej. juanperez"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                            placeholder="juan@ejemplo.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showCreatePassword ? 'text' : 'password'}
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full pl-11 pr-12 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                            placeholder="Min. 8 caracteres, números y símbolos"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCreatePassword(prev => !prev)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 px-4 py-3 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="flex-1 bg-black text-white px-4 py-3 font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {createMutation.isPending ? 'Creando...' : 'Crear Colaborador'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Credenciales (Por única vez) */}
            {createdCredentials && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <Check className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                                ¡Colaborador Creado!
                            </h2>
                            <p className="text-sm text-gray-500 text-center mb-6">
                                Copia estas credenciales de acceso ahora. Esta es la **única vez** que se mostrará la contraseña.
                            </p>

                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3 mb-6 font-mono text-sm">
                                <div>
                                    <span className="text-gray-400 block text-xs font-sans font-semibold uppercase">Nombre</span>
                                    <span className="text-gray-900 font-bold">{createdCredentials.full_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-xs font-sans font-semibold uppercase">Usuario</span>
                                    <span className="text-gray-900 font-bold">{createdCredentials.username}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-xs font-sans font-semibold uppercase">Email</span>
                                    <span className="text-gray-900 font-bold">{createdCredentials.email}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-xs font-sans font-semibold uppercase">Contraseña</span>
                                    <span className="text-emerald-600 font-bold">{createdCredentials.password}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        const text = `Credenciales de Acceso SaaS:\nNombre: ${createdCredentials.full_name}\nUsuario: ${createdCredentials.username}\nEmail: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}\nLink: ${window.location.origin}/login`;
                                        navigator.clipboard.writeText(text);
                                        toast.success('Credenciales copiadas al portapapeles');
                                    }}
                                    className="w-full bg-black text-white py-3.5 px-4 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                                >
                                    <Copy className="w-5 h-5" />
                                    Copiar Credenciales
                                </button>
                                <button
                                    onClick={() => setCreatedCredentials(null)}
                                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-200 transition-colors text-center"
                                >
                                    Entendido / Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Edición */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Edit2 className="w-6 h-6 text-black" />
                                    Editar Colaborador
                                </h2>
                                <button
                                    onClick={() => setEditingStaff(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const payload: any = {
                                    full_name: editingStaff.full_name,
                                    email: editingStaff.email,
                                };
                                if (editingStaff.password) {
                                    payload.password = editingStaff.password;
                                }
                                updateMutation.mutate({ id: editingStaff.id, data: payload });
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={editingStaff.full_name}
                                            onChange={(e) => setEditingStaff(prev => prev ? ({ ...prev, full_name: e.target.value }) : null)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={editingStaff.email}
                                            onChange={(e) => setEditingStaff(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nueva Contraseña (Opcional)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showEditPassword ? 'text' : 'password'}
                                            value={editingStaff.password || ''}
                                            onChange={(e) => setEditingStaff(prev => prev ? ({ ...prev, password: e.target.value }) : null)}
                                            className="w-full pl-11 pr-12 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                            placeholder="Dejar en blanco para mantener la actual"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPassword(prev => !prev)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingStaff(null)}
                                        className="flex-1 px-4 py-3 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateMutation.isPending}
                                        className="flex-1 bg-black text-white px-4 py-3 font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
