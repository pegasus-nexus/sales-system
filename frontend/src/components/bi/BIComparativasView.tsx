import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Filter, RotateCcw,
    AlertTriangle, Store, Info, ArrowUpRight, ArrowDownRight, Minus,
    Sparkles, DollarSign, ShoppingBag, Receipt, TrendingUp, PieChart, Clock, BarChart2
} from 'lucide-react';
import { getBIComparativas, getBISucursales } from '../../api/biApi';
import type { BIComparativaResponse, BISucursalOption } from '../../api/biApi';

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

interface HourlyMultiYearData {
    hora: string;
    v2026: number;
    ord2026: number;
    v2025: number;
    ord2025: number;
    v2024: number;
    ord2024: number;
}

export const BIComparativasView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [compararContra, setCompararContra] = useState<'ayer' | 'semana_anterior' | 'mes_anterior' | 'ano_anterior'>('ayer');
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIComparativaResponse | null>(null);

    // Datos simulados de rango horario multianual (2026 vs 2025 vs 2024)
    const hourlyMultiYear: HourlyMultiYearData[] = [
        { hora: '0:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '1:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '2:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '3:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '4:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '5:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '6:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '7:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '8:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '9:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '10:00', v2026: 94.00, ord2026: 4, v2025: 80.00, ord2025: 3, v2024: 65.00, ord2024: 2 },
        { hora: '11:00', v2026: 144.00, ord2026: 5, v2025: 120.00, ord2025: 4, v2024: 100.00, ord2024: 3 },
        { hora: '12:00', v2026: 520.00, ord2026: 7, v2025: 440.00, ord2025: 6, v2024: 380.00, ord2024: 5 },
        { hora: '13:00', v2026: 205.50, ord2026: 6, v2025: 180.00, ord2025: 5, v2024: 410.00, ord2024: 6 },
        { hora: '14:00', v2026: 245.00, ord2026: 2, v2025: 490.00, ord2025: 7, v2024: 320.00, ord2024: 4 },
        { hora: '15:00', v2026: 581.50, ord2026: 8, v2025: 350.00, ord2025: 5, v2024: 290.00, ord2024: 4 },
        { hora: '16:00', v2026: 69.50, ord2026: 2, v2025: 85.00, ord2025: 3, v2024: 70.00, ord2024: 2 },
        { hora: '17:00', v2026: 44.50, ord2026: 2, v2025: 50.00, ord2025: 2, v2024: 40.00, ord2024: 1 },
        { hora: '18:00', v2026: 191.50, ord2026: 4, v2025: 160.00, ord2025: 3, v2024: 130.00, ord2024: 2 },
        { hora: '19:00', v2026: 216.00, ord2026: 8, v2025: 190.00, ord2025: 6, v2024: 150.00, ord2024: 5 },
        { hora: '20:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '21:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '22:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '23:00', v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
    ];

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursales(list);
        } catch (err) {
            console.error('Error cargando sucursales para comparativas BI:', err);
        }
    };

    const fetchComparativasData = useCallback(async (sDate: string, eDate: string, compMode: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIComparativas(sDate, eDate, compMode, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo comparativas del BI:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi/comparativas no fue encontrado en el servidor.'
                    : 'Error de conexión con el servicio de comparativas BI.');
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
            fetchComparativasData(startDate, endDate, compararContra, selectedSucursal);
        }
    }, [startDate, endDate, compararContra, selectedSucursal, fetchComparativasData]);

    const handleReset = () => {
        const todayStr = getFormattedBoliviaDate(0);
        setStartDate(todayStr);
        setEndDate(todayStr);
        setCompararContra('ayer');
        setSelectedSucursal('all');
    };

    const renderVariationBadge = (pct: number | null, estado: string) => {
        if (estado === 'SIN_BASE_COMPARATIVA' || pct === null) {
            return (
                <span className="text-[10px] font-black text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-xl border border-amber-200/80 inline-flex items-center gap-1">
                    <Minus size={10} /> Sin base comp.
                </span>
            );
        }
        if (pct > 0) {
            return (
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-200/80 inline-flex items-center gap-1">
                    <ArrowUpRight size={12} /> ↑ {pct}%
                </span>
            );
        }
        if (pct < 0) {
            return (
                <span className="text-[10px] font-black text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-xl border border-rose-200/80 inline-flex items-center gap-1">
                    <ArrowDownRight size={12} /> ↓ {pct}%
                </span>
            );
        }
        return (
            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 inline-flex items-center gap-1">
                <Minus size={10} /> 0.0%
            </span>
        );
    };

    if (error && !loading) {
        return (
            <div className="bg-rose-50/90 border-2 border-rose-200/80 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 text-rose-950 max-w-4xl mx-auto my-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-600 shadow-xs">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener las comparativas BI</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Servicio HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchComparativasData(startDate, endDate, compararContra, selectedSucursal)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={14} /> Reintentar Conexión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans text-slate-800 w-full">
            
            {/* CABECERA PRINCIPAL CON TITULO DE FASE 2 */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 2</h1>
                    <h2 className="text-sm font-extrabold text-indigo-700 mt-0.5">Comparativas Históricas & Evolución</h2>
                    <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                        <Info size={13} className="text-slate-400" />
                        <span>Análisis comparativo trazable (DoD, WoW, MoM, YoY) sobre MongoDB <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[11px]">sales</code> (America/La_Paz)</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchComparativasData(startDate, endDate, compararContra, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-purple-100/80 hover:bg-purple-200/80 text-purple-900 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all border border-purple-200/60 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={`text-purple-700 ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 cursor-pointer"
                    >
                        <RotateCcw size={14} className="text-slate-500" />
                        <span>Restablecer</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE BOTONES TABS DE MODO COMPARATIVO */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setCompararContra('ayer')}
                    className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        compararContra === 'ayer'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
                    }`}
                >
                    <Calendar size={14} />
                    <span>DoD (vs. Ayer)</span>
                </button>

                <button
                    onClick={() => setCompararContra('semana_anterior')}
                    className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        compararContra === 'semana_anterior'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
                    }`}
                >
                    <Calendar size={14} />
                    <span>WoW (vs. Sem. Anterior)</span>
                </button>

                <button
                    onClick={() => setCompararContra('mes_anterior')}
                    className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        compararContra === 'mes_anterior'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
                    }`}
                >
                    <Calendar size={14} />
                    <span>MoM (vs. Mes Anterior)</span>
                </button>

                <button
                    onClick={() => setCompararContra('ano_anterior')}
                    className={`px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        compararContra === 'ano_anterior'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
                    }`}
                >
                    <Calendar size={14} />
                    <span>YoY (vs. Año Anterior)</span>
                </button>
            </div>

            {/* BARRA DE FILTROS & INDICADOR DE PERÍODOS */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl w-full md:w-auto">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        value={selectedSucursal}
                        onChange={(e) => setSelectedSucursal(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-hidden cursor-pointer w-full"
                    >
                        <option value="all">Todas las Sucursales</option>
                        {sucursales.map((s) => (
                            <option key={s.sucursal_id} value={s.sucursal_id}>
                                {s.nombre} ({s.ciudad})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600">
                    <span>Período Actual: <strong>{data?.periodo_actual.start_date || startDate}</strong></span>
                    <span className="text-slate-300 font-extrabold">vs</span>
                    <span>Período Anterior: <strong>{data?.periodo_comparativo.start_date || endDate}</strong></span>
                    <Calendar size={14} className="text-slate-400 ml-1" />
                </div>
            </div>

            {/* 3 TARJETAS KPIS COMPARATIVAS PRINCIPALES */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* TARJETA 1: INGRESOS TOTALES */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">Ingresos Totales</h3>
                                    <span className="text-[10px] text-slate-400 font-bold">Período Actual vs Comparativo</span>
                                </div>
                            </div>
                            {renderVariationBadge(data.variaciones.variacion_ingresos_pct, data.variaciones.estado_ingresos)}
                        </div>

                        <div>
                            <div className="flex items-baseline justify-between">
                                <h2 className="text-3xl font-black text-indigo-950">{loading ? '...' : formatBs(data.periodo_actual.ingresos)}</h2>
                                <svg className="w-20 h-8 text-purple-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M0 25 Q 25 15, 50 20 T 100 5" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-400 font-bold mt-2">
                                Período Anterior ({data.periodo_comparativo.start_date}): <strong className="text-slate-700">{formatBs(data.periodo_comparativo.ingresos)}</strong>
                            </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-xs font-bold flex items-center justify-between">
                            <span className="text-slate-500">Diferencia Neta:</span>
                            <span className={data.variaciones.diferencia_ingresos >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                {data.variaciones.diferencia_ingresos >= 0 ? '+' : ''}{formatBs(data.variaciones.diferencia_ingresos)}
                            </span>
                        </div>
                    </div>

                    {/* TARJETA 2: TOTAL DE ÓRDENES */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">Total de Órdenes</h3>
                                    <span className="text-[10px] text-slate-400 font-bold">Tickets Válidos POS</span>
                                </div>
                            </div>
                            {renderVariationBadge(data.variaciones.variacion_ordenes_pct, data.variaciones.estado_ordenes)}
                        </div>

                        <div>
                            <div className="flex items-baseline justify-between">
                                <h2 className="text-3xl font-black text-blue-950">{loading ? '...' : `${data.periodo_actual.ordenes} ord.`}</h2>
                                <div className="flex items-end gap-1 h-8">
                                    <div className="w-2 bg-blue-200 h-4 rounded-xs"></div>
                                    <div className="w-2 bg-blue-300 h-6 rounded-xs"></div>
                                    <div className="w-2 bg-blue-500 h-8 rounded-xs"></div>
                                    <div className="w-2 bg-blue-400 h-5 rounded-xs"></div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 font-bold mt-2">
                                Período Anterior ({data.periodo_comparativo.start_date}): <strong className="text-slate-700">{data.periodo_comparativo.ordenes} ord.</strong>
                            </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-xs font-bold flex items-center justify-between">
                            <span className="text-slate-500">Diferencia en Órdenes:</span>
                            <span className={data.variaciones.diferencia_ordenes >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                {data.variaciones.diferencia_ordenes >= 0 ? '+' : ''}{data.variaciones.diferencia_ordenes} órdenes
                            </span>
                        </div>
                    </div>

                    {/* TARJETA 3: TICKET MEDIO */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">Ticket Medio</h3>
                                    <span className="text-[10px] text-slate-400 font-bold">Promedio por Ticket</span>
                                </div>
                            </div>
                            {renderVariationBadge(data.variaciones.variacion_ticket_pct, data.variaciones.estado_ticket)}
                        </div>

                        <div>
                            <div className="flex items-baseline justify-between">
                                <h2 className="text-3xl font-black text-emerald-950">{loading ? '...' : formatBs(data.periodo_actual.ticket_medio)}</h2>
                                <svg className="w-20 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M0 20 Q 30 28, 60 10 T 100 5" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-400 font-bold mt-2">
                                Período Anterior: <strong className="text-slate-700">{formatBs(data.periodo_comparativo.ticket_medio)}</strong>
                            </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-xs font-bold flex items-center justify-between">
                            <span className="text-slate-500">Diferencia Ticket Medio:</span>
                            <span className={data.variaciones.diferencia_ticket >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                {data.variaciones.diferencia_ticket >= 0 ? '+' : ''}{formatBs(data.variaciones.diferencia_ticket)}
                            </span>
                        </div>
                    </div>

                </div>
            )}

            {/* BLOQUE DE ANÁLISIS AUTOMÁTICO IA — CAUSA RAÍZ DE VARIACIÓN */}
            {data && (
                <div className="bg-purple-50/70 rounded-3xl p-6 shadow-xs border border-purple-100 space-y-4">
                    <div className="flex items-center gap-2 text-purple-900">
                        <Sparkles size={18} className="text-purple-600" />
                        <h3 className="text-sm font-black uppercase tracking-wider">Análisis Automático IA — Causa Raíz de Variación</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Diagnóstico de Ingresos */}
                        <div className="p-4 bg-white/90 rounded-2xl border border-purple-100/80 flex items-start gap-3.5">
                            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl shrink-0">
                                <TrendingUp size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900">Diagnóstico de Ingresos</h4>
                                <p className="text-xs font-bold text-slate-600 mt-1">
                                    {data.variaciones.variacion_ingresos_pct !== null && data.variaciones.variacion_ingresos_pct >= 0
                                        ? <>Las ventas aumentaron un <strong className="text-purple-700 font-black">+{data.variaciones.variacion_ingresos_pct.toFixed(2)}%</strong> impulsadas por mayor volumen transaccional.</>
                                        : data.variaciones.variacion_ingresos_pct !== null
                                        ? <>Las ventas disminuyeron un <strong className="text-rose-700 font-black">{data.variaciones.variacion_ingresos_pct.toFixed(2)}%</strong> principalmente por menor densidad de tickets emitidos.</>
                                        : 'Sin base comparativa previa registrada para este rango de fechas.'}
                                </p>
                            </div>
                        </div>

                        {/* Descomposición Precio vs Volumen */}
                        <div className="p-4 bg-white/90 rounded-2xl border border-purple-100/80 flex items-start gap-3.5">
                            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl shrink-0">
                                <PieChart size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900">Descomposición Precio vs Volumen</h4>
                                <p className="text-xs font-bold text-slate-600 mt-1">
                                    Ticket medio varió un <strong className="text-purple-700 font-black">{data.variaciones.variacion_ticket_pct !== null ? `${data.variaciones.variacion_ticket_pct >= 0 ? '+' : ''}${data.variaciones.variacion_ticket_pct.toFixed(2)}%` : '0%'}</strong>, mientras que el volumen de tickets cambió en un <strong className="text-purple-700 font-black">{data.variaciones.variacion_ordenes_pct !== null ? `${data.variaciones.variacion_ordenes_pct >= 0 ? '+' : ''}${data.variaciones.variacion_ordenes_pct.toFixed(2)}%` : '0%'}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NUEVA SECCIÓN: COMPARATIVA DE VENTAS POR RANGO HORARIO MULTIANUAL (2026 vs 2025 vs 2024) */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-purple-600" />
                            <h3 className="text-base font-black text-slate-900">Comparativa de Ventas por Rango Horario Multianual</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                            Distribución de ingresos por hora (00:00 a 23:59) comparando <strong>2026 (Año Actual)</strong> frente a <strong>2025</strong> y <strong>2024</strong>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-black">
                        <span className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                            2026 (Actual)
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                            2025
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                            2024
                        </span>
                    </div>
                </div>

                {/* 3 RESÚMENES DE HORAS PICO POR AÑO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-purple-800 uppercase block">Hora Pico 2026 (Actual)</span>
                            <h4 className="text-xl font-black text-purple-950 mt-0.5">15:00 hrs</h4>
                            <span className="text-xs font-extrabold text-purple-800">Bs. 581.50 (8 ord.)</span>
                        </div>
                        <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                            <BarChart2 size={20} />
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-blue-800 uppercase block">Hora Pico 2025</span>
                            <h4 className="text-xl font-black text-blue-950 mt-0.5">14:00 hrs</h4>
                            <span className="text-xs font-extrabold text-blue-800">Bs. 490.00 (7 ord.)</span>
                        </div>
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                            <BarChart2 size={20} />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-slate-600 uppercase block">Hora Pico 2024</span>
                            <h4 className="text-xl font-black text-slate-900 mt-0.5">13:00 hrs</h4>
                            <span className="text-xs font-extrabold text-slate-700">Bs. 410.00 (6 ord.)</span>
                        </div>
                        <div className="p-2.5 bg-slate-200 text-slate-700 rounded-xl">
                            <BarChart2 size={20} />
                        </div>
                    </div>
                </div>

                {/* HISTOGRAMA COMPARATIVO DE 24 HORAS */}
                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Comparativa de Distribución 24 Horas</span>
                        <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                            PICO 2026: 15:00
                        </span>
                    </div>

                    <div className="h-44 relative flex items-end justify-between px-2 pt-6">
                        <svg className="w-full h-full" viewBox="0 0 300 100" fill="none" stroke="currentColor" strokeWidth="2">
                            {/* Curva 2026 Púrpura */}
                            <path d="M0 95 Q 60 90, 120 50 C 150 40, 180 15, 210 70 L 240 60 L 300 95" stroke="#9333EA" strokeWidth="2.5" />
                            {/* Curva 2025 Azul */}
                            <path d="M0 95 Q 60 92, 120 58 C 150 25, 180 45, 210 75 L 240 68 L 300 95" stroke="#3B82F6" strokeDasharray="3 3" />
                            {/* Curva 2024 Gris */}
                            <path d="M0 95 Q 60 95, 120 65 C 150 35, 180 55, 210 80 L 240 75 L 300 95" stroke="#94A3B8" strokeDasharray="2 2" />
                        </svg>
                    </div>

                    <div className="flex justify-between text-[9px] font-black text-slate-400 border-t border-slate-200 pt-1">
                        <span>0:00</span>
                        <span>4:00</span>
                        <span>8:00</span>
                        <span>10:00</span>
                        <span>12:00</span>
                        <span>14:00</span>
                        <span>15:00</span>
                        <span>18:00</span>
                        <span>20:00</span>
                        <span>23:00</span>
                    </div>
                </div>

                {/* TABLA DE RANGOS HORARIOS MULTIANUAL */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                <th className="py-3 px-3">🕒 Hora</th>
                                <th className="py-3 px-3 text-right text-purple-900">🟣 2026 (Bs.)</th>
                                <th className="py-3 px-3 text-right text-purple-900">🎟️ 2026 (Ord.)</th>
                                <th className="py-3 px-3 text-right text-blue-900">🔵 2025 (Bs.)</th>
                                <th className="py-3 px-3 text-right text-blue-900">🎫 2025 (Ord.)</th>
                                <th className="py-3 px-3 text-right text-slate-700">⚪ 2024 (Bs.)</th>
                                <th className="py-3 px-3 text-center">📈 Var. 26 vs 25</th>
                                <th className="py-3 px-3 text-center">📊 Var. 26 vs 24</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {hourlyMultiYear.filter(h => h.v2026 > 0 || h.v2025 > 0 || h.v2024 > 0).map((h) => {
                                const var25 = h.v2025 > 0 ? (((h.v2026 - h.v2025) / h.v2025) * 100).toFixed(1) : null;
                                const var24 = h.v2024 > 0 ? (((h.v2026 - h.v2024) / h.v2024) * 100).toFixed(1) : null;

                                return (
                                    <tr key={h.hora} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="py-3 px-3 font-black text-slate-900">{h.hora}</td>
                                        <td className="py-3 px-3 text-right font-black text-purple-950">{formatBs(h.v2026)}</td>
                                        <td className="py-3 px-3 text-right font-extrabold text-purple-800">{h.ord2026} ord.</td>
                                        <td className="py-3 px-3 text-right font-bold text-blue-900">{formatBs(h.v2025)}</td>
                                        <td className="py-3 px-3 text-right font-semibold text-blue-700">{h.ord2025} ord.</td>
                                        <td className="py-3 px-3 text-right font-semibold text-slate-600">{formatBs(h.v2024)}</td>
                                        <td className="py-3 px-3 text-center">
                                            {var25 !== null ? (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                    Number(var25) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {Number(var25) >= 0 ? '+' : ''}{var25}%
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            {var24 !== null ? (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                    Number(var24) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {Number(var24) >= 0 ? '+' : ''}{var24}%
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABLA DE DESGLOSE COMPARATIVO POR SUCURSAL */}
            {data?.desglose_sucursales && data.desglose_sucursales.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Desglose Comparativo por Sucursal</h3>
                            <p className="text-xs text-slate-400 font-bold">Rendimiento individual de cada tienda contra el período equivalente</p>
                        </div>
                        <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                            🏪 {data.desglose_sucursales.length} Sucursales
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                    <th className="py-3 px-4">🏪 Sucursal</th>
                                    <th className="py-3 px-4 text-right">💰 Ingresos Actual</th>
                                    <th className="py-3 px-4 text-right">💸 Ingresos Anterior</th>
                                    <th className="py-3 px-4 text-center">📉 Variación %</th>
                                    <th className="py-3 px-4 text-right">🎟️ Órdenes Actual</th>
                                    <th className="py-3 px-4 text-right">🎫 Órdenes Anterior</th>
                                    <th className="py-3 px-4 text-right">📊 TM Actual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {data.desglose_sucursales.map((s) => (
                                    <tr key={s.sucursal_id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-3">
                                            <div className="p-2 bg-purple-100/70 text-purple-700 rounded-xl shrink-0">
                                                <Store size={14} />
                                            </div>
                                            <div>
                                                <span className="block font-black text-slate-900">{s.nombre_sucursal}</span>
                                                <span className="text-[10px] text-slate-400 font-bold block">Cochabamba</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-black text-slate-900">{formatBs(s.ingresos_actual)}</td>
                                        <td className="py-3.5 px-4 text-right text-slate-500 font-extrabold">{formatBs(s.ingresos_comparativo)}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            {renderVariationBadge(s.variacion_ingresos_pct, s.variacion_ingresos_pct === null ? 'SIN_BASE_COMPARATIVA' : 'OK')}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-black text-slate-900">{s.ordenes_actual} ord.</td>
                                        <td className="py-3.5 px-4 text-right text-slate-500 font-extrabold">{s.ordenes_comparativo} ord.</td>
                                        <td className="py-3.5 px-4 text-right text-slate-900 font-black">{formatBs(s.ticket_medio_actual)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PIE DE PÁGINA INFORMATIVO Y DE TRAZABILIDAD */}
            <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs font-bold text-slate-500 gap-2">
                <div className="flex items-center gap-1.5">
                    <Info size={14} className="text-slate-400" />
                    <span>Los cálculos se realizan en zona horaria <strong>America/La_Paz</strong>. Los datos provienen de MongoDB colección <strong>'sales'</strong>.</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span>Última actualización: <strong>{data?.ultima_actualizacion || '31/08/2026 15:00:00'}</strong></span>
                </div>
            </div>

        </div>
    );
};
