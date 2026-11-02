import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTenants, createTenant, updateTenant, deleteTenant, restoreTenant, impersonateTenant, getMe } from '../api/api';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useConfirm } from '../components/ConfirmModal';
import { 
    Plus, Edit2, Trash2, LogIn, Settings, Loader2, Archive, RotateCcw, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tenant, TenantCreate, TenantUpdate, Plan } from '../api/types';
import { PlanBadge } from '../components/tenants/PlanBadge';
import Pagination from '../components/Pagination';
import { TenantModulesModal } from '../components/tenants/TenantModulesModal';
import { TenantEditModal } from '../components/tenants/TenantEditModal';
import { TenantCreateModal } from '../components/tenants/TenantCreateModal';
import { TenantCredentialsModal } from '../components/tenants/TenantCredentialsModal';

import { AVAILABLE_MODULES } from '../components/tenants/modulesData';

export default function TenantsAdminPage() {
    const { user } = useAuthStore();
    const confirm = useConfirm();
    const queryClient = useQueryClient();

    // Tab state: 'activas' | 'archivadas'
    const [activeTab, setActiveTab] = useState<'activas' | 'archivadas'>('activas');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [modulesTenant, setModulesTenant] = useState<Tenant | null>(null);
    const [localModules, setLocalModules] = useState<string[]>([]);
    const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [credentials, setCredentials] = useState<{ username: string; password: string; name: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Queries
    const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
        queryKey: ['tenants'],
        queryFn: getTenants,
    });

    const { data: dbPlans } = useQuery<Plan[]>({
        queryKey: ['admin-plans'],
        queryFn: () => client<Plan[]>('/tenants/admin/plans'),
    });

    // Form State (Create)
    const [formData, setFormData] = useState<TenantCreate>({
        name: '',
        plan: 'BASICO',
        admin_username: '',
        admin_password: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter active vs archived
    const activeTenants = useMemo(() => {
        return tenants.filter(t => t.is_active !== false && !t.deleted_at);
    }, [tenants]);

    const archivedTenants = useMemo(() => {
        return tenants.filter(t => t.is_active === false || !!t.deleted_at);
    }, [tenants]);

    const currentList = activeTab === 'activas' ? activeTenants : archivedTenants;

    const paginatedTenants = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return currentList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentList, currentPage]);

    const handleTabChange = (tab: 'activas' | 'archivadas') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    // Mutations
    const createTenantMutation = useMutation({
        mutationFn: (newTenant: TenantCreate) => createTenant(newTenant),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
            setIsModalOpen(false);
            setCredentials({ username: vars.admin_username, password: vars.admin_password, name: vars.name });
            setFormData({ name: '', plan: 'BASICO', admin_username: '', admin_password: '' });
            setConfirmPassword('');
            toast.success('Empresa creada exitosamente');
        }
    });

    const updateTenantMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: TenantUpdate }) => updateTenant(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
            setEditingTenant(null);
            toast.success("Empresa actualizada exitosamente");
        }
    });

    const archiveTenantMutation = useMutation({
        mutationFn: deleteTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
            toast.success('Empresa archivada en la papelera');
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message || 'Error al archivar la empresa');
        }
    });

    const restoreTenantMutation = useMutation({
        mutationFn: restoreTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
            toast.success('Empresa restaurada y reactivada exitosamente');
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message || 'Error al restaurar la empresa');
        }
    });

    const impersonateMutation = useMutation({
        mutationFn: async (tenantId: string) => {
            const state = useAuthStore.getState();
            const currentToken = state.token;
            const currentUser = state.user;
            if (currentToken && currentUser) {
                state.pushImpersonation({
                    token: currentToken,
                    username: currentUser.username,
                    email: currentUser.email,
                    role: currentUser.role
                });
            }
            
            const { access_token } = await impersonateTenant(tenantId);
            useAuthStore.setState({ token: access_token });
            const me = await getMe();
            useAuthStore.getState().login(access_token, me);
            return access_token;
        },
        onSuccess: () => {
            window.location.href = '/dashboard';
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message || 'Error al iniciar sesión como cliente');
        }
    });

    const plansList = useMemo<Plan[]>(() => {
        if (dbPlans && dbPlans.length > 0) return dbPlans;
        return [
            { code: 'BASICO', name: 'Plan Básico', is_public: true, features: [] } as Plan,
            { code: 'PRO', name: 'Plan Profesional', is_public: true, features: [] } as Plan,
            { code: 'ENTERPRISE', name: 'Plan Enterprise', is_public: true, features: [] } as Plan,
            { code: 'ILIMITADO', name: 'Plan Ilimitado', is_public: false, features: [] } as Plan,
        ];
    }, [dbPlans]);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.admin_password !== confirmPassword) return;
        createTenantMutation.mutate(formData);
    };

    const handleCopy = () => {
        if (!credentials) return;
        navigator.clipboard.writeText(`Empresa: ${credentials.name}\nUsuario: ${credentials.username}\nContraseña: ${credentials.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEditClick = async (tenant: Tenant) => {
        let dateStr = "";
        if (tenant.plan_expires_at) {
            dateStr = new Date(tenant.plan_expires_at).toISOString().split('T')[0];
        }
        setEditingTenant({ ...tenant, plan_expires_at: dateStr });
        setAdminCreds({ username: 'Cargando...', password: '' });
        try {
            const data = await client<{ username: string, email: string }>(`/tenants/${tenant._id}/admin`);
            setAdminCreds({ username: data.email, password: '' });
        } catch {
            setAdminCreds({ username: '', password: '' });
        }
    };

    const handleArchiveClick = async (tenant: Tenant) => {
        const ok = await confirm({
            title: '¿Archivar empresa?',
            message: `¿Deseas archivar "${tenant.name}"? Se moverá a la pestaña de Archivadas y sus usuarios perderán acceso hasta que la restaures.`,
            type: 'danger',
            confirmLabel: 'Archivar Empresa',
            cancelLabel: 'Cancelar'
        });
        if (ok) {
            archiveTenantMutation.mutate(tenant._id);
        }
    };

    const handleRestoreClick = async (tenant: Tenant) => {
        const ok = await confirm({
            title: '¿Restaurar empresa?',
            message: `¿Deseas restaurar y reactivar "${tenant.name}"? Sus usuarios recuperarán el acceso inmediatamente.`,
            type: 'info',
            confirmLabel: 'Restaurar',
            cancelLabel: 'Cancelar'
        });
        if (ok) {
            restoreTenantMutation.mutate(tenant._id);
        }
    };

    if (user?.role !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN_STAFF') {
        return <div className="p-5 text-center text-red-500 font-bold">Acceso Restringido</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 pb-20 md:pb-8">
            {/* Modal Credenciales Nuevas */}
            {credentials && (
                <TenantCredentialsModal 
                    credentials={credentials}
                    copied={copied}
                    onCopy={handleCopy}
                    onClose={() => setCredentials(null)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Building2 className="text-indigo-600" size={22} />
                        Panel SaaS • Empresas y Módulos
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Control global de clientes, planes de software y aislamiento multi-tenant.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition-all cursor-pointer"
                >
                    <Plus size={16} /> Nueva Empresa
                </button>
            </div>

            {/* Pestañas Activas vs Archivadas */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                    type="button"
                    onClick={() => handleTabChange('activas')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'activas' 
                            ? 'bg-black text-white shadow-xs' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <span>Empresas Activas</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'activas' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                        {activeTenants.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('archivadas')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'archivadas' 
                            ? 'bg-black text-white shadow-xs' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Archive size={14} />
                    <span>Archivadas / Papelera</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'archivadas' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                        {archivedTenants.length}
                    </span>
                </button>
            </div>

            {/* Lista Principal */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                            {activeTab === 'activas' ? 'Empresas en Operación' : 'Empresas Archivadas'}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium">
                            {activeTab === 'activas' 
                                ? 'Empresas con suscripción activa y acceso habilitado para sus usuarios.'
                                : 'Empresas dadas de baja o suspendidas. No ocupan espacio en la vista principal y pueden restaurarse.'}
                        </p>
                    </div>
                    <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600">
                        {currentList.length} Total
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="animate-spin text-gray-300" size={36} />
                        <p className="text-xs text-gray-400 font-bold animate-pulse">Cargando empresas...</p>
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                        <p className="text-xs text-gray-400 font-bold">
                            {activeTab === 'activas' ? 'No hay empresas activas registradas.' : 'La papelera de empresas archivadas está vacía.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginatedTenants.map(tenant => (
                            <div key={tenant._id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all border border-gray-150">
                                <div className="flex items-center gap-4">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs shrink-0 ${
                                        tenant.is_active ? 'bg-gray-900' : 'bg-gray-400'
                                    }`}>
                                        {tenant.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2.5">
                                            <h4 className="font-bold text-gray-900 text-sm">{tenant.name}</h4>
                                            {!tenant.is_active && (
                                                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                    Archivada
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PlanBadge plan={tenant.plan} />
                                            <span className="text-gray-300 text-xs">•</span>
                                            <p className="text-[11px] text-gray-400 font-mono">ID: {tenant._id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {activeTab === 'activas' ? (
                                        <>
                                            <button 
                                                onClick={() => {
                                                    setModulesTenant(tenant);
                                                    setLocalModules(tenant.modulos_activos || []);
                                                }} 
                                                title="Control de Módulos (Feature Toggles)"
                                                className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100 cursor-pointer"
                                            >
                                                <Settings size={15} />
                                            </button>
                                            <button 
                                                onClick={() => impersonateMutation.mutate(tenant._id)} 
                                                disabled={impersonateMutation.isPending}
                                                title="Magic Login (Impersonation)"
                                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 disabled:opacity-50 cursor-pointer"
                                            >
                                                <LogIn size={15} />
                                            </button>
                                            <button 
                                                onClick={() => handleEditClick(tenant)} 
                                                title="Editar Empresa" 
                                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button 
                                                onClick={() => handleArchiveClick(tenant)} 
                                                title="Archivar en papelera" 
                                                className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 cursor-pointer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => handleRestoreClick(tenant)} 
                                            disabled={restoreTenantMutation.isPending}
                                            title="Restaurar y Reactivar Empresa" 
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            <RotateCcw size={13} />
                                            <span>Restaurar Empresa</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {currentList.length > ITEMS_PER_PAGE && (
                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <Pagination 
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(currentList.length / ITEMS_PER_PAGE)}
                                    onPageChange={setCurrentPage}
                                    totalItems={currentList.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal: Feature Toggles */}
            {modulesTenant && (
                <TenantModulesModal 
                    tenant={modulesTenant}
                    localModules={localModules}
                    onToggleModule={(code, checked) => {
                        if (checked) {
                            setLocalModules([...localModules, code]);
                        } else {
                            setLocalModules(localModules.filter(m => m !== code));
                        }
                    }}
                    onClose={() => setModulesTenant(null)}
                    onSave={() => {
                        updateTenantMutation.mutate({ 
                            id: modulesTenant._id, 
                            data: { modulos_activos: localModules } 
                        });
                        setModulesTenant(null);
                    }}
                    isSaving={updateTenantMutation.isPending}
                    availableModules={AVAILABLE_MODULES}
                />
            )}

            {/* Modal: Crear Empresa */}
            {isModalOpen && (
                <TenantCreateModal 
                    formData={formData}
                    confirmPassword={confirmPassword}
                    plansList={plansList}
                    isPending={createTenantMutation.isPending}
                    onChangeFormData={setFormData}
                    onChangeConfirmPassword={setConfirmPassword}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCreateSubmit}
                />
            )}

            {/* Modal: Editar Empresa */}
            {editingTenant && (
                <TenantEditModal 
                    tenant={editingTenant}
                    plansList={plansList}
                    adminCreds={adminCreds}
                    onChangeTenant={setEditingTenant}
                    onChangeAdminCreds={setAdminCreds}
                    onClose={() => setEditingTenant(null)}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        let expires_at = null;
                        if (editingTenant.plan_expires_at) {
                            expires_at = new Date(editingTenant.plan_expires_at + "T12:00:00Z").toISOString();
                        }
                        try {
                            await updateTenantMutation.mutateAsync({
                                id: editingTenant._id,
                                data: {
                                    name: editingTenant.name,
                                    plan: editingTenant.plan,
                                    is_active: editingTenant.is_active,
                                    plan_expires_at: expires_at as any
                                }
                            });
                            if (adminCreds.password || adminCreds.username) {
                                const credsPayload: any = {};
                                if (adminCreds.username && !adminCreds.username.includes('Cargando')) credsPayload.username = adminCreds.username;
                                if (adminCreds.password) credsPayload.password = adminCreds.password;
                                if (Object.keys(credsPayload).length > 0) {
                                    await client(`/tenants/${editingTenant._id}/admin-credentials`, {
                                        method: 'PUT',
                                        body: credsPayload
                                    });
                                }
                            }
                        } catch (err: any) {
                            toast.error(err.message || "Error al actualizar");
                        }
                    }}
                    isUpdating={updateTenantMutation.isPending}
                />
            )}
        </div>
    );
}
