import React, { useState } from 'react';
import {
    BarChart3, Calendar, RefreshCw, Download, Filter, ChevronLeft, ChevronRight,
    Info, Clock, Store, Sparkles
} from 'lucide-react';

export const BIBenchmarkHistoricoView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedStore, setSelectedStore] = useState<string>('consolidado');
    const [periodMode, setPeriodMode] = useState<'mes' | 'semana'>('mes');
    const [currentMonth] = useState<string>('Agosto 2026');

    // Datos simulados de percentiles basados en la maqueta
    const percentiles = {
        p25: 2645.00,
        p50: 4615.00,
        p75: 5983.00,
    };

    // Datos de los 31 días de Agosto 2026 coincidiendo con la maqueta
    const daysData = [
        { day: 1, dayOfWeek: 'Lun', sales: 1950.05, vsP50: -65, status: 'critico', posPct: 15 },
        { day: 2, dayOfWeek: 'Mar', sales: 2485.52, vsP50: -35, status: 'bajo', posPct: 22 },
        { day: 3, dayOfWeek: 'Mie', sales: 1772.01, vsP50: -64, status: 'critico', posPct: 12 },
        { day: 4, dayOfWeek: 'Jue', sales: 2805.01, vsP50: -32, status: 'critico', posPct: 24 },
        { day: 5, dayOfWeek: 'Vie', sales: 1482.00, vsP50: -66, status: 'critico', posPct: 10 },
        { day: 6, dayOfWeek: 'Sab', sales: 3434.03, vsP50: -26, status: 'bajo', posPct: 35 },
        { day: 7, dayOfWeek: 'Dom', sales: 2390.02, vsP50: -60, status: 'critico', posPct: 20 },

        { day: 8, dayOfWeek: 'Lun', sales: 3061.00, vsP50: -44, status: 'critico', posPct: 28 },
        { day: 9, dayOfWeek: 'Mar', sales: 1966.50, vsP50: -44, status: 'critico', posPct: 16 },
        { day: 10, dayOfWeek: 'Mie', sales: 1373.50, vsP50: -72, status: 'critico', posPct: 8 },
        { day: 11, dayOfWeek: 'Jue', sales: 4042.50, vsP50: -3, status: 'bajo', posPct: 42 },
        { day: 12, dayOfWeek: 'Vie', sales: 2256.00, vsP50: -47, status: 'critico', posPct: 18 },
        { day: 13, dayOfWeek: 'Sab', sales: 1646.50, vsP50: -65, status: 'critico', posPct: 12 },
        { day: 14, dayOfWeek: 'Dom', sales: 1757.00, vsP50: -70, status: 'critico', posPct: 14 },

        { day: 15, dayOfWeek: 'Lun', sales: 1952.00, vsP50: -65, status: 'critico', posPct: 15 },
        { day: 16, dayOfWeek: 'Mar', sales: 1820.50, vsP50: -65, status: 'critico', posPct: 14 },
        { day: 17, dayOfWeek: 'Mie', sales: 2590.50, vsP50: -48, status: 'bajo', posPct: 24 },
        { day: 18, dayOfWeek: 'Jue', sales: 0, vsP50: 0, status: 'sin_ventas', posPct: 0 },
        { day: 19, dayOfWeek: 'Vie', sales: 2135.00, vsP50: -50, status: 'critico', posPct: 17 },
        { day: 20, dayOfWeek: 'Sab', sales: 3245.01, vsP50: -30, status: 'critico', posPct: 32 },
        { day: 21, dayOfWeek: 'Dom', sales: 2810.01, vsP50: -53, status: 'critico', posPct: 25 },

        { day: 22, dayOfWeek: 'Lun', sales: 4096.51, vsP50: -26, status: 'bajo', posPct: 43 },
        { day: 23, dayOfWeek: 'Mar', sales: 2254.00, vsP50: -26, status: 'critico', posPct: 18 },
        { day: 24, dayOfWeek: 'Mie', sales: 2743.02, vsP50: -45, status: 'bajo', posPct: 26 },
        { day: 25, dayOfWeek: 'Jue', sales: 2653.00, vsP50: -36, status: 'critico', posPct: 25 },
        { day: 26, dayOfWeek: 'Vie', sales: 2362.50, vsP50: -45, status: 'bajo', posPct: 20 },
        { day: 27, dayOfWeek: 'Sab', sales: 1819.50, vsP50: -61, status: 'critico', posPct: 14 },
        { day: 28, dayOfWeek: 'Dom', sales: 5484.00, vsP50: -8, status: 'bajo', posPct: 65 },

        { day: 29, dayOfWeek: 'Lun', sales: 5054.00, vsP50: -8, status: 'bajo', posPct: 58 },
        { day: 30, dayOfWeek: 'Mar', sales: 4579.00, vsP50: 20, status: 'alto', posPct: 75 },
        { day: 31, dayOfWeek: 'Mie', sales: 6627.00, vsP50: 34, status: 'alto', posPct: 88 },
    ];

    const resumenMes = {
        criticos: { count: 17, pct: '54.8%' },
        bajos: { count: 10, pct: '32.3%' },
        normales: { count: 0, pct: '0%' },
        altos: { count: 4, pct: '12.9%' },
        sinDatos: { count: 1, pct: '3.2%' },
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'critico':
                return { bg: 'bg-rose-50/80 border-rose-100', text: 'text-rose-700 bg-rose-100/90 border-rose-200', label: 'Crítico' };
            case 'bajo':
                return { bg: 'bg-amber-50/70 border-amber-100', text: 'text-amber-800 bg-amber-100/90 border-amber-200', label: 'Bajo' };
            case 'normal':
                return { bg: 'bg-sky-50/70 border-sky-100', text: 'text-sky-800 bg-sky-100/90 border-sky-200', label: 'Normal' };
            case 'alto':
                return { bg: 'bg-emerald-50/80 border-emerald-100', text: 'text-emerald-800 bg-emerald-100/90 border-emerald-200', label: 'Alto' };
            default:
                return { bg: 'bg-slate-50 border-slate-200/60', text: 'text-slate-500 bg-slate-100 border-slate-200', label: 'Sin datos' };
        }
    };

    return (
        <div className="space-y-6 font-sans text-slate-800 w-full">
            
            {/* CABECERA PRINCIPAL */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                            <BarChart3 size={18} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Benchmark Histórico</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-bold">
                        Evaluación del rendimiento utilizando datos históricos dinámicos y días equivalentes.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 bg-purple-100/80 hover:bg-purple-200/80 text-purple-900 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all border border-purple-200/60 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={`text-purple-700 ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-xs"
                    >
                        <Download size={14} className="text-slate-600" />
                        <span>Exportar</span>
                    </button>
                    <button
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-xs"
                    >
                        <Filter size={14} className="text-slate-600" />
                        <span>Filtros</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE TIENDAS Y SELECTOR DE PERÍODO / MES */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                
                {/* Tabs de Sucursales */}
                <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                        onClick={() => setSelectedStore('consolidado')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'consolidado'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Tiendas Minoristas (Consolidado)</span>
                    </button>

                    <button
                        onClick={() => setSelectedStore('heroinas')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'heroinas'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Heroínas</span>
                    </button>

                    <button
                        onClick={() => setSelectedStore('recoleta')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'recoleta'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Recoleta</span>
                    </button>

                    <button
                        onClick={() => setSelectedStore('calacoto')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'calacoto'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Calacoto</span>
                    </button>
                </div>

                {/* Controles Mes/Semana y Selector de Mes */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
                        <button
                            onClick={() => setPeriodMode('mes')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                periodMode === 'mes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setPeriodMode('semana')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                periodMode === 'semana' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semana
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl text-xs font-black">
                        <button className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="flex items-center gap-1.5 text-slate-800">
                            <Calendar size={14} className="text-slate-400" />
                            {currentMonth}
                        </span>
                        <button className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN P25, P50, P75 PERCENTILES HISTÓRICOS */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-600" />
                        <h3 className="text-sm font-black text-slate-900">Percentiles Históricos</h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                        Base estadística: 365 días históricos comparables según filtro activo.
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* CARD P25 (CRÍTICO) */}
                    <div className="bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white rounded-3xl p-5 shadow-xs border border-rose-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2 border-b border-rose-100/60">
                                <span className="text-xs font-black uppercase text-rose-950">P25</span>
                                <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200">
                                    CRÍTICO
                                </span>
                            </div>
                            <div className="my-3">
                                <h2 className="text-2xl lg:text-3xl font-black text-rose-950">
                                    Bs. {percentiles.p25.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[10px] font-bold text-rose-700 block mt-0.5">Mínimo recomendado</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-rose-100/60 flex items-center justify-between text-xs font-bold text-rose-800">
                            <span>Límite inferior dinámico</span>
                            <svg className="w-16 h-5 text-rose-400" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 15 Q 25 10, 50 12 T 100 5" />
                            </svg>
                        </div>
                    </div>

                    {/* CARD P50 (NORMAL) */}
                    <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-white rounded-3xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2 border-b border-sky-100/60">
                                <span className="text-xs font-black uppercase text-sky-950">P50</span>
                                <span className="text-[10px] font-black text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md border border-sky-200">
                                    NORMAL
                                </span>
                            </div>
                            <div className="my-3">
                                <h2 className="text-2xl lg:text-3xl font-black text-sky-950">
                                    Bs. {percentiles.p50.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[10px] font-bold text-sky-700 block mt-0.5">Punto medio histórico</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-sky-100/60 flex items-center justify-between text-xs font-bold text-sky-800">
                            <span>Mediana del negocio</span>
                            <svg className="w-16 h-5 text-sky-400" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 18 Q 30 15, 60 10 T 100 4" />
                            </svg>
                        </div>
                    </div>

                    {/* CARD P75 (META) */}
                    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-100/60">
                                <span className="text-xs font-black uppercase text-emerald-950">P75</span>
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                    META
                                </span>
                            </div>
                            <div className="my-3">
                                <h2 className="text-2xl lg:text-3xl font-black text-emerald-950">
                                    Bs. {percentiles.p75.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">Nivel alto esperado</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                            <span>Rendimiento superior</span>
                            <svg className="w-16 h-5 text-emerald-400" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 16 Q 40 18, 70 8 T 100 2" />
                            </svg>
                        </div>
                    </div>

                </div>
            </div>

            {/* SECCIÓN PRINCIPAL: CALENDARIO DE PERCENTILES (LEFT 2/3) + SIDEBAR DERECHO (RIGHT 1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMNA IZQUIERDA (2/3 ANCHO): CALENDARIO MENSUAL DE PERCENTILES */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    
                    {/* Encabezado Días de la Semana */}
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-400 border-b border-slate-100 pb-2">
                        <span>Lun</span>
                        <span>Mar</span>
                        <span>Mie</span>
                        <span>Jue</span>
                        <span>Vie</span>
                        <span>Sab</span>
                        <span>Dom</span>
                    </div>

                    {/* Grilla de Días del Mes */}
                    <div className="grid grid-cols-7 gap-2">
                        {daysData.map((d) => {
                            const statusInfo = getStatusStyle(d.status);
                            const isSinVentas = d.status === 'sin_ventas';

                            return (
                                <div
                                    key={d.day}
                                    className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[90px] ${statusInfo.bg}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-slate-800 text-xs">{d.day}</span>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${statusInfo.text}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {!isSinVentas ? (
                                        <div className="my-1 space-y-0.5">
                                            <span className="font-black text-slate-900 text-[11px] block leading-tight">
                                                Bs. {d.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className={`text-[9px] font-extrabold block ${d.vsP50 >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {d.vsP50 >= 0 ? '▲' : '↓'} {d.vsP50}% vs P50
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="my-2 text-center">
                                            <span className="text-[10px] font-bold text-slate-400 block">Sin ventas</span>
                                            <span className="text-[9px] text-slate-400 font-bold block">—</span>
                                        </div>
                                    )}

                                    {/* Indicador de percentil P25 P50 P75 */}
                                    <div className="pt-1 border-t border-black/5">
                                        <div className="flex justify-between text-[7px] font-black text-slate-400">
                                            <span>P25</span>
                                            <span>P50</span>
                                            <span>P75</span>
                                        </div>
                                        <div className="h-1 bg-slate-200/80 rounded-full mt-0.5 relative">
                                            {!isSinVentas && (
                                                <div
                                                    style={{ left: `${Math.min(Math.max(d.posPct, 5), 95)}%` }}
                                                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white ${
                                                        d.status === 'critico' ? 'bg-rose-500' :
                                                        d.status === 'bajo' ? 'bg-amber-500' :
                                                        d.status === 'normal' ? 'bg-sky-500' : 'bg-emerald-500'
                                                    }`}
                                                ></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Leyenda del Calendario */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 gap-2">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                            Crítico (&lt; P25)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                            Bajo (P25 - P50)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                            Normal (P50 - P75)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                            Alto (&gt; P75)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                            Sin datos
                        </span>
                    </div>

                </div>

                {/* COLUMNA DERECHA (1/3 ANCHO): SIDEBAR DE METRICAS Y REFERENCIAS */}
                <div className="space-y-6">

                    {/* CARD 1: REFERENCIA ESTADÍSTICA */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                        <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-slate-900">Referencia Estadística</h3>
                        </div>

                        {/* Curva Gaussiana simulada */}
                        <div className="h-32 relative bg-purple-50/30 rounded-2xl border border-purple-100/60 p-2 flex flex-col justify-between">
                            <svg className="w-full h-full text-purple-500" viewBox="0 0 200 80" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M 0 75 Q 60 75, 100 10 Q 140 75, 200 75" fill="rgba(168, 85, 247, 0.1)" />
                                {/* Líneas discontinuas P25, P50, P75 */}
                                <line x1="60" y1="10" x2="60" y2="75" stroke="#F43F5E" strokeDasharray="3 3" strokeWidth="1.5" />
                                <line x1="100" y1="10" x2="100" y2="75" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />
                                <line x1="140" y1="10" x2="140" y2="75" stroke="#10B981" strokeDasharray="3 3" strokeWidth="1.5" />
                            </svg>

                            <div className="flex justify-between text-[9px] font-black px-8">
                                <span className="text-rose-600">P25</span>
                                <span className="text-sky-600">P50</span>
                                <span className="text-emerald-600">P75</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs font-semibold text-slate-600">
                            <p><strong className="text-rose-600">P25:</strong> 25% de los días están por debajo</p>
                            <p><strong className="text-sky-600">P50:</strong> 50% de los días están por debajo</p>
                            <p><strong className="text-emerald-600">P75:</strong> 75% de los días están por debajo</p>
                        </div>
                    </div>

                    {/* CARD 2: RESUMEN DEL MES */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                        <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-slate-900">Resumen del Mes</h3>
                        </div>

                        <div className="space-y-3 text-xs font-bold">
                            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-100">
                                <span className="flex items-center gap-2 text-rose-900">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                    Días Críticos
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900">{resumenMes.criticos.count}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{resumenMes.criticos.pct}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100">
                                <span className="flex items-center gap-2 text-amber-900">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    Días Bajos
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900">{resumenMes.bajos.count}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{resumenMes.bajos.pct}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/50 border border-sky-100">
                                <span className="flex items-center gap-2 text-sky-900">
                                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                                    Días Normales
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900">{resumenMes.normales.count}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{resumenMes.normales.pct}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                <span className="flex items-center gap-2 text-emerald-900">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    Días Altos
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900">{resumenMes.altos.count}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{resumenMes.altos.pct}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                                <span className="flex items-center gap-2 text-slate-700">
                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                                    Sin datos
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900">{resumenMes.sinDatos.count}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{resumenMes.sinDatos.pct}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: PRONÓSTICO IA (PRÓXIMOS 7 DÍAS) */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                        <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-slate-900">Pronóstico IA (Próximos 7 días)</h3>
                        </div>

                        <div className="h-20 bg-purple-50/40 rounded-2xl p-2 border border-purple-100 relative">
                            <svg className="w-full h-full text-purple-600" viewBox="0 0 150 50" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 35 Q 30 15, 60 25 T 100 10" />
                                <path d="M100 10 Q 125 5, 150 20" strokeDasharray="3 3" stroke="#A855F7" />
                            </svg>
                        </div>

                        <div className="space-y-2 text-xs font-bold">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Tendencia Esperada</span>
                                <span className="text-purple-700 font-black">Estable</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Confianza del Modelo</span>
                                <span className="text-purple-700 font-black bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                    82%
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* PIE DE PÁGINA INFORMATIVO */}
            <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs font-bold text-slate-500 gap-2">
                <div className="flex items-center gap-1.5">
                    <Info size={14} className="text-slate-400" />
                    <span>Los percentiles se calculan dinámicamente con los últimos <strong>365 días equivalentes</strong> (mismo día de la semana y estacionalidad).</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span>Última actualización: <strong>31/08/2026 19:50:22</strong></span>
                </div>
            </div>

        </div>
    );
};
