import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Filter, Maximize2, RotateCcw, AlertTriangle,
    TrendingUp, DollarSign, Trophy, Info, Layers, HelpCircle, X, CheckCircle2, BookOpen
} from 'lucide-react';
import { getBIRentabilidadMargen, getBISucursales } from '../../api/biApi';
import type { BIRentabilidadMargenResponse, BISucursalOption } from '../../api/biApi';

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

export const BIRentabilidadView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursalesOptions, setSucursalesOptions] = useState<BISucursalOption[]>([]);

    const [data, setData] = useState<BIRentabilidadMargenResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [showEbitdaModal, setShowEbitdaModal] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursalesOptions(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchRentabilidadData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIRentabilidadMargen(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo rentabilidad y margen:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi-rentabilidad/margen no fue encontrado.'
                    : 'Error de conexión con el servicio de rentabilidad del BI.');
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
            fetchRentabilidadData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchRentabilidadData]);

    const handleReset = () => {
        const todayStr = getFormattedBoliviaDate(0);
        setStartDate(todayStr);
        setEndDate(todayStr);
        setSelectedSucursal('all');
    };

    // Funciones rápidas para los botones de rango de fecha
    const handleSelectToday = () => {
        const todayStr = getFormattedBoliviaDate(0);
        setStartDate(todayStr);
        setEndDate(todayStr);
    };

    const handleSelectYesterday = () => {
        const yesterdayStr = getFormattedBoliviaDate(-1);
        setStartDate(yesterdayStr);
        setEndDate(yesterdayStr);
    };

    const handleSelectLast7Days = () => {
        const todayStr = getFormattedBoliviaDate(0);
        const last7Str = getFormattedBoliviaDate(-7);
        setStartDate(last7Str);
        setEndDate(todayStr);
    };

    const handleSelectThisMonth = () => {
        const todayStr = getFormattedBoliviaDate(0);
        const [y, m] = todayStr.split('-');
        const firstDayOfMonth = `${y}-${m}-01`;
        setStartDate(firstDayOfMonth);
        setEndDate(todayStr);
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
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener la rentabilidad teórica</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchRentabilidadData(startDate, endDate, selectedSucursal)}
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
                            <TrendingUp size={14} className="text-emerald-700" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 7</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Rentabilidad Teórica & Margen Bruto</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Modelo Estrella (`FACT_RENTABILIDAD_ITEMS`) sobre MongoDB `sales.items[]` y `products` (<span className="text-emerald-700 font-black bg-emerald-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchRentabilidadData(startDate, endDate, selectedSucursal)}
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

            {/* BARRA TRANSPARENTE SOBRE GASTOS OPERATIVOS Y EBITDA CON BOTÓN EXPLICATIVO */}
            <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sky-900 text-xs font-bold shadow-xs">
                <div className="flex items-center gap-3">
                    <Info size={20} className="text-sky-600 shrink-0" />
                    <span>
                        <strong>Gastos Operacionales & EBITDA:</strong> Declarados oficiales como <span className="bg-sky-200/70 px-2 py-0.5 rounded-md font-black">NO DISPONIBLES</span> al no contar con asientos de alquileres, salarios o impuestos en la base de datos operacional del POS.
                    </span>
                </div>

                <button
                    onClick={() => setShowEbitdaModal(true)}
                    className="flex items-center gap-1.5 bg-white hover:bg-sky-100 text-sky-900 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-sky-300 shadow-xs cursor-pointer shrink-0 transition-all"
                >
                    <HelpCircle size={14} className="text-sky-600" />
                    <span>🔍 ¿Qué es EBITDA y cómo se calcula?</span>
                </button>
            </div>

            {/* CONTROLES DE FILTRADO CON BOTONES RÁPIDOS (HOY, AYER, 7 DÍAS, ESTE MES) */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Botones Rápidos de Fecha */}
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
                        <button
                            onClick={handleSelectToday}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                startDate === getFormattedBoliviaDate(0) && endDate === getFormattedBoliviaDate(0)
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={handleSelectYesterday}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                startDate === getFormattedBoliviaDate(-1) && endDate === getFormattedBoliviaDate(-1)
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Ayer
                        </button>
                        <button
                            onClick={handleSelectLast7Days}
                            className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all cursor-pointer"
                        >
                            Últimos 7 Días
                        </button>
                        <button
                            onClick={handleSelectThisMonth}
                            className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all cursor-pointer"
                        >
                            Este Mes
                        </button>
                    </div>

                    {/* Selector Manual de Rango de Fecha */}
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

                    {/* Selector de Sucursales */}
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
                        <span>Última Sincronización POS: <strong className="text-emerald-700">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* TARJETAS KPIS PRINCIPALES */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* KPI 1: INGRESOS TOTALES */}
                    <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white rounded-3xl p-5 shadow-xs border border-blue-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-blue-100/60">
                            <span className="text-xs font-black uppercase text-blue-950">Ingresos Conciliados</span>
                            <div className="p-2 bg-blue-100/70 text-blue-600 rounded-2xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.ingresos_totales)}
                            </h2>
                            <p className="text-xs font-extrabold text-blue-700 mt-1">
                                {data.kpis.total_lineas_procesadas} líneas procesadas en ventas
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(sales.items[].subtotal)</span>
                    </div>

                    {/* KPI 2: COSTO DIRECTO TOTAL */}
                    <div className="bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white rounded-3xl p-5 shadow-xs border border-rose-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-rose-100/60">
                            <span className="text-xs font-black uppercase text-rose-950">Costo Directo Total</span>
                            <div className="p-2 bg-rose-100/70 text-rose-600 rounded-2xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.costo_directo_total)}
                            </h2>
                            <p className="text-xs font-extrabold text-rose-700 mt-1">
                                Costos de productos en almacén
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">SUM(cantidad * costo_producto)</span>
                    </div>

                    {/* KPI 3: MARGEN BRUTO TEÓRICO GLOBAL (BS Y %) */}
                    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-emerald-100/60">
                            <span className="text-xs font-black uppercase text-emerald-950">Margen Bruto Teórico</span>
                            <div className="p-2 bg-emerald-100/70 text-emerald-600 rounded-2xl">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">
                                {formatBs(data.kpis.margen_bruto_teorico_bs)}
                            </h2>
                            <p className="text-xs font-extrabold text-emerald-700 mt-1 bg-emerald-100/60 w-fit px-2 py-0.5 rounded-md">
                                {data.kpis.margen_bruto_teorico_pct}% margen bruto global
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Ingresos Conciliados - Costo Directo</span>
                    </div>

                    {/* KPI 4: PRODUCTO DE MAYOR MARGEN */}
                    <div className="bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start pb-2 border-b border-amber-100/60">
                            <span className="text-xs font-black uppercase text-amber-950">Producto Mayor Margen</span>
                            <div className="p-2 bg-amber-100/70 text-amber-600 rounded-2xl">
                                <Trophy size={18} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight">
                                {data.kpis.producto_mayor_margen_nombre}
                            </h2>
                            <p className="text-xs font-extrabold text-amber-700 mt-1">
                                {formatBs(data.kpis.producto_mayor_margen_monto)} de margen bruto
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Mayor ganancia bruta en el período</span>
                    </div>

                </div>
            )}

            {/* MODAL INTERACTIVO SOBRE QUÉ ES EBITDA Y GASTOS OPERACIONALES */}
            {showEbitdaModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-2xl w-full space-y-5 relative text-slate-800">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">¿Qué es EBITDA y cómo se calcula?</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        Conceptos financieros de Margen Bruto vs EBITDA en el POS
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEbitdaModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Definición de EBITDA */}
                            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-100 space-y-1.5">
                                <span className="font-black text-sky-950 uppercase text-[10px] tracking-wider block">💡 DEFINICIÓN FINANCIERA (EBITDA)</span>
                                <p className="text-sm font-black text-sky-950">
                                    Earnings Before Interest, Taxes, Depreciation, and Amortization
                                </p>
                                <p className="text-xs text-sky-800 font-medium leading-relaxed">
                                    (Utilidad Antes de Intereses, Impuestos, Depreciaciones y Amortizaciones). Mide la capacidad pura del negocio para generar caja operativa con su actividad comercial directa.
                                </p>
                            </div>

                            {/* Fórmulas Comparativas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1.5">
                                    <span className="text-[10px] font-black text-emerald-800 uppercase block">1. MARGEN BRUTO TEÓRICO (EN POS)</span>
                                    <p className="text-xs font-black text-emerald-950">
                                        Ventas Conciliadas - Costo de Almacén (COGS)
                                    </p>
                                    <p className="text-[11px] text-slate-600 font-medium">
                                        Es lo que calcula Pegasus POS sobre la mercadería vendida en caja.
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1.5">
                                    <span className="text-[10px] font-black text-purple-800 uppercase block">2. EBITDA OPERACIONAL</span>
                                    <p className="text-xs font-black text-purple-950">
                                        Margen Bruto - Gastos Fijos (Alquiler, Sueldos, Luz)
                                    </p>
                                    <p className="text-[11px] text-slate-600 font-medium">
                                        Requiere asientos contables de costos fijos mensuales.
                                    </p>
                                </div>
                            </div>

                            {/* Por qué está en NO DISPONIBLE */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    ¿Por qué el sistema marca Gastos Operacionales & EBITDA como NO DISPONIBLES?
                                </h4>
                                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-[11px]">
                                    <li>La base de datos del POS MongoDB (`sales` e `inventory`) registra transacciones comerciales directas en caja (ingresos y costo de mercadería vendida).</li>
                                    <li>Al no contar con un libro diario contable de alquileres, planillas salariales de personal o servicios públicos registrados en caja, el sistema declara oficialmente el EBITDA como <strong>NO DISPONIBLE</strong> para mantener la integridad de tus reportes financieros y no mostrar números falsos o incompletos.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowEbitdaModal(false)}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-xs cursor-pointer transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN CATEGORÍAS Y DETALLE DE PRODUCTOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* SIDEBAR RENTABILIDAD POR CATEGORÍA (1 TERCIO) */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4 h-fit">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Margen por Categoría</h3>
                            <p className="text-xs text-slate-400 font-bold">Diferencial `subtotal - costos`</p>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Layers size={18} />
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {data?.categorias.map((c, idx) => (
                            <div key={c.categoria_nombre || idx} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-900">{c.categoria_nombre}</span>
                                    <span className="font-black text-emerald-700">{formatBs(c.margen_bruto_bs)} ({c.margen_bruto_pct}%)</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                    <span>Ing: {formatBs(c.ingresos_bs)}</span>
                                    <span>Cost: {formatBs(c.costos_bs)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TABLA DE TOP PRODUCTOS POR MARGEN BRUTO (2 TERCIOS) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Ranking de Rentabilidad por Producto</h3>
                            <p className="text-xs text-slate-400 font-bold">Ordenados por `margen_bruto_bs`</p>
                        </div>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                            {data?.top_productos.length || 0} Productos
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                    <th className="py-3 px-3">Producto</th>
                                    <th className="py-3 px-3 text-right">Vendidos</th>
                                    <th className="py-3 px-3 text-right">Ingresos</th>
                                    <th className="py-3 px-3 text-right">Costo Directo</th>
                                    <th className="py-3 px-3 text-right">Margen Bruto</th>
                                    <th className="py-3 px-3 text-center">Margen %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {data?.top_productos.slice(0, 30).map((p, idx) => (
                                    <tr key={p.producto_id || idx} className="hover:bg-emerald-50/40 transition-colors">
                                        <td className="py-3 px-3 font-black text-slate-900 max-w-xs truncate">
                                            <div>{p.nombre}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold">{p.categoria_nombre}</div>
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-800">{p.unidades_vendidas} un.</td>
                                        <td className="py-3 px-3 text-right text-slate-50">{formatBs(p.ingresos_bs)}</td>
                                        <td className="py-3 px-3 text-right text-slate-400">{formatBs(p.costos_bs)}</td>
                                        <td className="py-3 px-3 text-right font-black text-emerald-700">{formatBs(p.margen_bruto_bs)}</td>
                                        <td className="py-3 px-3 text-center">
                                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                                                {p.margen_bruto_pct}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

        </div>
    );
};
