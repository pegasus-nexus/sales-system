
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClientCombobox } from '../components/ClientCombobox';
import { toast } from 'sonner';
import { Users, Gift, MousePointerClick, RefreshCcw } from 'lucide-react';
import { client } from '../api/api';

export default function ComunidadPage() {
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['comunidad-stats'],
        queryFn: async () => {
            const res = await client<any>('/comunidad/stats');
            return res;
        }
    });

    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['comunidad-users'],
        queryFn: async () => {
            const res = await client<any>('/comunidad/users?limit=50');
            return res;
        }
    });

    const { data: miembros, isLoading: miembrosLoading, refetch: refetchMiembros } = useQuery({
        queryKey: ['comunidad-miembros'],
        queryFn: async () => {
            const res = await client<any>('/comunidad/miembros?limit=50');
            return res;
        }
    });

    
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const afiliarMutation = useMutation({
        mutationFn: async (clienteId: string) => client(`/comunidad/afiliar/${clienteId}`, { method: 'POST' }),
        onSuccess: () => {
            toast.success("Cliente afiliado exitosamente");
            setSelectedClient(null);
            refetchMiembros();
            refetchStats();
        },
        onError: () => toast.error("Error al afiliar cliente")
    });

    const handleAfiliar = () => {
        if (!selectedClient) return;
        afiliarMutation.mutate(selectedClient._id);
    };

    const handleRefresh = () => {
        refetchStats();
        refetchUsers();
        refetchMiembros();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comunidad de Clientes</h1>
                    <p className="text-sm text-gray-500 mt-1">Leads y reclamos de cupones en tiempo real.</p>
                </div>
                <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <RefreshCcw size={16} />
                    Actualizar
                </button>
            </div>

            
            {/* Afiliar Cliente Box */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-end gap-4">
                <div className="flex-1 max-w-md">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Afiliar Cliente Existente</label>
                    <ClientCombobox 
                        selectedClient={selectedClient}
                        onSelect={setSelectedClient}
                        onClear={() => setSelectedClient(null)}
                    />
                </div>
                <button 
                    onClick={handleAfiliar}
                    disabled={!selectedClient || afiliarMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-colors h-[42px]"
                >
                    {afiliarMutation.isPending ? 'Afiliando...' : '+ Afiliar a Comunidad'}
                </button>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Registrados</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_registrados}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <Gift size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Cupones Reclamados</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_reclamados}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <PercentIcon />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Tasa de Conversión</p>
                        <p className="text-3xl font-black text-gray-900">{stats.tasa_conversion}%</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                            <MousePointerClick size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Visitas a la Landing</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_visitas_globales}</p>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Miembros de la Comunidad Web</h2>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">NUEVO</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="text-xs uppercase bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Teléfono</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Última Compra</th>
                                <th className="px-6 py-4">Total Compras</th>
                                <th className="px-6 py-4">Tarjeta Taboada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {miembrosLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium">Cargando...</td>
                                </tr>
                            ) : miembros?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium">No hay miembros registrados desde la web todavía.</td>
                                </tr>
                            ) : (
                                miembros?.map((miembro: any) => (
                                    <tr key={miembro._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-gray-900">{miembro.nombre}</div>
                                            <div className="text-xs text-gray-400">{miembro.email || 'Sin correo'}</div>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-700">{miembro.telefono}</td>
                                        <td className="px-6 py-3">
                                            {miembro.estado_visita === 'Comprador' ? (
                                                <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">
                                                    Comprador
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold border border-gray-200">
                                                    Solo Visitó
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-700">
                                            {miembro.ultima_compra_fecha ? new Date(miembro.ultima_compra_fecha).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {miembro.total_compras || 0}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="font-mono bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
                                                {miembro.numero_tarjeta || 'Sin Tarjeta'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FEXCO Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Historial Campaña FEXCO</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="text-xs uppercase bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Teléfono</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Premio</th>
                                <th className="px-6 py-4">Visitas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {usersLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">Cargando...</td>
                                </tr>
                            ) : users?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">Nadie se ha registrado todavía.</td>
                                </tr>
                            ) : (
                                users?.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-gray-900">{user.nombre ? `${user.nombre} ${user.apellido || ''}` : 'Anónimo'}</div>
                                            <div className="text-xs text-gray-400">{user.email || 'Sin correo'}</div>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-700">{user.telefono}</td>
                                        <td className="px-6 py-3">
                                            {user.ha_reclamado ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold">
                                                    Reclamado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-bold">
                                                    Solo Vio
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            {user.premio_reclamado ? (
                                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs">
                                                    {user.premio_reclamado}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-500">{user.visitas_pagina}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function PercentIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
    )
}
