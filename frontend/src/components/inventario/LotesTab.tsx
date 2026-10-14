import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    AlertTriangle, ShieldAlert, CheckCircle2, Clock, 
    Search, Lock, Unlock, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { getLotes, getResumenLotes, cambiarEstadoLote, type LoteInventario } from '../../api/lotes';
import Pagination from '../Pagination';

interface LotesTabProps {
    selectedSucursal: string;
    selectedAlmacen: string;
}

export default function LotesTab({ selectedSucursal, selectedAlmacen }: LotesTabProps) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroVencimiento, setFiltroVencimiento] = useState<'TODOS' | 'POR_VENCER' | 'VENCIDOS'>('TODOS');
    const [estadoFilter, setEstadoFilter] = useState<string>('ACTIVO');
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    // Métricas de resumen
    const { data: resumen } = useQuery({
        queryKey: ['resumen_lotes', selectedSucursal],
        queryFn: () => getResumenLotes(selectedSucursal),
        enabled: !!selectedSucursal
    });

    // Lista paginada de lotes
    const { data: lotesData, isLoading } = useQuery({
        queryKey: ['lotes', selectedSucursal, selectedAlmacen, filtroVencimiento, estadoFilter, searchTerm, page],
        queryFn: () => getLotes({
            sucursal_id: selectedSucursal,
            almacen_id: selectedAlmacen === 'default' ? undefined : selectedAlmacen,
            estado: estadoFilter === 'TODOS' ? undefined : estadoFilter,
            solo_vencidos: filtroVencimiento === 'VENCIDOS',
            por_vencer_dias: filtroVencimiento === 'POR_VENCER' ? 30 : undefined,
            search: searchTerm || undefined,
            page,
            limit: LIMIT
        }),
        enabled: !!selectedSucursal
    });

    // Mutación para bloquear/desbloquear lote (control de calidad)
    const toggleEstadoMut = useMutation({
        mutationFn: ({ id, nuevoEstado }: { id: string; nuevoEstado: string }) => 
            cambiarEstadoLote(id, nuevoEstado),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['lotes'] });
            queryClient.invalidateQueries({ queryKey: ['resumen_lotes'] });
            toast.success(`Lote ${vars.nuevoEstado === 'BLOQUEADO' ? 'bloqueado por cuarentena' : 'activado'}`);
        },
        onError: () => {
            toast.error('Error al cambiar el estado del lote');
        }
    });

    const lotes = lotesData?.items || [];
    const totalPages = lotesData?.pages || 1;
    const totalItems = lotesData?.total || 0;

    const formatFecha = (isoStr?: string) => {
        if (!isoStr) return 'Sin fecha';
        try {
            const d = new Date(isoStr);
            return d.toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return isoStr;
        }
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                    onClick={() => { setFiltroVencimiento('TODOS'); setEstadoFilter('ACTIVO'); setPage(1); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${filtroVencimiento === 'TODOS' && estadoFilter === 'ACTIVO' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Lotes Activos</span>
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">{resumen?.total_lotes_activos || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{resumen?.total_unidades?.toLocaleString() || 0} unidades totales</p>
                </div>

                <div 
                    onClick={() => { setFiltroVencimiento('POR_VENCER'); setEstadoFilter('ACTIVO'); setPage(1); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${filtroVencimiento === 'POR_VENCER' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Por Vencer (&le; 30d)</span>
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-black text-amber-900">{resumen?.por_vencer_30d || 0}</p>
                    <p className="text-xs text-amber-700 mt-1">Próximos a caducar</p>
                </div>

                <div 
                    onClick={() => { setFiltroVencimiento('VENCIDOS'); setEstadoFilter('TODOS'); setPage(1); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${filtroVencimiento === 'VENCIDOS' ? 'bg-red-50 border-red-300 ring-2 ring-red-500' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-700">Lotes Vencidos</span>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-black text-red-900">{resumen?.vencidos || 0}</p>
                    <p className="text-xs text-red-700 mt-1">Requieren baja o merma</p>
                </div>

                <div 
                    onClick={() => { setFiltroVencimiento('TODOS'); setEstadoFilter('BLOQUEADO'); setPage(1); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${estadoFilter === 'BLOQUEADO' ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700">En Cuarentena</span>
                        <ShieldAlert className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-black text-purple-900">Bloqueados</p>
                    <p className="text-xs text-purple-700 mt-1">Aislados de la venta POS</p>
                </div>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por código de lote..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={estadoFilter}
                        onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
                        className="p-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="TODOS">Todos los estados</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="BLOQUEADO">Bloqueados</option>
                        <option value="AGOTADO">Agotados</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Lotes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lote</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Estado Caducidad</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Stock Actual / Inicial</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Costo Unit.</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Control Calidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                                        Cargando trazabilidad de lotes...
                                    </td>
                                </tr>
                            ) : lotes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-400">
                                        No se encontraron lotes para los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                lotes.map((lote: LoteInventario) => {
                                    const isVencido = lote.estado_vencimiento === 'VENCIDO';
                                    const isPorVencer = lote.estado_vencimiento === 'POR_VENCER';
                                    const isBloqueado = lote.estado === 'BLOQUEADO';

                                    return (
                                        <tr key={lote.id} className={`hover:bg-gray-50/60 transition-colors ${isVencido ? 'bg-red-50/20' : ''}`}>
                                            <td className="p-4">
                                                <p className="font-bold text-gray-900 text-sm">{lote.producto_nombre || 'Producto'}</p>
                                                <span className="text-xs text-gray-500 font-mono">{lote.producto_codigo || lote.producto_id}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg font-mono text-xs font-bold border border-gray-200">
                                                    {lote.lote_codigo}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-semibold text-gray-900">{formatFecha(lote.fecha_vencimiento)}</p>
                                                {lote.dias_restantes !== null && lote.dias_restantes !== undefined && (
                                                    <span className={`text-[11px] font-bold ${lote.dias_restantes < 0 ? 'text-red-600' : lote.dias_restantes <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {lote.dias_restantes < 0 
                                                            ? `Venció hace ${Math.abs(lote.dias_restantes)} días` 
                                                            : `Quedan ${lote.dias_restantes} días`}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {isVencido ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                                        <AlertTriangle size={12} /> Vencido
                                                    </span>
                                                ) : isPorVencer ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                        <Clock size={12} /> Por Vencer
                                                    </span>
                                                ) : lote.fecha_vencimiento ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                        <CheckCircle2 size={12} /> Vigente
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin Vto.</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 font-bold">
                                                    <span className={`text-base ${lote.cantidad_actual <= 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                                                        {lote.cantidad_actual}
                                                    </span>
                                                    <span className="text-xs text-gray-400">/ {lote.cantidad_inicial}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-semibold text-gray-900 text-sm">
                                                Bs. {Number(lote.costo_unitario).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleEstadoMut.mutate({
                                                        id: lote.id,
                                                        nuevoEstado: isBloqueado ? 'ACTIVO' : 'BLOQUEADO'
                                                    })}
                                                    disabled={toggleEstadoMut.isPending}
                                                    title={isBloqueado ? 'Desbloquear lote para ventas' : 'Poner lote en cuarentena (bloquear ventas)'}
                                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isBloqueado ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                >
                                                    {isBloqueado ? (
                                                        <>
                                                            <Lock size={12} /> Bloqueado
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Unlock size={12} /> Activo
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium">Total: {totalItems} lotes</span>
                        <Pagination 
                            currentPage={page} 
                            totalPages={totalPages} 
                            onPageChange={setPage} 
                            totalItems={totalItems} 
                            itemsPerPage={LIMIT} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
