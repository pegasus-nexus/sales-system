import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Users, Filter,
    Maximize2, RotateCcw, AlertTriangle, CreditCard, DollarSign, UserCheck, ShoppingCart, ShieldCheck
} from 'lucide-react';
import { getBIClientes, getBISucursales } from '../../api/biApi';
import type { BIClientesResponse, BISucursalOption } from '../../api/biApi';

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

export const BIClientesView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIClientesResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursales(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchClientesData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIClientes(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo métricas de clientes y pagos:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi-clientes/clientes no fue encontrado.'
                    : 'Error de conexión con el servicio de clientes del BI.');
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
            fetchClientesData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchClientesData]);

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
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener el análisis de clientes y pagos</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchClientesData(startDate, endDate, selectedSucursal)}
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
            <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-cyan-50/90 rounded-3xl p-6 shadow-sm border border-emerald-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Users size={14} className="text-emerald-700" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 4</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Clientes, Métodos de Pago & Créditos</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Modelo Estrella (`FACT_PAGOS & FACT_CLIENTES`) sobre MongoDB `sales`, `clientes`, `cuentas_credito` (<span className="text-emerald-700 font-black bg-emerald-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchClientesData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
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
                        <span>Última Sincronización POS: <strong className="text-emerald-700">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* TARJETAS KPIS PRINCIPALES */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* KPI 1: RECAUDACIÓN TOTAL DE VENTAS */}
                    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-emerald-100/60">
                            <span className="text-xs font-black uppercase text-emerald-950">Ingresos Totales (Sales)</span>
                            <div className="p-2 bg-emerald-100/70 text-emerald-600 rounded-2xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.ingresos_totales)}
                            </h2>
                            <p className="text-xs font-extrabold text-emerald-700 mt-1">
                                {data.kpis.total_tickets} tickets procesados en el período
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(sales.total)</span>
                    </div>

                    {/* KPI 2: VENTAS NOMINADAS VS MOSTRADOR */}
                    <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white rounded-3xl p-5 shadow-xs border border-indigo-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-indigo-100/60">
                            <span className="text-xs font-black uppercase text-indigo-950">Ventas Nominadas (Clientes)</span>
                            <div className="p-2 bg-indigo-100/70 text-indigo-600 rounded-2xl">
                                <UserCheck size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                {formatBs(data.kpis.ventas_nominadas_monto)}
                            </h2>
                            <p className="text-xs font-extrabold text-indigo-700 mt-1">
                                {data.kpis.ventas_nominadas_tickets} tickets nominados
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Ventas con cliente_id registrado</span>
                    </div>

                    {/* KPI 3: VENTAS MOSTRADOR (ANÓNIMAS) */}
                    <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-amber-100/60">
                            <span className="text-xs font-black uppercase text-amber-950">Ventas Mostrador / Anónimas</span>
                            <div className="p-2 bg-amber-100/70 text-amber-600 rounded-2xl">
                                <ShoppingCart size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                {formatBs(data.kpis.ventas_anonimas_monto)}
                            </h2>
                            <p className="text-xs font-extrabold text-amber-700 mt-1">
                                {data.kpis.ventas_anonimas_tickets} tickets sin cliente asignado
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Ventas directas en caja (cliente_id = null)</span>
                    </div>

                    {/* KPI 4: CARTERA DE CRÉDITO Y SALDO PENDIENTE */}
                    <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white rounded-3xl p-5 shadow-xs border border-blue-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-blue-100/60">
                            <span className="text-xs font-black uppercase text-blue-950">Cartera Cuentas Crédito</span>
                            <div className="p-2 bg-blue-100/70 text-blue-600 rounded-2xl">
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                {formatBs(data.resumen_credito.saldo_total_cartera)}
                            </h2>
                            <p className="text-xs font-extrabold text-blue-700 mt-1">
                                {data.resumen_credito.total_cuentas_credito} cuentas ({data.resumen_credito.cuentas_al_dia} al día)
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(cuentas_credito.saldo_total)</span>
                    </div>

                </div>
            )}

            {/* SECCIÓN MÉTODOS DE PAGO Y TOP CLIENTES NOMINADOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* SIDEBAR MÉTODOS DE PAGO NETOS (1 TERCIO) */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4 h-fit">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Cobros por Método de Pago</h3>
                            <p className="text-xs text-slate-400 font-bold">Monto neto real deducido vuelto / cambio</p>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CreditCard size={18} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data?.metodos_pago.map((m) => (
                            <div key={m.metodo} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-900">{m.metodo}</span>
                                    <span className="font-black text-emerald-700">{formatBs(m.monto_neto)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                    <span>{m.tickets_conteo} incidencias en pagos</span>
                                    <span className="text-emerald-700 font-extrabold">{m.participacion_pct}% del total</span>
                                </div>
                                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(m.participacion_pct, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TABLA DE TOP CLIENTES NOMINADOS (2 TERCIOS) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Top Clientes Nominados de Mayor Compra</h3>
                            <p className="text-xs text-slate-400 font-bold">Clientes registrados en `db.clientes` (`cliente_id != null`)</p>
                        </div>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                            {data?.top_clientes.length || 0} Clientes
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                    <th className="py-3 px-3">Cliente Nominado</th>
                                    <th className="py-3 px-3">NIT / CI</th>
                                    <th className="py-3 px-3 text-right">Tickets</th>
                                    <th className="py-3 px-3 text-right">Total Acumulado</th>
                                    <th className="py-3 px-3 text-center">Part. %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {data?.top_clientes.map((c, idx) => (
                                    <tr key={c.cliente_id || idx} className="hover:bg-emerald-50/40 transition-colors">
                                        <td className="py-3 px-3 font-black text-slate-900 max-w-xs truncate">
                                            {c.nombre}
                                        </td>
                                        <td className="py-3 px-3 text-slate-500 font-mono">
                                            {c.nit_ci}
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-800">{c.compras_conteo} compras</td>
                                        <td className="py-3 px-3 text-right font-black text-slate-900">{formatBs(c.monto_total)}</td>
                                        <td className="py-3 px-3 text-center font-extrabold text-emerald-700">
                                            {c.participacion_pct}%
                                        </td>
                                    </tr>
                                ))}

                                {data?.top_clientes.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-400 font-bold">
                                            No existen compras nominadas para clientes registrados en este período. Las ventas se procesaron en mostrador.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

        </div>
    );
};
