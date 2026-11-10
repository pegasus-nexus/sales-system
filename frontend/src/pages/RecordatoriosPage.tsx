import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Calendar, Clock, RefreshCw, CheckCircle2, Plus, Search,
    AlertCircle, Building, Paperclip, ChevronRight, Loader2
} from 'lucide-react';
import {
    getRecordatorios,
    getRecordatorioKPIs,
    getRecordatorioCategorias,
    getSucursales,
} from '../api/api';
import type { Recordatorio, PrioridadRecordatorio, EstadoRecordatorio } from '../api/types';
import { RecordatorioDrawer } from '../components/recordatorios/RecordatorioDrawer';
import { RecordatorioDetailModal } from '../components/recordatorios/RecordatorioDetailModal';
import { NuevaCategoriaModal } from '../components/recordatorios/NuevaCategoriaModal';
import { useAuthStore } from '../store/authStore';

export const RecordatoriosPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // Filtros
    const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
    const [selectedSucursal, setSelectedSucursal] = useState<string>('TODAS');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedPrioridad, setSelectedPrioridad] = useState<string>('TODAS');
    const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');

    // Modales y Drawers
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isNuevaCatModalOpen, setIsNuevaCatModalOpen] = useState(false);
    const [selectedRecordatorio, setSelectedRecordatorio] = useState<Recordatorio | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Queries
    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales_recordatorios'],
        queryFn: () => getSucursales(true),
        staleTime: 5 * 60 * 1000,
    });

    const { data: categorias = ['Caja', 'Inventario', 'Sistemas', 'Ventas'] } = useQuery({
        queryKey: ['recordatorio_categorias'],
        queryFn: getRecordatorioCategorias,
    });

    const { data: kpis, isLoading: isLoadingKPIs } = useQuery({
        queryKey: ['recordatorio_kpis', selectedSucursal],
        queryFn: () => getRecordatorioKPIs(selectedSucursal),
    });

    const { data: recordatorios = [], isLoading: isLoadingList } = useQuery({
        queryKey: [
            'recordatorios_list',
            selectedSucursal,
            selectedCategoria,
            selectedPrioridad,
            selectedEstado,
            searchQuery,
        ],
        queryFn: () =>
            getRecordatorios({
                sucursal_id: selectedSucursal,
                categoria: selectedCategoria,
                prioridad: selectedPrioridad,
                estado: selectedEstado,
                search: searchQuery,
            }),
    });

    const handleRefreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['recordatorios_list'] });
        queryClient.invalidateQueries({ queryKey: ['recordatorio_kpis'] });
        queryClient.invalidateQueries({ queryKey: ['recordatorio_categorias'] });
    };

    const getPriorityBadge = (p: PrioridadRecordatorio) => {
        switch (p) {
            case 'ALTA':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        Alta
                    </span>
                );
            case 'MEDIA':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Media
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Baja
                    </span>
                );
        }
    };

    const getStatusBadge = (e: EstadoRecordatorio) => {
        switch (e) {
            case 'PENDIENTE':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        Pendiente
                    </span>
                );
            case 'EN_SEGUIMIENTO':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                        En seguimiento
                    </span>
                );
            case 'RESUELTO':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Resuelto
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {e}
                    </span>
                );
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Recordatorios
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Control de actividades e incidencias
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filtro Multi-sucursal */}
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-gray-200 shadow-2xs">
                        <Building className="w-4 h-4 text-purple-600 shrink-0" />
                        <select
                            value={selectedSucursal}
                            onChange={e => setSelectedSucursal(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                        >
                            <option value="TODAS">Todas las sucursales</option>
                            {sucursales.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botón Principal "+ Nuevo recordatorio" */}
                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo recordatorio</span>
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards Superiores (Estilo Ilustración) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none mt-1">
                            {isLoadingKPIs ? <Loader2 className="w-6 h-6 animate-spin text-purple-600" /> : kpis?.total ?? 0}
                        </p>
                    </div>
                </div>

                {/* Pendientes */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pendientes</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none mt-1">
                            {isLoadingKPIs ? <Loader2 className="w-6 h-6 animate-spin text-amber-600" /> : kpis?.pendientes ?? 0}
                        </p>
                    </div>
                </div>

                {/* En seguimiento */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">En seguimiento</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none mt-1">
                            {isLoadingKPIs ? <Loader2 className="w-6 h-6 animate-spin text-sky-600" /> : kpis?.en_seguimiento ?? 0}
                        </p>
                    </div>
                </div>

                {/* Resueltos */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Resueltos</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none mt-1">
                            {isLoadingKPIs ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600" /> : kpis?.resueltos ?? 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Categorías (Píldoras Horizontales) */}
            <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Categorías
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Opción "Todas" */}
                    <button
                        type="button"
                        onClick={() => setSelectedCategoria('Todas')}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            selectedCategoria === 'Todas'
                                ? 'bg-purple-600 text-white shadow-purple-600/20'
                                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                        }`}
                    >
                        Todas
                    </button>

                    {/* Categorías dinámicas */}
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategoria(cat)}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                selectedCategoria === cat
                                    ? 'bg-purple-600 text-white shadow-purple-600/20'
                                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}

                    {/* Botón "+ Nueva categoría" */}
                    <button
                        type="button"
                        onClick={() => setIsNuevaCatModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nueva categoría</span>
                    </button>
                </div>
            </div>

            {/* Tabla de Seguimiento / Actividades */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                {/* Barra de herramientas interna (Búsqueda y filtros rápidos) */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/40">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Seguimiento</h2>
                        <p className="text-xs text-gray-400">Listado interactivo de incidencias y recordatorios</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Buscador */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar actividad..."
                                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        {/* Filtro Prioridad */}
                        <select
                            value={selectedPrioridad}
                            onChange={e => setSelectedPrioridad(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold text-xs focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                        >
                            <option value="TODAS">Todas las prioridades</option>
                            <option value="ALTA">Alta</option>
                            <option value="MEDIA">Media</option>
                            <option value="BAJA">Baja</option>
                        </select>

                        {/* Filtro Estado */}
                        <select
                            value={selectedEstado}
                            onChange={e => setSelectedEstado(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold text-xs focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="PENDIENTE">Pendientes</option>
                            <option value="EN_SEGUIMIENTO">En seguimiento</option>
                            <option value="RESUELTO">Resueltos</option>
                        </select>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                <th className="py-3 px-6">Recordatorio</th>
                                <th className="py-3 px-4">Categoría</th>
                                <th className="py-3 px-4">Prioridad</th>
                                <th className="py-3 px-4">Estado</th>
                                <th className="py-3 px-6 text-right">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {isLoadingList ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                                        <span>Cargando recordatorios...</span>
                                    </td>
                                </tr>
                            ) : recordatorios.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                        <p className="font-semibold text-gray-600">No se encontraron recordatorios</p>
                                        <p className="text-xs text-gray-400 mt-1">Crea una nueva incidencia con el botón superior.</p>
                                    </td>
                                </tr>
                            ) : (
                                recordatorios.map(rec => (
                                    <tr
                                        key={rec.id}
                                        onClick={() => {
                                            setSelectedRecordatorio(rec);
                                            setIsDetailModalOpen(true);
                                        }}
                                        className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                                    >
                                        {/* Título y metadatos */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-start gap-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                                        {rec.titulo}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                                        Por <b>{rec.creado_por_nombre}</b> • {rec.sucursal_nombre || 'General'} • {new Date(rec.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {rec.adjuntos && rec.adjuntos.length > 0 && (
                                                    <span className="p-1 rounded-md bg-purple-50 text-purple-600" title={`${rec.adjuntos.length} adjuntos`}>
                                                        <Paperclip className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Categoría */}
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                                                {rec.categoria}
                                            </span>
                                        </td>

                                        {/* Prioridad */}
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {getPriorityBadge(rec.prioridad)}
                                        </td>

                                        {/* Estado */}
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {getStatusBadge(rec.estado)}
                                        </td>

                                        {/* Detalle */}
                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <span className="inline-flex items-center text-xs font-bold text-gray-400 group-hover:text-purple-600 transition-colors">
                                                <span>Ver</span>
                                                <ChevronRight className="w-4 h-4 ml-0.5" />
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-3 px-6 bg-gray-50/50 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>{recordatorios.length} {recordatorios.length === 1 ? 'registro' : 'registros'} listados</span>
                    <span className="italic">Haz clic en cualquier fila para ver el detalle y actualizar estado</span>
                </div>
            </div>

            {/* Drawer "Nuevo Recordatorio" */}
            <RecordatorioDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                categorias={categorias}
                onOpenNuevaCategoria={() => setIsNuevaCatModalOpen(true)}
                onSuccess={handleRefreshAll}
                sucursales={sucursales}
                currentSucursalId={user?.sucursal_id}
            />

            {/* Modal "Nueva Categoría" */}
            <NuevaCategoriaModal
                isOpen={isNuevaCatModalOpen}
                onClose={() => setIsNuevaCatModalOpen(false)}
                onSuccess={() => {
                    handleRefreshAll();
                }}
            />

            {/* Modal "Detalle y Resolución de Recordatorio" */}
            <RecordatorioDetailModal
                recordatorio={selectedRecordatorio}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedRecordatorio(null);
                }}
                onSuccess={handleRefreshAll}
            />
        </div>
    );
};

export default RecordatoriosPage;
