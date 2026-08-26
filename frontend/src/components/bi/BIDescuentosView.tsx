import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Filter, Maximize2, RotateCcw, AlertTriangle,
    Tag, DollarSign, Ticket, Trophy, Info, CheckCircle2, XCircle
} from 'lucide-react';
import { getBIDescuentosImpacto, getBISucursales } from '../../api/biApi';
import type { BIDescuentosImpactoResponse, BISucursalOption } from '../../api/biApi';

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

export const BIDescuentosView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursalesOptions, setSucursalesOptions] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIDescuentosImpactoResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursalesOptions(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchDescuentosData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIDescuentosImpacto(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo impacto de descuentos:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi-descuentos/impacto no fue encontrado.'
                    : 'Error de conexión con el servicio de descuentos del BI.');
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
            fetchDescuentosData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchDescuentosData]);

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
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener el impacto de descuentos</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchDescuentosData(startDate, endDate, selectedSucursal)}
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
            <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-yellow-50/90 rounded-3xl p-6 shadow-sm border border-orange-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-orange-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Tag size={14} className="text-orange-700" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 8</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Descuentos & Promociones</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Modelo Estrella (`FACT_DESCUENTOS_SALES`) sobre MongoDB `descuentos` y `sales` (<span className="text-orange-700 font-black bg-orange-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchDescuentosData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
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

            {/* BARRA TRANSPARENTE SOBRE ROI Y EFECTIVIDAD CAUSAL NO DISPONIBLES */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-amber-900 text-xs font-bold shadow-xs">
                <Info size={18} className="text-amber-600 shrink-0" />
                <span>
                    <strong>ROI & Efectividad Causal de Campañas:</strong> Declarados oficiales como <span className="bg-amber-200/70 px-2 py-0.5 rounded-md font-black">NO DISPONIBLES</span> al no contar con registros de origen publicitario ni asignación de clientes por campaña en MongoDB.
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
                        <span>Última Sincronización POS: <strong className="text-orange-700">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* TARJETAS KPIS PRINCIPALES */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* KPI 1: PROMOCIONES CONFIGURADAS */}
                    <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white rounded-3xl p-5 shadow-xs border border-orange-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-orange-100/60">
                            <span className="text-xs font-black uppercase text-orange-950">Promociones Catálogo</span>
                            <div className="p-2 bg-orange-100/70 text-orange-600 rounded-2xl">
                                <Tag size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {data.kpis.promociones_configuradas}
                            </h2>
                            <p className="text-xs font-extrabold text-orange-700 mt-1">
                                {data.kpis.promociones_activas} reglas activas en el sistema
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">COUNT(db.descuentos)</span>
                    </div>

                    {/* KPI 2: TICKETS CON DESCUENTO */}
                    <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white rounded-3xl p-5 shadow-xs border border-blue-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-blue-100/60">
                            <span className="text-xs font-black uppercase text-blue-950">Tickets con Descuento</span>
                            <div className="p-2 bg-blue-100/70 text-blue-600 rounded-2xl">
                                <Ticket size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {data.kpis.tickets_con_descuento} tickets
                            </h2>
                            <p className="text-xs font-extrabold text-blue-700 mt-1">
                                Ventas registradas con subdocumento descuento
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">COUNT(sales.descuento)</span>
                    </div>

                    {/* KPI 3: MONTO TOTAL DE DESCUENTOS OTORGADOS */}
                    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-emerald-100/60">
                            <span className="text-xs font-black uppercase text-emerald-950">Total Descuentos Otorgados</span>
                            <div className="p-2 bg-emerald-100/70 text-emerald-600 rounded-2xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.monto_total_descuentos_otorgados)}
                            </h2>
                            <p className="text-xs font-extrabold text-emerald-700 mt-1">
                                Descuento total concedido a compradores
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(sales.descuento.monto)</span>
                    </div>

                    {/* KPI 4: PROMOCIÓN MÁS USADA */}
                    <div className="bg-gradient-to-br from-yellow-50/90 via-amber-50/40 to-white rounded-3xl p-5 shadow-xs border border-yellow-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-yellow-100/60">
                            <span className="text-xs font-black uppercase text-yellow-950">Promoción Más Usada</span>
                            <div className="p-2 bg-yellow-100/70 text-yellow-600 rounded-2xl">
                                <Trophy size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight">
                                {data.kpis.promocion_mas_usada_nombre}
                            </h2>
                            <p className="text-xs font-extrabold text-yellow-700 mt-1">
                                {formatBs(data.kpis.promocion_mas_usada_monto)} aplicados
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Regla con mayor descuento otorgado</span>
                    </div>

                </div>
            )}

            {/* TABLA PRINCIPAL DESGLOSE DE PROMOCIONES */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Catálogo y Ranking de Promociones Aplicadas</h3>
                        <p className="text-xs text-slate-400 font-bold">Ordenadas por monto de descuento realmente otorgado</p>
                    </div>
                    <span className="text-xs font-black text-orange-700 bg-orange-50 px-3 py-1 rounded-xl">
                        {data?.promociones.length || 0} Promociones
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                <th className="py-3 px-3">Nombre Promoción / Regla</th>
                                <th className="py-3 px-3">Tipo Regla</th>
                                <th className="py-3 px-3 text-right">Valor Regla</th>
                                <th className="py-3 px-3 text-right">Tickets Aplicados</th>
                                <th className="py-3 px-3 text-right">Monto Descuento Total</th>
                                <th className="py-3 px-3 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {data?.promociones.map((p, idx) => (
                                <tr key={p.promocion_id || idx} className="hover:bg-orange-50/40 transition-colors">
                                    <td className="py-3.5 px-3 font-black text-slate-900">
                                        {p.nombre}
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <span className="text-[10px] font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                            {p.tipo}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-right text-slate-800">
                                        {p.tipo === 'PORCENTAJE' ? `${p.valor}%` : formatBs(p.valor)}
                                    </td>
                                    <td className="py-3.5 px-3 text-right text-slate-800">{p.tickets_aplicados} tks</td>
                                    <td className="py-3.5 px-3 text-right font-black text-slate-900">{formatBs(p.monto_descuento_total)}</td>
                                    <td className="py-3.5 px-3 text-center">
                                        {p.is_active ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                <CheckCircle2 size={10} /> ACTIVA
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                <XCircle size={10} /> INACTIVA
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
