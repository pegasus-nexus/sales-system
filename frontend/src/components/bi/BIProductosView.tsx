import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Layers, Filter,
    Maximize2, RotateCcw, AlertTriangle, Tag, Package, ShoppingBag, DollarSign
} from 'lucide-react';
import { getBIProductos, getBISucursales } from '../../api/biApi';
import type { BIProductosResponse, BISucursalOption } from '../../api/biApi';

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

export const BIProductosView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIProductosResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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
    };

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

    if (error && !loading) {
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

    return (
        <div className={`min-h-screen bg-[#f8f9fd] p-1 sm:p-2 space-y-6 font-sans text-slate-800 w-full ${isFullscreen ? 'p-8' : ''}`}>
            
            {/* CABECERA ESTILO PASTEL */}
            <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/90 rounded-3xl p-6 shadow-sm border border-indigo-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Layers size={14} className="text-indigo-600" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 3</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Rendimiento de Productos & Categorías</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Modelo Estrella (`FACT_SALES_ITEMS`) sobre MongoDB `sales.items[]` (<span className="text-emerald-700 font-black bg-emerald-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchProductosData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
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

            {/* CONTROLES DE FILTRADO */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
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

                {data && (
                    <div className="text-xs font-bold text-slate-500">
                        <span>Última Sincronización POS: <strong className="text-indigo-700">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* TARJETAS KPIS PRINCIPALES */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* KPI 1: PRODUCTO MÁS VENDIDO */}
                    <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white rounded-3xl p-5 shadow-xs border border-indigo-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-indigo-100/60">
                            <span className="text-xs font-black uppercase text-indigo-950">Más Vendido (Volumen)</span>
                            <div className="p-2 bg-indigo-100/70 text-indigo-600 rounded-2xl">
                                <Package size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight">
                                {data.kpis.producto_mas_vendido}
                            </h2>
                            <p className="text-xs font-extrabold text-indigo-700 mt-1">
                                {data.kpis.unidades_producto_mas_vendido} unidades vendidas
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(items.cantidad)</span>
                    </div>

                    {/* KPI 2: PRODUCTO MAYOR RECAUDACIÓN */}
                    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-emerald-100/60">
                            <span className="text-xs font-black uppercase text-emerald-950">Mayor Recaudación</span>
                            <div className="p-2 bg-emerald-100/70 text-emerald-600 rounded-2xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight">
                                {data.kpis.producto_mayor_recaudacion}
                            </h2>
                            <p className="text-xs font-extrabold text-emerald-700 mt-1">
                                {formatBs(data.kpis.ingresos_producto_mayor_recaudacion)}
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">MAX(SUM(items.subtotal))</span>
                    </div>

                    {/* KPI 3: SKUS DISTINTOS */}
                    <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white rounded-3xl p-5 shadow-xs border border-blue-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-blue-100/60">
                            <span className="text-xs font-black uppercase text-blue-950">SKUs Activos Vendidos</span>
                            <div className="p-2 bg-blue-100/70 text-blue-600 rounded-2xl">
                                <Tag size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {data.kpis.skus_distintos}
                            </h2>
                            <p className="text-xs font-extrabold text-blue-700 mt-1">
                                Productos distintos en el período
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">COUNT(DISTINCT producto_id)</span>
                    </div>

                    {/* KPI 4: UNIDADES PROMEDIO POR TICKET */}
                    <div className="bg-gradient-to-br from-purple-50/90 via-violet-50/40 to-white rounded-3xl p-5 shadow-xs border border-purple-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-purple-100/60">
                            <span className="text-xs font-black uppercase text-purple-950">Unidades / Ticket</span>
                            <div className="p-2 bg-purple-100/70 text-purple-600 rounded-2xl">
                                <ShoppingBag size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {data.kpis.unidades_promedio_por_ticket}
                            </h2>
                            <p className="text-xs font-extrabold text-purple-700 mt-1">
                                Promedio de ítems por compra
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(items.cantidad) / Tickets</span>
                    </div>

                </div>
            )}

            {/* MATRIZ BCG Y DIAGNÓSTICO IA DE PRODUCTOS */}
            {data && data.top_productos && data.top_productos.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <span>Matriz BCG & Diagnóstico IA de Catálogo</span>
                            </h3>
                            <p className="text-xs text-slate-400 font-bold">Clasificación estratégica por volumen de venta y participación</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* ESTRELLAS ⭐ */}
                        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-amber-950 uppercase flex items-center gap-1">
                                    ⭐ Estrellas (Alta Venta / Crecimiento)
                                </span>
                            </div>
                            <p className="text-xs font-bold text-amber-900 truncate">
                                {data.top_productos[0]?.nombre || 'Sin datos'}
                            </p>
                            <span className="text-[10px] font-extrabold text-amber-700 block">
                                Impulsan el {data.top_productos[0]?.participacion_pct || 0}% de la recaudación.
                            </span>
                        </div>

                        {/* VACAS 🐄 */}
                        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1">
                                    🐄 Vacas Lecheras (Alta Venta / Flujo)
                                </span>
                            </div>
                            <p className="text-xs font-bold text-emerald-900 truncate">
                                {data.top_productos[1]?.nombre || data.top_productos[0]?.nombre || 'Sin datos'}
                            </p>
                            <span className="text-[10px] font-extrabold text-emerald-700 block">
                                Generación constante de flujo de caja.
                            </span>
                        </div>

                        {/* INTERROGANTES ❓ */}
                        <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-blue-950 uppercase flex items-center gap-1">
                                    ❓ Interrogantes (Potencial)
                                </span>
                            </div>
                            <p className="text-xs font-bold text-blue-900 truncate">
                                {data.top_productos[2]?.nombre || 'En evaluación'}
                            </p>
                            <span className="text-[10px] font-extrabold text-blue-700 block">
                                Requieren impulso o campañas específicas.
                            </span>
                        </div>

                        {/* PERROS 🐕 */}
                        <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1">
                                    🐕 Perros / Revisión (Baja Rotación)
                                </span>
                            </div>
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

            {/* TABLA PRINCIPAL TOP PRODUCTOS Y CATEGORÍAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* TABLA DE TOP PRODUCTOS (2 TERCIOS) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Top Productos de Mayor Recaudación</h3>
                            <p className="text-xs text-slate-400 font-bold">Ordenados por ingresos acumulados en `subtotal`</p>
                        </div>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                            {data?.top_productos.length || 0} Productos
                        </span>
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
                                {data?.top_productos.map((p, idx) => (
                                    <tr key={p.producto_id || idx} className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-3 px-3 font-black text-slate-900 max-w-xs truncate">
                                            {p.nombre}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                                {p.categoria_nombre}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-800">{p.unidades_vendidas} un.</td>
                                        <td className="py-3 px-3 text-right text-slate-500">{formatBs(p.precio_promedio_efectivo)}</td>
                                        <td className="py-3 px-3 text-right font-black text-slate-900">{formatBs(p.ingresos_bs)}</td>
                                        <td className="py-3 px-3 text-center font-extrabold text-emerald-700">
                                            {p.participacion_pct}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SIDEBAR RESUMEN DE CATEGORÍAS (1 TERCIO) */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4 h-fit">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Ventas por Categoría</h3>
                            <p className="text-xs text-slate-400 font-bold">Participación de ingresos por línea</p>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-2xl">
                            <Tag size={18} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data?.categorias.map((c) => (
                            <div key={c.categoria_id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-900">{c.categoria_nombre}</span>
                                    <span className="font-black text-indigo-700">{formatBs(c.ingresos_bs)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                    <span>{c.unidades_vendidas} unidades</span>
                                    <span className="text-emerald-700 font-extrabold">{c.participacion_pct}% del total</span>
                                </div>
                                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(c.participacion_pct, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
};
