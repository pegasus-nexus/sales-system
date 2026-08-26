import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Filter, Maximize2, RotateCcw, AlertTriangle,
    Building2, DollarSign, ShoppingBag, Trophy, Award, MapPin
} from 'lucide-react';
import { getBISucursalesDesempeno, getBISucursales } from '../../api/biApi';
import type { BISucursalesDesempenoResponse, BISucursalOption } from '../../api/biApi';

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

export const BISucursalesView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursalesOptions, setSucursalesOptions] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BISucursalesDesempenoResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursalesOptions(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchSucursalesData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBISucursalesDesempeno(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo desempeño de sucursales:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi-sucursales/desempeno no fue encontrado.'
                    : 'Error de conexión con el servicio de sucursales del BI.');
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
            fetchSucursalesData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchSucursalesData]);

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
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener el desempeño por sucursales</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchSucursalesData(startDate, endDate, selectedSucursal)}
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
            <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 rounded-3xl p-6 shadow-sm border border-blue-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Building2 size={14} className="text-blue-700" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 5</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Sucursales & Desempeño Operativo</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Modelo Estrella (`FACT_SALES_SUCURSALES`) sobre MongoDB `sales` y `sucursales` (<span className="text-blue-700 font-black bg-blue-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchSucursalesData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
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
                        <span>Última Sincronización POS: <strong className="text-blue-700">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* TARJETAS KPIS PRINCIPALES */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* KPI 1: RECAUDACIÓN TOTAL */}
                    <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white rounded-3xl p-5 shadow-xs border border-blue-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-blue-100/60">
                            <span className="text-xs font-black uppercase text-blue-950">Ingresos Totales (Sales)</span>
                            <div className="p-2 bg-blue-100/70 text-blue-600 rounded-2xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.ingresos_totales)}
                            </h2>
                            <p className="text-xs font-extrabold text-blue-700 mt-1">
                                {data.kpis.total_tickets} tickets | {data.kpis.total_sucursales_activas_con_venta} tiendas activas
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(sales.total)</span>
                    </div>

                    {/* KPI 2: SUCURSAL LÍDER */}
                    <div className="bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-amber-100/60">
                            <span className="text-xs font-black uppercase text-amber-950">Sucursal Líder en Ventas</span>
                            <div className="p-2 bg-amber-100/70 text-amber-600 rounded-2xl">
                                <Trophy size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight">
                                {data.kpis.sucursal_lider_nombre}
                            </h2>
                            <p className="text-xs font-extrabold text-amber-700 mt-1">
                                {formatBs(data.kpis.sucursal_lider_ingresos)} recaudados
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Mayor facturación en el período</span>
                    </div>

                    {/* KPI 3: SUCURSAL MAYOR TICKET MEDIO */}
                    <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white rounded-3xl p-5 shadow-xs border border-indigo-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-indigo-100/60">
                            <span className="text-xs font-black uppercase text-indigo-950">Mayor Ticket Medio</span>
                            <div className="p-2 bg-indigo-100/70 text-indigo-600 rounded-2xl">
                                <Award size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight">
                                {data.kpis.sucursal_mayor_ticket_medio_nombre}
                            </h2>
                            <p className="text-xs font-extrabold text-indigo-700 mt-1">
                                {formatBs(data.kpis.sucursal_mayor_ticket_medio_monto)} / ticket
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Promedio más alto por compra</span>
                    </div>

                    {/* KPI 4: TICKET MEDIO GLOBAL */}
                    <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-white rounded-3xl p-5 shadow-xs border border-teal-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-teal-100/60">
                            <span className="text-xs font-black uppercase text-teal-950">Ticket Medio Global</span>
                            <div className="p-2 bg-teal-100/70 text-teal-600 rounded-2xl">
                                <ShoppingBag size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.ticket_medio_global)}
                            </h2>
                            <p className="text-xs font-extrabold text-teal-700 mt-1">
                                Promedio general por ticket
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Ingresos Totales / Total Tickets</span>
                    </div>

                </div>
            )}

            {/* TABLA PRINCIPAL DESEMPEÑO POR SUCURSALES */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Ranking y Desempeño Operativo de Tiendas</h3>
                        <p className="text-xs text-slate-400 font-bold">Ordenadas por facturación total real en `sales`</p>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">
                        {data?.sucursales.length || 0} Tiendas Activas
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                <th className="py-3 px-3">Sucursal / Tienda</th>
                                <th className="py-3 px-3">Ciudad</th>
                                <th className="py-3 px-3 text-right">Tickets</th>
                                <th className="py-3 px-3 text-right">Ticket Medio</th>
                                <th className="py-3 px-3 text-right">Ingresos Totales</th>
                                <th className="py-3 px-3 text-center">Participación %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {data?.sucursales.map((s, idx) => (
                                <tr key={s.sucursal_id || idx} className="hover:bg-blue-50/40 transition-colors">
                                    <td className="py-3.5 px-3 font-black text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <div>{s.nombre}</div>
                                                <div className="text-[10px] text-slate-400 font-semibold">{s.direccion}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                            {s.ciudad}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-right text-slate-800">{s.tickets_conteo} tks</td>
                                    <td className="py-3.5 px-3 text-right text-slate-500">{formatBs(s.ticket_medio)}</td>
                                    <td className="py-3.5 px-3 text-right font-black text-slate-900">{formatBs(s.ingresos_bs)}</td>
                                    <td className="py-3.5 px-3 text-center font-extrabold text-blue-700">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-10 text-right">{s.participacion_pct}%</span>
                                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                                <div
                                                    className="bg-blue-600 h-1.5 rounded-full"
                                                    style={{ width: `${Math.min(s.participacion_pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {data?.sucursales.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                                        No se registraron ventas operacionales para ninguna sucursal en el período seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
