import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Calendar, RefreshCw, Filter, Maximize2, RotateCcw, AlertTriangle,
    Crown, DollarSign, Boxes, Tag, UserCheck, Building2, Info, PieChart
} from 'lucide-react';
import { getBIEjecutivoResumen, getBISucursales } from '../../api/biApi';
import type { BIEjecutivoResumenResponse, BISucursalOption } from '../../api/biApi';
import { BIStateBanner } from './common/BIStateBanner';

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

export const BIEjecutivoView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Sequence Guard & Request Cancellation Refs
    const requestIdRef = useRef<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => ({
        startDate: getFormattedBoliviaDate(0),
        endDate: getFormattedBoliviaDate(0)
    }));
    const { startDate, endDate } = dateRange;

    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursalesOptions, setSucursalesOptions] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIEjecutivoResumenResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursalesOptions(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchEjecutivoData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const currentRequestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);
        try {
            const res = await getBIEjecutivoResumen(sDate, eDate, sucId, { signal: controller.signal });

            if (currentRequestId !== requestIdRef.current) {
                return;
            }

            setData(res);
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            if (currentRequestId === requestIdRef.current) {
                console.error('Error obteniendo resumen ejecutivo global:', err);
                const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
                const status = axiosErr?.response?.status;
                const msg = axiosErr?.response?.data?.detail
                    || (status === 404
                        ? 'HTTP 404: El endpoint /api/v1/bi-ejecutivo/resumen no fue encontrado.'
                        : 'Error de conexión con el servicio de resumen ejecutivo del BI.');
                setError(msg);
                setData(null);
            }
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadSucursales();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchEjecutivoData(dateRange.startDate, dateRange.endDate, selectedSucursal);
        }
    }, [dateRange, selectedSucursal, fetchEjecutivoData]);

    const handleReset = () => {
        const todayStr = getFormattedBoliviaDate(0);
        setDateRange({ startDate: todayStr, endDate: todayStr });
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
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener el resumen ejecutivo global</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchEjecutivoData(startDate, endDate, selectedSucursal)}
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
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Crown size={14} className="text-amber-400" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 10 (CÚSPIDE EJECUTIVA)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Resumen Ejecutivo Global</h1>
                    <p className="text-xs text-indigo-200 font-semibold mt-1">
                        Modelo Estrella (`CONSOLIDATED_EXECUTIVE_SUMMARY`) sobre MongoDB (<span className="text-amber-300 font-black bg-white/10 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchEjecutivoData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-white/20 shadow-xs"
                    >
                        <RotateCcw size={14} className="text-indigo-200" />
                        <span>Restablecer</span>
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-white/20 shadow-xs"
                    >
                        <Maximize2 size={14} className="text-indigo-200" />
                    </button>
                </div>
            </div>

            {/* BARRA TRANSPARENTE SOBRE EBITDA, KARDEX Y PRONÓSTICOS NO DISPONIBLES */}
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 text-slate-700 text-xs font-bold shadow-xs">
                <Info size={18} className="text-indigo-600 shrink-0" />
                <span>
                    <strong>EBITDA, Gastos Operativos, Rotación Kardex & Pronósticos IA:</strong> Declarados oficiales como <span className="bg-slate-200 px-2 py-0.5 rounded-md font-black text-slate-800">NO DISPONIBLES</span> al no existir libros de egresos fijos, kardex continuo ni modelos predictivos en MongoDB.
                </span>
            </div>

            {/* CONTROLES DE FILTRADO */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                const val = e.target.value;
                                setDateRange(prev => ({ ...prev, startDate: val }));
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        />
                        <span className="text-slate-400 font-bold text-xs">a</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                const val = e.target.value;
                                setDateRange(prev => ({ ...prev, endDate: val }));
                            }}
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
                            {sucursalesOptions.map((s) => (
                                <option key={s.sucursal_id} value={s.sucursal_id}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {data && (
                    <div className="text-xs font-bold text-slate-500">
                        <span>Última Sincronización POS: <strong className="text-indigo-600">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* BLOCK PRINCIPAL DE KPIs CONSOLIDADOS */}
            {data && (
                <div className="space-y-4">
                    
                    {/* BLOQUE 1: VENTAS, COSTO DIRECTO Y MARGEN BRUTO */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/40 to-white rounded-3xl p-5 shadow-xs border border-indigo-100">
                            <div className="flex justify-between items-start pb-2 border-b border-indigo-100/60">
                                <span className="text-xs font-black uppercase text-indigo-950">Ingresos Totales (Ventas)</span>
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl">
                                    <DollarSign size={18} />
                                </div>
                            </div>
                            <div className="my-3">
                                <h2 className="text-3xl font-black text-slate-900 leading-none">
                                    {formatBs(data.kpis.ingresos_totales)}
                                </h2>
                                <p className="text-xs font-extrabold text-indigo-700 mt-1">
                                    {data.kpis.total_tickets} tickets | Ticket medio: {formatBs(data.kpis.ticket_medio)}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">SUM(sales.total)</span>
                        </div>

                        <div className="bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white rounded-3xl p-5 shadow-xs border border-rose-100">
                            <div className="flex justify-between items-start pb-2 border-b border-rose-100/60">
                                <span className="text-xs font-black uppercase text-rose-950">Costo Directo Total</span>
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-2xl">
                                    <PieChart size={18} />
                                </div>
                            </div>
                            <div className="my-3">
                                <h2 className="text-3xl font-black text-slate-900 leading-none">
                                    {formatBs(data.kpis.costo_directo_total)}
                                </h2>
                                <p className="text-xs font-extrabold text-rose-700 mt-1">
                                    Costo directo de productos vendidos
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">SUM(items.cantidad * products.costo)</span>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100">
                            <div className="flex justify-between items-start pb-2 border-b border-emerald-100/60">
                                <span className="text-xs font-black uppercase text-emerald-950">Margen Bruto Teórico</span>
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-2xl">
                                    <Crown size={18} />
                                </div>
                            </div>
                            <div className="my-3">
                                <h2 className="text-3xl font-black text-slate-900 leading-none">
                                    {formatBs(data.kpis.margen_bruto_teorico_bs)}
                                </h2>
                                <p className="text-xs font-extrabold text-emerald-700 mt-1">
                                    {data.kpis.margen_bruto_teorico_pct}% margen bruto
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Ingresos Totales - Costo Directo</span>
                        </div>
                    </div>

                    {/* BLOQUE 2: STOCK, PROMOCIONES Y LÍDERES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                                <span className="text-xs font-black uppercase text-purple-900">Valorización Stock</span>
                                <Boxes size={18} className="text-purple-600" />
                            </div>
                            <div className="my-3">
                                <h3 className="text-2xl font-black text-slate-900">
                                    {formatBs(data.kpis.valorizacion_costo_stock)}
                                </h3>
                                <p className="text-xs font-extrabold text-purple-700 mt-1">
                                    {data.kpis.total_unidades_stock.toLocaleString('en-US')} unidades en stock
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                                <span className="text-xs font-black uppercase text-orange-900">Descuentos Concedidos</span>
                                <Tag size={18} className="text-orange-600" />
                            </div>
                            <div className="my-3">
                                <h3 className="text-2xl font-black text-slate-900">
                                    {formatBs(data.kpis.monto_total_descuentos)}
                                </h3>
                                <p className="text-xs font-extrabold text-orange-700 mt-1">
                                    {data.kpis.tickets_con_descuento} tickets | {data.kpis.promociones_configuradas} promociones activas
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                                <span className="text-xs font-black uppercase text-blue-900">Sucursal Líder</span>
                                <Building2 size={18} className="text-blue-600" />
                            </div>
                            <div className="my-3">
                                <h3 className="text-lg font-black text-slate-900 line-clamp-1">
                                    {data.kpis.sucursal_lider_nombre}
                                </h3>
                                <p className="text-xs font-extrabold text-blue-700 mt-1">
                                    {formatBs(data.kpis.sucursal_lider_ingresos)} cobrados
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                                <span className="text-xs font-black uppercase text-violet-900">Cajero Líder</span>
                                <UserCheck size={18} className="text-violet-600" />
                            </div>
                            <div className="my-3">
                                <h3 className="text-lg font-black text-slate-900 line-clamp-1">
                                    {data.kpis.cajero_lider_nombre}
                                </h3>
                                <p className="text-xs font-extrabold text-violet-700 mt-1">
                                    {formatBs(data.kpis.cajero_lider_ingresos)} en caja
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* TABLA PRINCIPAL DESGLOSE CONSOLIDADO POR SUCURSAL */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Consolidado por Sucursal</h3>
                        <p className="text-xs text-slate-400 font-bold">Ventas, tickets y participación de mercado en tiempo real</p>
                    </div>
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                        {data?.sucursales.length || 0} Sucursales
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                <th className="py-3 px-3">Nombre Sucursal</th>
                                <th className="py-3 px-3 text-right">Tickets Emitidos</th>
                                <th className="py-3 px-3 text-right">Ingresos Facturados</th>
                                <th className="py-3 px-3 text-right">Participación %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {data?.sucursales.map((s, idx) => (
                                <tr key={s.sucursal_id || idx} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="py-3.5 px-3 font-black text-slate-900">
                                        {s.nombre}
                                    </td>
                                    <td className="py-3.5 px-3 text-right text-slate-800">{s.tickets_conteo} tks</td>
                                    <td className="py-3.5 px-3 text-right font-black text-slate-900">{formatBs(s.ingresos_bs)}</td>
                                    <td className="py-3.5 px-3 text-right font-extrabold text-indigo-700">{s.participacion_pct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AVISO DE MÉTRICAS NO IMPLEMENTADAS (EBITDA / IA / ML) */}
            <BIStateBanner
                type="FEATURE_COMING_SOON"
                title="Métricas Financieras de Egresos Fijos & Modelos Predictivos de IA"
                message="Las métricas de EBITDA (gastos fijos operativos), Kardex continuo y pronósticos de Inteligencia Artificial están etiquetadas explícitamente como NO DISPONIBLES en MongoDB y se activarán en fases posteriores sin simular estimaciones ficticias."
            />

        </div>
    );
};
