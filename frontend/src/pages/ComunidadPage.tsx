
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientCombobox } from '../components/ClientCombobox';
import { toast } from 'sonner';
import { Users, Gift, MousePointerClick, RefreshCcw, Search, CheckCircle } from 'lucide-react';
import { client } from '../api/api';
import Pagination from '../components/Pagination';

export default function ComunidadPage() {
    const { data: webConfig } = useQuery({
        queryKey: ['web-config'],
        queryFn: async () => {
            const res = await client<any>('/web-config');
            return res;
        }
    });

    const queryClient = useQueryClient();

    const handleEntregarPremio = async (clienteId: string, premioId: string) => {
        try {
            const res = await client<any>(`/comunidad/entregar-premio/${clienteId}/${premioId}`, { method: 'POST' });
            if (res.status === 'ok') {
                queryClient.invalidateQueries({ queryKey: ['miembros-comunidad'] });
            }
        } catch (error) {
            console.error(error);
        }
    };


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

    const [miembrosPage, setMiembrosPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<'comunidad' | 'regulares' | 'todos'>('comunidad');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setMiembrosPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: miembros, isLoading: miembrosLoading, refetch: refetchMiembros } = useQuery({
        queryKey: ['comunidad-miembros', miembrosPage, debouncedSearch, tipoFiltro],
        queryFn: async () => {
            const skip = (miembrosPage - 1) * 10;
            const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
            const res = await client<any>(`/comunidad/miembros?limit=10&skip=${skip}&tipo=${tipoFiltro}${searchParam}`);
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
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Afiliados Web</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_registrados}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Personas que se registraron online.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Gift size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Reclamaron Cupones</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-gray-900">{stats.total_reclamados}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Clientes que reclamaron el premio en la web.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Entregados en Tienda</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-gray-900">{stats.total_entregados || 0}</p>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                                {stats.total_reclamados > 0 ? Math.round(((stats.total_entregados || 0) / stats.total_reclamados) * 100) : 0}% efectividad
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">De los que reclamaron, cuántos fueron físicamente a la sucursal.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                            <MousePointerClick size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Visitas a la Landing</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_visitas_globales}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Número total de visitas a la página web de registro.</p>
                    </div>
                </div>
            )} : 'Fecha no registrada';
                                                        
                                                        const rewardConfig = webConfig?.rewards?.find((r: any) => r.id === p);
                                                        const prizeName = miembro.premios_canjeados_nombres?.[p] || rewardConfig?.title || (p === 'trufa' ? 'CHOCOLATE AMARGO' : p === 'choco' ? 'TRUFAS DE CHOCOLATE' : p === 'cupon2' ? 'GESTO 2%' : p === 'choco3' ? 'GESTO 3%' : p === 'cupon4' ? 'GESTO 4%' : p.startsWith('PREMIO_') ? 'CUPÓN DESCATALOGADO' : p.toUpperCase());
                                                        
                                                        let expiresStr = '';
                                                        let isExpired = false;
                                                        const validityDays = rewardConfig?.validity_days || 14;
                                                        if (dateObj) {
                                                            const expiresDate = new Date(dateObj.getTime() + validityDays * 24 * 60 * 60 * 1000);
                                                            expiresStr = expiresDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                                                            isExpired = new Date() > expiresDate;
                                                        }

                                                        const isEntregado = (miembro.datos_crm?.premios_entregados || miembro.premios_entregados || []).includes(p);
                                                        
                                                        return (
                                                            <div key={i} className={`flex flex-col gap-0.5 mb-1 p-2 rounded-lg border ${isEntregado ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-gray-50/50 border-gray-100'}`}>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold w-fit whitespace-nowrap">
                                                                            {prizeName}
                                                                        </span>
                                                                        {isEntregado && (
                                                                            <span className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">
                                                                                <CheckCircle size={10} /> Entregado
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {expiresStr && !isEntregado && (
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                                            {isExpired ? 'VENCIDO' : 'VIGENTE'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-gray-500 font-medium mt-0.5">Canjeado: {dateStr}</span>
                                                                {expiresStr && (
                                                                    <span className="text-[10px] text-gray-400 font-medium">Válido hasta: {expiresStr}</span>
                                                                )}
                                                                {!isEntregado && !isExpired && (
                                                                    <button 
                                                                        onClick={() => handleEntregarPremio(miembro.id, p)}
                                                                        className="mt-1 flex items-center justify-center gap-1 w-full py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold transition-colors"
                                                                    >
                                                                        <CheckCircle size={12} /> Marcar como Entregado
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Ninguno</span>
                                            )}
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
                {miembros?.total > 10 && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                        <Pagination 
                            currentPage={miembrosPage}
                            totalPages={Math.ceil(miembros.total / 10)} totalItems={miembros.total} itemsPerPage={10}
                            onPageChange={setMiembrosPage}
                        />
                    </div>
                )}

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




