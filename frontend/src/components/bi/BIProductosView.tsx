import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Layers, Filter, Search, X,
    Maximize2, RotateCcw, AlertTriangle, Tag, Package, ShoppingBag, DollarSign, Sparkles
} from 'lucide-react';
import { getBIProductos, getBISucursales } from '../../api/biApi';
import type { BIProductosResponse, BISucursalOption } from '../../api/biApi';
import { BIMatrizBCGView } from './BIMatrizBCGView';
import { BIDescuentosView } from './BIDescuentosView';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getFormattedBoliviaDate = (daysOffset: number = 0): string => {
    const now = new Date();
    const boliviaDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);

    if (daysOffset === 0) {
        return boliviaDateStr;
    }

    const [y, m, d] = boliviaDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + daysOffset);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export interface BIProductosViewProps {
    initialSubTab?: 'catalog' | 'bcg' | 'descuentos';
}

export const BIProductosView: React.FC<BIProductosViewProps> = ({ initialSubTab = 'catalog' }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'bcg' | 'descuentos'>(initialSubTab);

    const [data, setData] = useState<BIProductosResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    useEffect(() => {
        if (initialSubTab) {
            setActiveSubTab(initialSubTab);
        }
    }, [initialSubTab]);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursales(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchProductosData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIProductos(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo rendimiento de productos:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi-productos/productos no fue encontrado.'
                    : 'Error de conexión con el servicio de productos del BI.');
            setError(msg);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSucursales();
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchProductosData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchProductosData]);

    const handleReset = () => {
        const todayStr = getFormattedBoliviaDate(0);
        setStartDate(todayStr);
        setEndDate(todayStr);
        setSelectedSucursal('all');
        setSearchTerm('');
        setActiveSubTab('catalog');
    };

    const setQuickRange = (type: 'today' | 'yesterday' | '7days' | 'month') => {
        const todayStr = getFormattedBoliviaDate(0);
        if (type === 'today') {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (type === 'yesterday') {
            const yest = getFormattedBoliviaDate(-1);
            setStartDate(yest);
            setEndDate(yest);
        } else if (type === '7days') {
            const d7 = getFormattedBoliviaDate(-6);
            setStartDate(d7);
            setEndDate(todayStr);
        } else if (type === 'month') {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            setStartDate(`${y}-${m}-01`);
            setEndDate(todayStr);
        }
    };

    const todayStr = getFormattedBoliviaDate(0);
    const yestStr = getFormattedBoliviaDate(-1);
    const d7Str = getFormattedBoliviaDate(-6);
    const firstMonthStr = `${todayStr.substring(0, 7)}-01`;

    const isTodayActive = startDate === todayStr && endDate === todayStr;
    const isYesterdayActive = startDate === yestStr && endDate === yestStr;
    const is7DaysActive = startDate === d7Str && endDate === todayStr;
    const isMonthActive = startDate === firstMonthStr && endDate === todayStr;

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const filteredProducts = data?.top_productos.filter(p => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) || p.categoria_nombre.toLowerCase().includes(term);
    }) || [];

    if (error && !loading && activeSubTab !== 'descuentos') {
        return (
            <div className="bg-rose-50/90 border-2 border-rose-200/80 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 text-rose-950 max-w-4xl mx-auto my-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-600 shadow-xs">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener el rendimiento de productos</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchProductosData(startDate, endDate, selectedSucursal)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={14} /> Reintentar Conexión
                    </button>
                </div>
            </div>
        );
    }

    const getHeaderDetails = () => {
        if (activeSubTab === 'bcg') {
            return {
                badge: 'CENTRO DE INTELIGENCIA DE NEGOCIOS — MATRIZ BCG',
                title: 'Matriz BCG & Clasificación Estratégica de Productos',
                subtitle: 'Evaluación matemática dinámica por volumen de venta y recaudación acumulada'
            };
        } else if (activeSubTab === 'descuentos') {
            return {
                badge: 'CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 8',
                title: 'Descuentos & Impacto de Promociones',
                subtitle: 'Modelo Estrella (`FACT_DESCUENTOS_SALES`) sobre MongoDB `descuentos` y `sales`'
            };
        }
        return {
            badge: 'CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 3',
            title: 'Catálogo Inteligente & Ranking de Productos',
            subtitle: 'Modelo Estrella (`FACT_SALES_ITEMS`) sobre MongoDB `sales.items[]`'
        };
    };

    const headerInfo = getHeaderDetails();

    return (
        <div className={`min-h-screen bg-[#f8f9fd] p-1 sm:p-2 space-y-6 font-sans text-slate-800 w-full ${isFullscreen ? 'p-8' : ''}`}>
            
            {/* CABECERA ESTILO PASTEL NARANJITA / AMBER (DINÁMICA SEGÚN SUBPESTAÑA) */}
            <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-yellow-50/90 rounded-3xl p-6 shadow-sm border border-amber-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Layers size={14} className="text-amber-600" />
                        </div>
                        <span>{headerInfo.badge}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{headerInfo.title}</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        {headerInfo.subtitle} (<span className="text-amber-800 font-black bg-amber-100/80 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchProductosData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs"
                    >
                        <RotateCcw size={14} className="text-slate-500" />
                        <span>Restablecer</span>
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs"
                    >
                        <Maximize2 size={14} className="text-slate-500" />
                    </button>
                </div>
            </div>

            {/* CONTROLES DE FILTRADO DE FECHA Y SUCURSAL (SOLO SI NO ESTÁ EN SUBPESTAÑA DESCUENTOS EMBEBIDA) */}
            {activeSubTab !== 'descuentos' && (
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        {/* Botones de Selección Rápida */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
                            <button
                                onClick={() => setQuickRange('today')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    isTodayActive
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setQuickRange('yesterday')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    isYesterdayActive
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                            >
                                Ayer
                            </button>
                            <button
                                onClick={() => setQuickRange('7days')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    is7DaysActive
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                            >
                                Últimos 7 Días
                            </button>
                            <button
                                onClick={() => setQuickRange('month')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    isMonthActive
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                            >
                                Este Mes
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
                            <Calendar size={14} className="text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                            />
                            <span className="text-slate-400 font-bold text-xs">a</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                value={selectedSucursal}
                                onChange={(e) => setSelectedSucursal(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="all">Todas las Sucursales</option>
                                {sucursales.map((s) => (
                                    <option key={s.sucursal_id} value={s.sucursal_id}>
                                        {s.nombre} ({s.ciudad})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-2">
                        <Calendar size={15} className="text-amber-600" />
                        <span>
                            Período: <strong className="text-slate-900 font-black">{startDate}</strong> al <strong className="text-slate-900 font-black">{endDate}</strong>
                        </span>
                        {data && (
                            <span className="ml-2 text-slate-400 font-semibold border-l border-slate-200 pl-2">
                                POS Sincro: <strong className="text-amber-700 font-bold">{data.ultima_actualizacion}</strong>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* CONTENIDO SEGÚN LA SUBPESTAÑA SELECCIONADA */}
            {activeSubTab === 'descuentos' ? (
                <BIDescuentosView hideHeader={true} />
            ) : activeSubTab === 'bcg' ? (
                <BIMatrizBCGView products={data?.top_productos || []} loading={loading} />
            ) : (
                <div className="space-y-6">
                    {/* TARJETAS KPIS PRINCIPALES ESTILO NARANJITA */}
                    {data && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            {/* KPI 1: PRODUCTO MÁS VENDIDO */}
                            <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-200/80 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-amber-100">
                                    <span className="text-xs font-black uppercase text-amber-950">Más Vendido (Volumen)</span>
                                    <div className="p-2 bg-amber-100/80 text-amber-600 rounded-2xl">
                                        <Package size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight">
                                        {data.kpis.producto_mas_vendido}
                                    </h2>
                                    <p className="text-xs font-extrabold text-amber-700 mt-1">
                                        {data.kpis.unidades_producto_mas_vendido} unidades vendidas
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">SUM(items.cantidad)</span>
                            </div>

                            {/* KPI 2: PRODUCTO MAYOR RECAUDACIÓN */}
                            <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white rounded-3xl p-5 shadow-xs border border-orange-200/80 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-orange-100">
                                    <span className="text-xs font-black uppercase text-orange-950">Mayor Recaudación</span>
                                    <div className="p-2 bg-orange-100/80 text-orange-600 rounded-2xl">
                                        <DollarSign size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight">
                                        {data.kpis.producto_mayor_recaudacion}
                                    </h2>
                                    <p className="text-xs font-extrabold text-orange-700 mt-1">
                                        {formatBs(data.kpis.ingresos_producto_mayor_recaudacion)}
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">MAX(SUM(items.subtotal))</span>
                            </div>

                            {/* KPI 3: SKUS DISTINTOS */}
                            <div className="bg-gradient-to-br from-yellow-50/90 via-amber-50/40 to-white rounded-3xl p-5 shadow-xs border border-yellow-200/80 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-yellow-100">
                                    <span className="text-xs font-black uppercase text-amber-950">SKUs Activos Vendidos</span>
                                    <div className="p-2 bg-amber-100/80 text-amber-700 rounded-2xl">
                                        <Tag size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {data.kpis.skus_distintos}
                                    </h2>
                                    <p className="text-xs font-extrabold text-amber-800 mt-1">
                                        Productos distintos en el período
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">COUNT(DISTINCT producto_id)</span>
                            </div>

                            {/* KPI 4: UNIDADES PROMEDIO POR TICKET */}
                            <div className="bg-gradient-to-br from-amber-100/60 via-orange-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-200/80 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-amber-100">
                                    <span className="text-xs font-black uppercase text-amber-950">Unidades / Ticket</span>
                                    <div className="p-2 bg-orange-100/80 text-orange-600 rounded-2xl">
                                        <ShoppingBag size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {data.kpis.unidades_promedio_por_ticket}
                                    </h2>
                                    <p className="text-xs font-extrabold text-orange-700 mt-1">
                                        Promedio de ítems por compra
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">SUM(items.cantidad) / Tickets</span>
                            </div>

                        </div>
                    )}

                    {/* RESUMEN DE LA MATRIZ BCG */}
                    {data && data.top_productos && data.top_productos.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                        <Sparkles size={18} className="text-amber-600" />
                                        <span>Resumen de Clasificación BCG</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold">Distribución rápida de productos clave según rotación y margen</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* ESTRELLAS ⭐ */}
                                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2">
                                    <span className="text-xs font-black text-amber-950 uppercase flex items-center gap-1">
                                        ⭐ Estrellas (Alta Venta / Crecimiento)
                                    </span>
                                    <p className="text-xs font-bold text-amber-900 truncate">
                                        {data.top_productos[0]?.nombre || 'Sin datos'}
                                    </p>
                                    <span className="text-[10px] font-extrabold text-amber-700 block">
                                        Impulsan el {data.top_productos[0]?.participacion_pct || 0}% de la recaudación.
                                    </span>
                                </div>

                                {/* VACAS 🐄 */}
                                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2">
                                    <span className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1">
                                        🐄 Vacas Lecheras (Alta Venta / Flujo)
                                    </span>
                                    <p className="text-xs font-bold text-emerald-900 truncate">
                                        {data.top_productos[1]?.nombre || data.top_productos[0]?.nombre || 'Sin datos'}
                                    </p>
                                    <span className="text-[10px] font-extrabold text-emerald-700 block">
                                        Generación constante de flujo de caja.
                                    </span>
                                </div>

                                {/* INTERROGANTES ❓ */}
                                <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200/80 space-y-2">
                                    <span className="text-xs font-black text-sky-950 uppercase flex items-center gap-1">
                                        ❓ Interrogantes (Potencial)
                                    </span>
                                    <p className="text-xs font-bold text-sky-900 truncate">
                                        {data.top_productos[2]?.nombre || 'En evaluación'}
                                    </p>
                                    <span className="text-[10px] font-extrabold text-sky-700 block">
                                        Requieren impulso o campañas específicas.
                                    </span>
                                </div>

                                {/* PERROS 🐕 */}
                                <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-2">
                                    <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1">
                                        🐕 Perros / Revisión (Baja Rotación)
                                    </span>
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                        {data.top_productos[data.top_productos.length - 1]?.nombre || 'Ninguno'}
                                    </p>
                                    <span className="text-[10px] font-extrabold text-slate-500 block">
                                        Menor rotación. Evaluar liquidación o sustitución.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TABLA PRINCIPAL TOP PRODUCTOS CON BUSCADOR Y CATEGORÍAS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* TABLA DE TOP PRODUCTOS (2 TERCIOS) CON BUSCADOR EN TIEMPO REAL */}
                        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                        <Package size={18} className="text-amber-600" />
                                        <span>Top Productos de Mayor Recaudación</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold">Ordenados por ingresos acumulados en `subtotal`</p>
                                </div>

                                {/* BUSCADOR DE PRODUCTOS Y CATEGORÍAS */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar producto o categoría..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition-all"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-xs font-black text-amber-800 bg-amber-100/80 px-3 py-2 rounded-2xl whitespace-nowrap">
                                        {filteredProducts.length} {filteredProducts.length === 1 ? 'Producto' : 'Productos'}
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                            <th className="py-3 px-3">Producto</th>
                                            <th className="py-3 px-3">Categoría</th>
                                            <th className="py-3 px-3 text-right">Unidades</th>
                                            <th className="py-3 px-3 text-right">Precio Prom.</th>
                                            <th className="py-3 px-3 text-right">Ingresos Totales</th>
                                            <th className="py-3 px-3 text-center">Part. %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                        {filteredProducts.map((p, idx) => (
                                            <tr key={p.producto_id || idx} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="py-3 px-3 font-black text-slate-900 max-w-xs truncate">
                                                    {p.nombre}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                                                        {p.categoria_nombre}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-slate-800">{p.unidades_vendidas} un.</td>
                                                <td className="py-3 px-3 text-right text-slate-500">{formatBs(p.precio_promedio_efectivo)}</td>
                                                <td className="py-3 px-3 text-right font-black text-slate-900">{formatBs(p.ingresos_bs)}</td>
                                                <td className="py-3 px-3 text-center font-extrabold text-amber-700">
                                                    {p.participacion_pct}%
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center text-slate-400 font-bold">
                                                    {searchTerm ? (
                                                        <div className="space-y-1">
                                                            <p className="text-slate-600 font-black">No se encontraron productos que coincidan con "{searchTerm}"</p>
                                                            <p className="text-xs text-slate-400">Intenta buscando por nombre de artículo o por categoría.</p>
                                                        </div>
                                                    ) : (
                                                        <p>No se registraron ventas de productos en el período seleccionado.</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SIDEBAR RESUMEN DE CATEGORÍAS (1 TERCIO) CON TEMA AMBER */}
                        <div className="bg-[#ffffff] rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4 h-fit">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Ventas por Categoría</h3>
                                    <p className="text-xs text-slate-400 font-bold">Participación de ingresos por línea</p>
                                </div>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                                    <Tag size={18} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {data?.categorias.map((c) => (
                                    <div key={c.categoria_id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-black text-slate-900">{c.categoria_nombre}</span>
                                            <span className="font-black text-amber-700">{formatBs(c.ingresos_bs)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                            <span>{c.unidades_vendidas} unidades</span>
                                            <span className="text-orange-700 font-extrabold">{c.participacion_pct}% del total</span>
                                        </div>
                                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(c.participacion_pct, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};
