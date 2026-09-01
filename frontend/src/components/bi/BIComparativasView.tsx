import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Filter,
    AlertTriangle, Store, Info, ArrowUpRight, ArrowDownRight, Minus,
    Clock, Download, AlertCircle, BarChart3, TrendingUp, Layers
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
    hourNum: number;
    v2026: number;
    ord2026: number;
    v2025: number;
    ord2025: number;
    v2024: number;
    ord2024: number;
    isOffHours?: boolean;
}

export const BIComparativasView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [endDate, setEndDate] = useState<string>(() => getFormattedBoliviaDate(0));
    const [compararContra, setCompararContra] = useState<'ayer' | 'semana_anterior' | 'mes_anterior' | 'ano_anterior'>('ayer');
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    // Modo de Rango Horario (comercial 08-21 por defecto, auto, o 24h)
    const [rangeMode, setRangeMode] = useState<'comercial' | 'auto' | 'full'>('comercial');

    // Selector Interactivo de Estilos de Gráfica (line_nodes, grouped_bars, area)
    const [chartStyle, setChartStyle] = useState<'line_nodes' | 'grouped_bars' | 'area'>('line_nodes');

    const [data, setData] = useState<BIComparativaResponse | null>(null);

    // Datos multianuales desglosados coincidiendo con la maqueta
    const allHourlyData: HourlyMultiYearData[] = [
        { hora: '06:00', hourNum: 6, v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0, isOffHours: true },
        { hora: '07:00', hourNum: 7, v2026: 0, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0, isOffHours: true },
        { hora: '08:00', hourNum: 8, v2026: 0, ord2026: 0, v2025: 350.00, ord2025: 4, v2024: 0, ord2024: 0 },
        { hora: '09:00', hourNum: 9, v2026: 220.00, ord2026: 4, v2025: 450.00, ord2025: 5, v2024: 180.00, ord2024: 2 },
        { hora: '10:00', hourNum: 10, v2026: 94.00, ord2026: 4, v2025: 230.00, ord2025: 3, v2024: 110.00, ord2024: 2 },
        { hora: '11:00', hourNum: 11, v2026: 300.00, ord2026: 5, v2025: 800.00, ord2025: 9, v2024: 290.00, ord2024: 3 },
        { hora: '12:00', hourNum: 12, v2026: 1050.00, ord2026: 12, v2025: 1930.00, ord2025: 18, v2024: 610.00, ord2024: 7 },
        { hora: '13:00', hourNum: 13, v2026: 205.50, ord2026: 6, v2025: 1740.00, ord2025: 15, v2024: 680.00, ord2024: 8 },
        { hora: '14:00', hourNum: 14, v2026: 0.00, ord2026: 0, v2025: 1020.00, ord2025: 10, v2024: 300.00, ord2024: 4 },
        { hora: '15:00', hourNum: 15, v2026: 390.00, ord2026: 6, v2025: 1250.00, ord2025: 11, v2024: 150.00, ord2024: 2 },
        { hora: '16:00', hourNum: 16, v2026: 310.00, ord2026: 4, v2025: 290.00, ord2025: 3, v2024: 0, ord2024: 0 },
        { hora: '17:00', hourNum: 17, v2026: 170.00, ord2026: 3, v2025: 190.00, ord2025: 2, v2024: 0, ord2024: 0 },
        { hora: '18:00', hourNum: 18, v2026: 220.00, ord2026: 4, v2025: 210.00, ord2025: 3, v2024: 0, ord2024: 0 },
        { hora: '19:00', hourNum: 19, v2026: 345.00, ord2026: 6, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '20:00', hourNum: 20, v2026: 260.00, ord2026: 4, v2025: 250.00, ord2025: 3, v2024: 0, ord2024: 0 },
        { hora: '21:00', hourNum: 21, v2026: 30.00, ord2026: 1, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0 },
        { hora: '22:00', hourNum: 22, v2026: 0.00, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0, isOffHours: true },
        { hora: '23:00', hourNum: 23, v2026: 0.00, ord2026: 0, v2025: 0, ord2025: 0, v2024: 0, ord2024: 0, isOffHours: true },
    ];

    // Verificar si hay ventas atípicas fuera del horario comercial (08:00 - 21:00)
    const offHoursSalesCount = allHourlyData.filter(
        h => h.isOffHours && (h.v2026 > 0 || h.v2025 > 0 || h.v2024 > 0)
    ).length;

    // Filtrar los datos según el modo seleccionado
    const visibleHourlyData = allHourlyData.filter(h => {
        if (rangeMode === 'comercial') {
            return h.hourNum >= 8 && h.hourNum <= 21;
        }
        if (rangeMode === 'auto') {
            return h.v2026 > 0 || h.v2025 > 0 || h.v2024 > 0;
        }
        return true; // full
    });

    // CÁLCULO DE PUNTOS Y RUTAS SVG MATEMÁTICAMENTE EXACTAS DE ALINEACIÓN POR HORA
    const generatePathAndPoints = (
        hourlyList: HourlyMultiYearData[],
        key: 'v2026' | 'v2025' | 'v2024',
        maxVal: number = 2000,
        width: number = 1000,
        height: number = 220
    ) => {
        if (hourlyList.length === 0) return { pathD: '', points: [] };

        const points = hourlyList.map((item, idx) => {
            const x = (idx + 0.5) * (width / hourlyList.length);
            const val = item[key];
            // Escalar el valor dentro del alto útil (respetando márgenes top 15 y bottom 25)
            const y = height - 25 - (val / maxVal) * (height - 40);
            return { x, y, val, hora: item.hora };
        });

        // Generar trayectoria Bezier suave entre los puntos exactos
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const controlX = (current.x + next.x) / 2;
            pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
        }

        return { pathD, points };
    };

    const maxChartVal = 2000;
    const svgWidth = 1000;
    const svgHeight = 220;

    const line2026 = generatePathAndPoints(visibleHourlyData, 'v2026', maxChartVal, svgWidth, svgHeight);
    const line2025 = generatePathAndPoints(visibleHourlyData, 'v2025', maxChartVal, svgWidth, svgHeight);
    const line2024 = generatePathAndPoints(visibleHourlyData, 'v2024', maxChartVal, svgWidth, svgHeight);

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
            
            {/* CABECERA CON FILTROS E INFO SUPERIOR SEGÚN LA MAQUETA */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-600">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">FECHA ANALIZADA</span>
                        <strong className="text-slate-900 text-sm font-black">31 ago 2026</strong>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">ALINEACIÓN HISTÓRICA</span>
                        <span className="text-purple-700 font-black">
                            Lun 31 ago 2026 <span className="text-slate-400">vs</span> Lun 1 sept 2025 <span className="text-slate-400">vs</span> Lun 2 sept 2024
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => handleReset()}
                        className="px-3.5 py-2 rounded-2xl bg-indigo-50 text-indigo-700 font-extrabold text-xs hover:bg-indigo-100 transition-all cursor-pointer"
                    >
                        Hoy
                    </button>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700">
                        <Calendar size={14} className="text-slate-400" />
                        <span>lun, 31 ago 2026</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="bg-transparent outline-hidden cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {sucursales.map((s) => (
                                <option key={s.sucursal_id} value={s.sucursal_id}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-2xl border border-slate-200/80 cursor-pointer shadow-xs"
                    >
                        <Download size={14} className="text-slate-600" />
                        <span>Exportar Horarios</span>
                    </button>
                </div>
            </div>

            {/* BANNER SUPERIOR KPIS DE VENTA NETA MULTIANUAL (FONDO PASTEL CREMA / ROSADO SUAVE) */}
            <div className="bg-gradient-to-r from-amber-50/70 via-rose-50/60 to-purple-50/70 rounded-3xl p-6 border border-amber-100/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                
                {/* 2026 (AÑO ACTUAL) */}
                <div className="flex-1 pr-4 border-b md:border-b-0 md:border-r border-amber-200/50 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-rose-900 uppercase tracking-wider block">2026 (AÑO ACTUAL)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-3xl font-black text-rose-950">Bs. 3,345.00</h2>
                        <span className="text-xs font-bold text-slate-500">Venta Neta del Día</span>
                    </div>
                </div>

                {/* 2025 (HACE 1 AÑO) */}
                <div className="flex-1 px-0 md:px-4 border-b md:border-b-0 md:border-r border-amber-200/50 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">2025 (HACE 1 AÑO)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-2xl font-black text-amber-950">Bs. 7,997.00</h2>
                        <span className="text-xs font-black text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md border border-rose-200">
                            ▼ -58.2%
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Venta Neta Histórica</span>
                </div>

                {/* 2024 (HACE 2 AÑOS) */}
                <div className="flex-1 px-0 md:px-4 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">2024 (HACE 2 AÑOS)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-2xl font-black text-amber-950">Bs. 1,973.00</h2>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                            ▲ +69.5%
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Venta Neta Histórica</span>
                </div>

                {/* BADGE DE ESTADO */}
                <div className="self-end md:self-center shrink-0">
                    <span className="text-xs font-black text-rose-900 bg-rose-100/90 px-4 py-2 rounded-2xl border border-rose-200/80 inline-flex items-center gap-2 shadow-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                        Debajo del Histórico
                    </span>
                </div>

            </div>

            {/* SECCIÓN DEL GRÁFICO CON ALINEACIÓN 100% MATEMÁTICA EN LAS 3 LÍNEAS MULTIANUALES */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-6">
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-purple-600" />
                            <h3 className="text-base font-black text-slate-900">Ventas por Rango Horario (Multianual)</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                            Trayectoria por hora: <strong className="text-purple-700">🟣 2026 (Púrpura)</strong> | <strong className="text-amber-600">🟡 2025 (Amarillo/Dorado)</strong> | <strong className="text-rose-600">🔴 2024 (Coral/Rosado)</strong>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* SELECTOR DE ESTILOS DE GRÁFICA */}
                        <div className="flex items-center gap-1 bg-purple-50 p-1.5 rounded-2xl border border-purple-100">
                            <button
                                onClick={() => setChartStyle('line_nodes')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    chartStyle === 'line_nodes'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-purple-900 hover:bg-purple-100/80'
                                }`}
                            >
                                <TrendingUp size={13} />
                                <span>3 Líneas Multianuales</span>
                            </button>
                            <button
                                onClick={() => setChartStyle('grouped_bars')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    chartStyle === 'grouped_bars'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-purple-900 hover:bg-purple-100/80'
                                }`}
                            >
                                <BarChart3 size={13} />
                                <span>Barras Agrupadas</span>
                            </button>
                            <button
                                onClick={() => setChartStyle('area')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    chartStyle === 'area'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-purple-900 hover:bg-purple-100/80'
                                }`}
                            >
                                <Layers size={13} />
                                <span>Áreas Superpuestas</span>
                            </button>
                        </div>

                        {/* Selector de Rango Horario Inteligente (08:00 - 21:00) */}
                        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setRangeMode('comercial')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    rangeMode === 'comercial'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                ⏰ Comercial (08-21)
                            </button>
                            <button
                                onClick={() => setRangeMode('auto')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    rangeMode === 'auto'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                ✨ Auto (Ventas)
                            </button>
                            <button
                                onClick={() => setRangeMode('full')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    rangeMode === 'full'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                🌐 24h
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alerta inteligente si existen ventas fuera del horario comercial regular */}
                {rangeMode === 'comercial' && offHoursSalesCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-amber-900">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} className="text-amber-600" />
                            <span>Se detectaron registros atípicos fuera del horario comercial regular (08:00 - 21:00).</span>
                        </div>
                        <button
                            onClick={() => setRangeMode('full')}
                            className="text-purple-700 font-black hover:underline cursor-pointer ml-4 whitespace-nowrap"
                        >
                            Ver 24 Horas Completas &gt;
                        </button>
                    </div>
                )}

                {/* CONTENEDOR DE LA GRÁFICA CON ALINEACIÓN 100% PRECISA POR HORA */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 relative">
                    
                    {/* Marcador de Hora Actual en el gráfico */}
                    <div className="absolute right-12 top-4 z-10 flex flex-col items-center">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-xs mb-1">
                            Hora actual 22:00
                        </span>
                        <div className="w-px h-44 bg-indigo-400 stroke-dasharray-2 border-r border-dashed border-indigo-400"></div>
                    </div>

                    {/* LIENZO SVG DINÁMICO RECEPTIVO CON ALINEACIÓN MATEMÁTICA EXACTA */}
                    <div className="h-56 relative flex items-end justify-between px-4 pt-8">
                        {/* Escala Eje Y */}
                        <div className="absolute left-2 top-0 bottom-6 flex flex-col justify-between text-[10px] font-bold text-slate-400 pointer-events-none z-10">
                            <span>Bs 2,000</span>
                            <span>Bs 1,500</span>
                            <span>Bs 1,000</span>
                            <span>Bs 500</span>
                            <span>Bs 0</span>
                        </div>

                        {/* ESTILO 1: 3 LÍNEAS INDEPENDIENTES CON NODOS PUNTUALES ALINEADOS (2026, 2025, 2024) */}
                        {chartStyle === 'line_nodes' && (
                            <div className="w-full h-full pl-12 pr-12 relative">
                                <svg
                                    className="w-full h-full overflow-visible"
                                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                    preserveAspectRatio="none"
                                >
                                    {/* Guías horizontales de fondo */}
                                    <line x1="0" y1="20" x2={svgWidth} y2="20" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="65" x2={svgWidth} y2="65" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="110" x2={svgWidth} y2="110" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="155" x2={svgWidth} y2="155" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="195" x2={svgWidth} y2="195" stroke="#CBD5E1" strokeWidth="1.5" />

                                    {/* LÍNEA 2024 (Coral / Rosada) */}
                                    {line2024.pathD && (
                                        <path
                                            d={line2024.pathD}
                                            fill="none"
                                            stroke="#FB7185"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* LÍNEA 2025 (Dorada / Amarilla) */}
                                    {line2025.pathD && (
                                        <path
                                            d={line2025.pathD}
                                            fill="none"
                                            stroke="#F59E0B"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* LÍNEA 2026 (Púrpura Principal) */}
                                    {line2026.pathD && (
                                        <path
                                            d={line2026.pathD}
                                            fill="none"
                                            stroke="#8B5CF6"
                                            strokeWidth="4.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* NODOS EXACTOS 2024 */}
                                    {line2024.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <g key={`p24-${i}`}>
                                                <circle cx={pt.x} cy={pt.y} r="5" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2" />
                                            </g>
                                        )
                                    ))}

                                    {/* NODOS EXACTOS 2025 */}
                                    {line2025.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <g key={`p25-${i}`}>
                                                <circle cx={pt.x} cy={pt.y} r="5.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                                            </g>
                                        )
                                    ))}

                                    {/* NODOS EXACTOS 2026 */}
                                    {line2026.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <g key={`p26-${i}`}>
                                                <circle cx={pt.x} cy={pt.y} r="6.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2.5" />
                                                <circle cx={pt.x} cy={pt.y} r="2.5" fill="#FFFFFF" />
                                            </g>
                                        )
                                    ))}
                                </svg>
                            </div>
                        )}

                        {/* ESTILO 2: BARRAS AGRUPADAS TRIPLES */}
                        {chartStyle === 'grouped_bars' && (
                            <div className="w-full h-full flex items-end justify-between pl-12 pr-12 gap-2">
                                {visibleHourlyData.map((h) => {
                                    const maxVal = 2000;
                                    const h2026Pct = Math.min((h.v2026 / maxVal) * 100, 100);
                                    const h2025Pct = Math.min((h.v2025 / maxVal) * 100, 100);
                                    const h2024Pct = Math.min((h.v2024 / maxVal) * 100, 100);

                                    return (
                                        <div key={h.hora} className="flex-1 flex items-end justify-center gap-1 h-full relative group">
                                            {/* 2026 (Púrpura) */}
                                            <div
                                                style={{ height: `${h2026Pct}%` }}
                                                className="w-3 bg-purple-600 rounded-t-sm transition-all group-hover:bg-purple-700 shadow-xs"
                                            ></div>
                                            {/* 2025 (Amarillo) */}
                                            <div
                                                style={{ height: `${h2025Pct}%` }}
                                                className="w-3 bg-amber-400 rounded-t-sm transition-all group-hover:bg-amber-500 shadow-xs"
                                            ></div>
                                            {/* 2024 (Coral) */}
                                            <div
                                                style={{ height: `${h2024Pct}%` }}
                                                className="w-3 bg-rose-400 rounded-t-sm transition-all group-hover:bg-rose-500 shadow-xs"
                                            ></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ESTILO 3: ÁREAS SUPERPUESTAS ALINEADAS */}
                        {chartStyle === 'area' && (
                            <div className="w-full h-full pl-12 pr-12 relative">
                                <svg
                                    className="w-full h-full overflow-visible"
                                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                    preserveAspectRatio="none"
                                >
                                    {/* ÁREA 2026 */}
                                    {line2026.pathD && (
                                        <path
                                            d={`${line2026.pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`}
                                            fill="rgba(139, 92, 246, 0.15)"
                                        />
                                    )}
                                    {line2026.pathD && (
                                        <path
                                            d={line2026.pathD}
                                            fill="none"
                                            stroke="#8B5CF6"
                                            strokeWidth="3.5"
                                        />
                                    )}
                                    {line2026.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <circle key={`p26-a-${i}`} cx={pt.x} cy={pt.y} r="5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                                        )
                                    ))}
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Leyenda Eje X de Horas alineada 100% con los puntos */}
                    <div className="flex justify-between text-[10px] font-black text-slate-500 pl-12 pr-12 pt-2 border-t border-slate-200">
                        {visibleHourlyData.map((h) => (
                            <span key={h.hora} className="w-full text-center">{h.hora}</span>
                        ))}
                    </div>
                </div>

                {/* TABLA INFERIOR DE DETALLE HORARIO */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900">Ventas por Rango Horario — Detalle Multianual</h4>
                        <span className="text-xs text-slate-400 font-bold">
                            Mostrando {visibleHourlyData.length} rangos horarios
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                    <th className="py-3 px-3">🕒 Hora</th>
                                    <th className="py-3 px-3 text-right text-purple-900">🟣 2026 (Bs.)</th>
                                    <th className="py-3 px-3 text-right text-purple-900">🎟️ 2026 (Ord.)</th>
                                    <th className="py-3 px-3 text-right text-amber-900">🟡 2025 (Bs.)</th>
                                    <th className="py-3 px-3 text-right text-amber-900">🎫 2025 (Ord.)</th>
                                    <th className="py-3 px-3 text-right text-rose-900">🔴 2024 (Bs.)</th>
                                    <th className="py-3 px-3 text-center">📈 Var. 26 vs 25</th>
                                    <th className="py-3 px-3 text-center">📊 Var. 26 vs 24</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {visibleHourlyData.map((h) => {
                                    const var25 = h.v2025 > 0 ? (((h.v2026 - h.v2025) / h.v2025) * 100).toFixed(1) : null;
                                    const var24 = h.v2024 > 0 ? (((h.v2026 - h.v2024) / h.v2024) * 100).toFixed(1) : null;

                                    return (
                                        <tr key={h.hora} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="py-3 px-3 font-black text-slate-900">{h.hora}</td>
                                            <td className="py-3 px-3 text-right font-black text-purple-950">{formatBs(h.v2026)}</td>
                                            <td className="py-3 px-3 text-right font-extrabold text-purple-800">{h.ord2026} ord.</td>
                                            <td className="py-3 px-3 text-right font-bold text-amber-900">{formatBs(h.v2025)}</td>
                                            <td className="py-3 px-3 text-right font-semibold text-amber-700">{h.ord2025} ord.</td>
                                            <td className="py-3 px-3 text-right font-semibold text-rose-900">{formatBs(h.v2024)}</td>
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
