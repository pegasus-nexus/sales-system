import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Filter, Maximize2, RotateCcw, AlertTriangle,
    UserCheck, DollarSign, Trophy, Info, Activity, MapPin
} from 'lucide-react';
import { getBIProductividadDesempeno, getBISucursales } from '../../api/biApi';
import type { BIProductividadDesempenoResponse, BISucursalOption } from '../../api/biApi';

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

export const BIProductividadView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursalesOptions, setSucursalesOptions] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIProductividadDesempenoResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursalesOptions(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchProductividadData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIProductividadDesempeno(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo desempeño de productividad de cajeros:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi-productividad/desempeno no fue encontrado.'
                    : 'Error de conexión con el servicio de productividad del BI.');
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
            fetchProductividadData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchProductividadData]);

    const handleReset = () => {
        const todayStr = getFormattedBoliviaDate(0);
        setStartDate(todayStr);
        setEndDate(todayStr);
        setSelectedSucursal('all');
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

    if (error && !loading) {
        return (
            <div className="bg-rose-50/90 border-2 border-rose-200/80 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 text-rose-950 max-w-4xl mx-auto my-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-600 shadow-xs">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener el desempeño de cajeros</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchProductividadData(startDate, endDate, selectedSucursal)}
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
            
            <div className="bg-gradient-to-r from-violet-50/90 via-purple-50/70 to-fuchsia-50/90 rounded-3xl p-6 shadow-sm border border-purple-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-violet-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <UserCheck size={14} className="text-violet-700" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 9</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Productividad & Cajeros</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Modelo Estrella (`FACT_CASHIER_PERFORMANCE`) sobre MongoDB `sales.cashier_name` y `audit_logs` (<span className="text-violet-700 font-black bg-violet-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchProductividadData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
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

            <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-purple-900 text-xs font-bold shadow-xs">
                <Info size={18} className="text-purple-600 shrink-0" />
                <span>
                    <strong>Horas Trabajadas, Eficiencia Laboral & Alertas de Fraude:</strong> Declaradas oficiales como <span className="bg-purple-200/70 px-2 py-0.5 rounded-md font-black">NO DISPONIBLES</span> al no existir ponchado de entrada/salida ni etiquetas de sospecha en MongoDB.
                </span>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
                        <button
                            onClick={() => setQuickRange('today')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                isTodayActive
                                    ? 'bg-violet-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setQuickRange('yesterday')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                isYesterdayActive
                                    ? 'bg-violet-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            Ayer
                        </button>
                        <button
                            onClick={() => setQuickRange('7days')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                is7DaysActive
                                    ? 'bg-violet-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            Últimos 7 Días
                        </button>
                        <button
                            onClick={() => setQuickRange('month')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                isMonthActive
                                    ? 'bg-violet-600 text-white shadow-xs'
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
                            {sucursalesOptions.map((s) => (
                                <option key={s.sucursal_id} value={s.sucursal_id}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {data && (
                    <div className="text-xs font-bold text-slate-500 shrink-0">
                        <span>Última Sincronización POS: <strong className="text-violet-700">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-gradient-to-br from-purple-50/90 via-violet-50/40 to-white rounded-3xl p-5 shadow-xs border border-purple-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-purple-100/60">
                            <span className="text-xs font-black uppercase text-purple-950">Ingresos Procesados</span>
                            <div className="p-2 bg-purple-100/70 text-purple-600 rounded-2xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.ingresos_totales)}
                            </h2>
                            <p className="text-xs font-extrabold text-purple-700 mt-1">
                                {data.kpis.total_tickets} tickets | {data.kpis.cajeros_activos_con_venta} cajeros activos
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(sales.total) por cajero</span>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-amber-100/60">
                            <span className="text-xs font-black uppercase text-amber-950">Cajero Líder en Ventas</span>
                            <div className="p-2 bg-amber-100/70 text-amber-600 rounded-2xl">
                                <Trophy size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight">
                                {data.kpis.cajero_lider_nombre}
                            </h2>
                            <p className="text-xs font-extrabold text-amber-700 mt-1">
                                {formatBs(data.kpis.cajero_lider_ingresos)} procesados
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Mayor volumen facturado</span>
                    </div>

                    <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-white rounded-3xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-sky-100/60">
                            <span className="text-xs font-black uppercase text-sky-950">Mayor Ticket Medio</span>
                            <div className="p-2 bg-sky-100/70 text-sky-600 rounded-2xl">
                                <UserCheck size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight">
                                {data.kpis.cajero_mayor_ticket_medio_nombre}
                            </h2>
                            <p className="text-xs font-extrabold text-sky-700 mt-1">
                                {formatBs(data.kpis.cajero_mayor_ticket_medio_monto)} / ticket
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Promedio de venta por transacción</span>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50/90 via-fuchsia-50/40 to-white rounded-3xl p-5 shadow-xs border border-indigo-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-indigo-100/60">
                            <span className="text-xs font-black uppercase text-indigo-950">Logs de Auditoría</span>
                            <div className="p-2 bg-indigo-100/70 text-indigo-600 rounded-2xl">
                                <Activity size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {data.kpis.total_eventos_auditoria}
                            </h2>
                            <p className="text-xs font-extrabold text-indigo-700 mt-1">
                                Eventos registrados
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">COUNT(db.audit_logs)</span>
                    </div>

                </div>
            )}

            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Ranking y Desempeño por Cajero / Operador POS</h3>
                        <p className="text-xs text-slate-400 font-bold">Ventas consolidadas agrupadas por `sales.cashier_name` y sucursal</p>
                    </div>
                    <span className="text-xs font-black text-violet-700 bg-violet-50 px-3 py-1 rounded-xl">
                        {data?.cajeros.length || 0} Cajeros Activos
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                <th className="py-3 px-3">Cajero / Operador</th>
                                <th className="py-3 px-3">Sucursal / Tienda</th>
                                <th className="py-3 px-3 text-right">Tickets Emitidos</th>
                                <th className="py-3 px-3 text-right">Facturación Total</th>
                                <th className="py-3 px-3 text-right">Ticket Medio</th>
                                <th className="py-3 px-3 text-right">Participación %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {data?.cajeros.map((c, idx) => (
                                <tr key={idx} className="hover:bg-violet-50/40 transition-colors">
                                    <td className="py-3.5 px-3 font-black text-slate-900">
                                        {c.cajero_nombre}
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 font-extrabold text-[11px]">
                                            <MapPin size={11} className="text-violet-500" />
                                            <span>{c.sucursal_nombre || 'Sucursal Central'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-3 text-right text-slate-800">{c.tickets_conteo} tks</td>
                                    <td className="py-3.5 px-3 text-right font-black text-slate-900">{formatBs(c.ingresos_bs)}</td>
                                    <td className="py-3.5 px-3 text-right text-slate-800">{formatBs(c.ticket_medio)}</td>
                                    <td className="py-3.5 px-3 text-right font-extrabold text-violet-700">{c.participacion_pct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECCIÓN AUDITORÍA DE SISTEMA */}
            {data && data.auditoria_eventos.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="pb-3 border-b border-slate-100">
                        <h3 className="text-base font-black text-slate-900">Resumen de Eventos de Auditoría (`db.audit_logs`)</h3>
                        <p className="text-xs text-slate-400 font-bold">Distribución por tipo de acción realizada en el sistema</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {data.auditoria_eventos.map((ev, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase block">{ev.accion}</span>
                                <span className="text-lg font-black text-slate-900 mt-1 block">{ev.total_eventos}</span>
                                <span className="text-[10px] font-bold text-slate-500">eventos</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};
