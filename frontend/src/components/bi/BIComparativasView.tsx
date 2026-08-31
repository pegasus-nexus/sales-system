import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Layers,
    Filter, Maximize2, RotateCcw,
    AlertTriangle, Store, Info, ArrowUpRight, ArrowDownRight, Minus
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

export const BIComparativasView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [compararContra, setCompararContra] = useState<'ayer' | 'semana_anterior' | 'mes_anterior' | 'ano_anterior'>('ayer');
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIComparativaResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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

    const renderVariationBadge = (pct: number | null, estado: string) => {
        if (estado === 'SIN_BASE_COMPARATIVA' || pct === null) {
            return (
                <span className="text-[10px] font-black text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-200/80 inline-flex items-center gap-1">
                    <Info size={10} /> Sin base comp.
                </span>
            );
        }
        if (pct > 0) {
            return (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-200/80 inline-flex items-center gap-1">
                    <ArrowUpRight size={12} /> +{pct}%
                </span>
            );
        }
        if (pct < 0) {
            return (
                <span className="text-[10px] font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-lg border border-rose-200/80 inline-flex items-center gap-1">
                    <ArrowDownRight size={12} /> {pct}%
                </span>
            );
        }
        return (
            <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 inline-flex items-center gap-1">
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
        <div className={`min-h-screen bg-[#f8f9fd] p-1 sm:p-2 space-y-6 font-sans text-slate-800 w-full ${isFullscreen ? 'p-8' : ''}`}>
            
            {/* CABECERA ESTILO PASTEL */}
            <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/90 rounded-3xl p-6 shadow-sm border border-indigo-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Layers size={14} className="text-indigo-600" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 2</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Comparativas Históricas & Evolución</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Análisis comparativo trazable (DoD, WoW, MoM, YoY) sobre MongoDB `sales` (<span className="text-emerald-700 font-black bg-emerald-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchComparativasData(startDate, endDate, compararContra, selectedSucursal)}
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

            {/* BARRA DE CONTROLES DE COMPARACIÓN */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                
                {/* Selector de Modo Comparativo */}
                <div className="flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl overflow-x-auto">
                    <button
                        onClick={() => setCompararContra('ayer')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            compararContra === 'ayer' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        DoD (vs. Ayer)
                    </button>
                    <button
                        onClick={() => setCompararContra('semana_anterior')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            compararContra === 'semana_anterior' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        WoW (vs. Sem. Anterior)
                    </button>
                    <button
                        onClick={() => setCompararContra('mes_anterior')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            compararContra === 'mes_anterior' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        MoM (vs. Mes Anterior)
                    </button>
                    <button
                        onClick={() => setCompararContra('ano_anterior')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            compararContra === 'ano_anterior' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100'
                        }`}
                    >
                        YoY (vs. Año Anterior)
                    </button>
                </div>

                {/* Selectores de Fechas y Sucursal */}
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
            </div>

            {/* TARJETAS COMPARATIVAS (PERÍODO ACTUAL VS PERÍODO ANTERIOR) */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* TARJETA 1: INGRESOS COMPARATIVOS */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-indigo-100 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-indigo-950 block">Ingresos Totales</span>
                                <span className="text-[10px] text-slate-400 font-semibold">Período Actual vs Comparativo</span>
                            </div>
                            {renderVariationBadge(data.variaciones.variacion_ingresos_pct, data.variaciones.estado_ingresos)}
                        </div>

                        <div className="space-y-2">
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400">PERÍODO ACTUAL ({data.periodo_actual.start_date})</span>
                                <h2 className="text-2xl font-black text-slate-900">{formatBs(data.periodo_actual.ingresos)}</h2>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
                                <span>Período Anterior ({data.periodo_comparativo.start_date}):</span>
                                <span className="text-slate-800 font-black">{formatBs(data.periodo_comparativo.ingresos)}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-600 flex justify-between items-center">
                            <span>Diferencia Neta:</span>
                            <span className={data.variaciones.diferencia_ingresos >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                {data.variaciones.diferencia_ingresos >= 0 ? '+' : ''}{formatBs(data.variaciones.diferencia_ingresos)}
                            </span>
                        </div>
                    </div>

                    {/* TARJETA 2: ÓRDENES COMPARATIVAS */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-blue-100 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-blue-950 block">Total de Órdenes</span>
                                <span className="text-[10px] text-slate-400 font-semibold">Tickets Válidos POS</span>
                            </div>
                            {renderVariationBadge(data.variaciones.variacion_ordenes_pct, data.variaciones.estado_ordenes)}
                        </div>

                        <div className="space-y-2">
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400">PERÍODO ACTUAL ({data.periodo_actual.start_date})</span>
                                <h2 className="text-2xl font-black text-slate-900">{data.periodo_actual.ordenes} ord.</h2>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
                                <span>Período Anterior ({data.periodo_comparativo.start_date}):</span>
                                <span className="text-slate-800 font-black">{data.periodo_comparativo.ordenes} ord.</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-600 flex justify-between items-center">
                            <span>Diferencia en Órdenes:</span>
                            <span className={data.variaciones.diferencia_ordenes >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                {data.variaciones.diferencia_ordenes >= 0 ? '+' : ''}{data.variaciones.diferencia_ordenes} órdenes
                            </span>
                        </div>
                    </div>

                    {/* TARJETA 3: TICKET MEDIO COMPARATIVO */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-emerald-100 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block">Ticket Medio</span>
                                <span className="text-[10px] text-slate-400 font-semibold">Promedio por Ticket</span>
                            </div>
                            {renderVariationBadge(data.variaciones.variacion_ticket_pct, data.variaciones.estado_ticket)}
                        </div>

                        <div className="space-y-2">
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400">PERÍODO ACTUAL</span>
                                <h2 className="text-2xl font-black text-slate-900">{formatBs(data.periodo_actual.ticket_medio)}</h2>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
                                <span>Período Anterior:</span>
                                <span className="text-slate-800 font-black">{formatBs(data.periodo_comparativo.ticket_medio)}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-600 flex justify-between items-center">
                            <span>Diferencia Ticket Medio:</span>
                            <span className={data.variaciones.diferencia_ticket >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                {data.variaciones.diferencia_ticket >= 0 ? '+' : ''}{formatBs(data.variaciones.diferencia_ticket)}
                            </span>
                        </div>
                    </div>

                </div>
            )}

            {/* BLOQUE DE ANÁLISIS AUTOMÁTICO EXPLICATIVO CON IA */}
            {data && (
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md border border-indigo-800/60 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-600/50 rounded-xl text-amber-300 border border-indigo-400/30">
                            <Info size={18} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300">Análisis Automático IA — Causa Raíz de Variación</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-200">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                            <span className="text-[10px] font-black uppercase text-amber-300 block">Diagnóstico de Ingresos</span>
                            <p className="text-sm font-bold text-white">
                                {data.variaciones.variacion_ingresos_pct !== null && data.variaciones.variacion_ingresos_pct >= 0
                                    ? `Las ventas aumentaron un +${data.variaciones.variacion_ingresos_pct.toFixed(2)}% impulsadas por mayor volumen transaccional.`
                                    : data.variaciones.variacion_ingresos_pct !== null
                                    ? `Las ventas disminuyeron un ${data.variaciones.variacion_ingresos_pct.toFixed(2)}% principalmente por menor densidad de tickets emitidos.`
                                    : 'Sin base comparativa previa registrada para este rango de fechas.'}
                            </p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-300 block">Descomposición Precio vs Volumen</span>
                            <p className="text-xs text-slate-200">
                                Ticket medio varió un <strong>{data.variaciones.variacion_ticket_pct !== null ? `${data.variaciones.variacion_ticket_pct >= 0 ? '+' : ''}${data.variaciones.variacion_ticket_pct.toFixed(2)}%` : '0%'}</strong>, mientras que el volumen de tickets cambió en un <strong>{data.variaciones.variacion_ordenes_pct !== null ? `${data.variaciones.variacion_ordenes_pct >= 0 ? '+' : ''}${data.variaciones.variacion_ordenes_pct.toFixed(2)}%` : '0%'}</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA DE DESGLOSE POR SUCURSAL COMPARATIVA */}
            {data?.desglose_sucursales && data.desglose_sucursales.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Desglose Comparativo por Sucursal</h3>
                            <p className="text-xs text-slate-400 font-bold">Rendimiento individual de cada tienda contra el período equivalente</p>
                        </div>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                            {data.desglose_sucursales.length} Sucursales
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                    <th className="py-3 px-3">Sucursal</th>
                                    <th className="py-3 px-3 text-right">Ingresos Actual</th>
                                    <th className="py-3 px-3 text-right">Ingresos Anterior</th>
                                    <th className="py-3 px-3 text-center">Variación %</th>
                                    <th className="py-3 px-3 text-right">Órdenes Actual</th>
                                    <th className="py-3 px-3 text-right">Órdenes Anterior</th>
                                    <th className="py-3 px-3 text-right">TM Actual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {data.desglose_sucursales.map((s) => (
                                    <tr key={s.sucursal_id} className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-3 px-3 font-black text-slate-900 flex items-center gap-2">
                                            <Store size={14} className="text-purple-600" />
                                            <span>{s.nombre_sucursal}</span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-900">{formatBs(s.ingresos_actual)}</td>
                                        <td className="py-3 px-3 text-right text-slate-500">{formatBs(s.ingresos_comparativo)}</td>
                                        <td className="py-3 px-3 text-center">
                                            {renderVariationBadge(s.variacion_ingresos_pct, s.variacion_ingresos_pct === null ? 'SIN_BASE_COMPARATIVA' : 'OK')}
                                        </td>
                                        <td className="py-3 px-3 text-right">{s.ordenes_actual} ord.</td>
                                        <td className="py-3 px-3 text-right text-slate-500">{s.ordenes_comparativo} ord.</td>
                                        <td className="py-3 px-3 text-right text-emerald-700">{formatBs(s.ticket_medio_actual)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};
