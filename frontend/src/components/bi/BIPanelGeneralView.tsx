import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Layers, Clock, AlertCircle,
    TrendingUp, ShoppingBag, Receipt, CheckCircle2, ChevronDown, Filter, Info, Search
} from 'lucide-react';
import { getBIPanelGeneral, getBISucursales, BIPanelGeneralResponse, BISucursalOption } from '../../api/biApi';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getFormattedDate = (daysOffset: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
};

export const BIPanelGeneralView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Controles de Fecha y Sucursal (inicialización inmediata)
    const [preset, setPreset] = useState<'hoy' | 'ayer' | '30dias' | 'custom'>('hoy');
    const [startDate, setStartDate] = useState<string>(() => getFormattedDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    // Datos del BI Backend
    const [data, setData] = useState<BIPanelGeneralResponse | null>(null);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursales(list);
        } catch (err) {
            console.error('Error cargando sucursales para BI:', err);
        }
    };

    const fetchBIData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIPanelGeneral(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo métricas del BI:', err);
            const axiosErr = err as { response?: { data?: { detail?: string } } };
            const msg = axiosErr?.response?.data?.detail || 'No se pudieron obtener las métricas oficiales del BI.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos al montar y al cambiar filtros
    useEffect(() => {
        loadSucursales();
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchBIData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchBIData]);

    const handlePresetChange = (newPreset: 'hoy' | 'ayer' | '30dias') => {
        setPreset(newPreset);
        const today = getFormattedDate(0);
        if (newPreset === 'hoy') {
            setStartDate(today);
            setEndDate(today);
        } else if (newPreset === 'ayer') {
            const meyer = getFormattedDate(-1);
            setStartDate(meyer);
            setEndDate(meyer);
        } else if (newPreset === '30dias') {
            const d30 = getFormattedDate(-30);
            setStartDate(d30);
            setEndDate(today);
        }
    };

    const isDataEmpty = data && data.ingresos_totales === 0 && data.cantidad_ordenes === 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header del Panel General */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <Layers size={14} />
                        <span>BI Analítico — Modelo Estrella (Star Schema)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">Panel General — Día a Día</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Fuente de verdad: POS MongoDB (`sales`) • Zona Horaria: <span className="text-emerald-400 font-bold">America/La_Paz</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchBIData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar Métricas</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE CONTROLES Y FILTROS */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Presets Rápidos */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => handlePresetChange('hoy')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            preset === 'hoy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => handlePresetChange('ayer')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            preset === 'ayer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Ayer
                    </button>
                    <button
                        onClick={() => handlePresetChange('30dias')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            preset === '30dias' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        30 Días
                    </button>
                </div>

                {/* Selectores de Fechas Personalizadas y Sucursal */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setPreset('custom');
                                setStartDate(e.target.value);
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        />
                        <span className="text-slate-400 font-bold text-xs">a</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setPreset('custom');
                                setEndDate(e.target.value);
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
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

            {/* AVISO SI NO HAY VENTAS EN EL PERÍODO SELECCIONADO */}
            {!loading && isDataEmpty && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-900">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-2xl text-amber-700">
                            <Search size={22} />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-sm">Sin ventas registradas en el período ({startDate} a {endDate})</h4>
                            <p className="text-xs text-amber-700 mt-0.5">
                                No se encontraron tickets en el POS para este rango. Prueba seleccionando un período más amplio como los últimos 30 días.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handlePresetChange('30dias')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl transition-all whitespace-nowrap shadow-sm"
                    >
                        Ver Últimos 30 Días
                    </button>
                </div>
            )}

            {/* ESTADO DE CONEXIÓN Y TRAZABILIDAD */}
            {data && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>
                            <b>FECHA SELECCIONADA:</b> {data.fecha_inicio_bolivia} a {data.fecha_fin_bolivia} (Bolivia)
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-600">
                        <span><b>ESTADO:</b> {data.estado_sincronizacion}</span>
                        <span><b>ÚLTIMA ACT.:</b> {data.ultima_actualizacion}</span>
                        <span><b>TIMEZONE:</b> {data.timezone}</span>
                    </div>
                </div>
            )}

            {/* ERRORES DE API */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-bold">
                    <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* TARJETAS DE KPIS PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. INGRESOS TOTALES */}
                <div className="bg-[#7b75a6] rounded-3xl p-6 text-white shadow-md flex flex-col justify-between border border-white/10 relative overflow-hidden">
                    <div className="flex justify-between items-center pb-3 border-b border-white/20">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider block text-white/90">Ingresos Totales</span>
                            <span className="text-[10px] font-semibold text-white/70">Ventas Neta Real de POS</span>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    </div>

                    <div className="my-6">
                        <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-none drop-shadow">
                            {loading ? '...' : formatBs(data?.ingresos_totales)}
                        </h2>
                        <p className="text-xs font-semibold text-white/80 mt-2 flex items-center gap-1">
                            <TrendingUp size={14} />
                            <span>Ventas brutas menos anulaciones</span>
                        </p>
                    </div>

                    {showBreakdown && data?.desglose_sucursales && (
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 mb-3 border border-white/15 space-y-1.5">
                            {data.desglose_sucursales.map((suc) => (
                                <div key={suc.sucursal_id} className="flex justify-between text-xs text-white/90">
                                    <span className="font-semibold truncate max-w-[150px]">{suc.nombre_sucursal}:</span>
                                    <span className="font-bold">{formatBs(suc.ingresos)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="flex items-center gap-1 uppercase tracking-wider text-[11px] font-extrabold text-white/90 hover:text-white"
                        >
                            <span>Desglose por Sucursal</span>
                            <ChevronDown size={14} className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* 2. ÓRDENES VÁLIDAS */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">Órdenes Válidas</span>
                            <span className="text-[10px] font-semibold text-slate-400">Tickets POS emitidos</span>
                        </div>
                        <ShoppingBag size={18} className="text-indigo-600" />
                    </div>

                    <div className="my-6">
                        <h2 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-none">
                            {loading ? '...' : data?.cantidad_ordenes || 0}
                        </h2>
                        <p className="text-xs font-bold text-slate-500 mt-2">
                            Excluye tickets anulados ({data?.trazabilidad?.filtro_anuladas})
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Info size={13} />
                        <span>1 Ticket = 1 Orden comercial</span>
                    </div>
                </div>

                {/* 3. TICKET MEDIO */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">Ticket Medio</span>
                            <span className="text-[10px] font-semibold text-slate-400">Promedio por venta</span>
                        </div>
                        <Receipt size={18} className="text-emerald-600" />
                    </div>

                    <div className="my-6">
                        <h2 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-none">
                            {loading ? '...' : formatBs(data?.ticket_medio)}
                        </h2>
                        <p className="text-xs font-bold text-slate-500 mt-2">
                            Ingresos Totales / Órdenes Válidas
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>Calculado vectorialmente con Pandas</span>
                    </div>
                </div>
            </div>

            {/* DISTRIBUCIÓN HORARIA DE VENTAS EN HORA DE BOLIVIA */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Ventas por Rango Horario (Hora de Bolivia)</h3>
                        <p className="text-xs font-bold text-slate-400">
                            Agrupación en hora local America/La_Paz (00:00 a 23:59)
                        </p>
                    </div>
                    <Clock size={18} className="text-indigo-600" />
                </div>

                {loading ? (
                    <div className="h-40 flex items-center justify-center text-slate-400 text-xs font-bold">
                        Cargando distribución horaria...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                        {data?.ventas_por_hora.map((item) => (
                            <div
                                key={item.hora}
                                className={`p-2.5 rounded-2xl border text-center transition-all ${
                                    item.ordenes > 0
                                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                                        : 'bg-slate-50 border-slate-150 text-slate-400'
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase block text-slate-500 mb-1">
                                    {item.hora}:00
                                </span>
                                <span className="text-xs font-extrabold block">
                                    {item.ingresos > 0 ? formatBs(item.ingresos) : 'Bs. 0'}
                                </span>
                                <span className="text-[10px] font-medium block mt-0.5 text-slate-500">
                                    {item.ordenes} ord.
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
