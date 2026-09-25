import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Calendar, RefreshCw, Filter,
    AlertTriangle, Store, Info, ArrowUpRight, ArrowDownRight, Minus,
    Clock, Download, AlertCircle, BarChart3, TrendingUp, Layers
} from 'lucide-react';
import { getBIComparativas, getBISucursales, getBIPanelGeneral } from '../../api/biApi';
import type { BIComparativaResponse, BISucursalOption, BIPanelGeneralResponse } from '../../api/biApi';

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

const getPrevYearDateStr = (dateStr: string, yearsOffset: number): string => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const prevY = y - yearsOffset;
    const dt = new Date(prevY, m - 1, d);
    const yr = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const dy = String(dt.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
};

const getYearFromDateStr = (dateStr: string, yearsOffset: number = 0): number => {
    if (!dateStr) return new Date().getFullYear() - yearsOffset;
    const [y] = dateStr.split('-').map(Number);
    return y - yearsOffset;
};

const getFormattedDateLong = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayName = dt.toLocaleDateString('es-BO', { weekday: 'short' });
    const monthName = dt.toLocaleDateString('es-BO', { month: 'short' });
    return `${dayName}, ${d} ${monthName} ${y}`;
};

const getAlignmentHistoryText = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    
    const dCur = new Date(y, m - 1, d);
    const strCur = `${dCur.toLocaleDateString('es-BO', { weekday: 'short' })} ${d} ${dCur.toLocaleDateString('es-BO', { month: 'short' })} ${y}`;
    
    const d1Ago = new Date(y - 1, m - 1, d);
    const str1Ago = `${d1Ago.toLocaleDateString('es-BO', { weekday: 'short' })} ${d} ${d1Ago.toLocaleDateString('es-BO', { month: 'short' })} ${y - 1}`;
    
    const d2Ago = new Date(y - 2, m - 1, d);
    const str2Ago = `${d2Ago.toLocaleDateString('es-BO', { weekday: 'short' })} ${d} ${d2Ago.toLocaleDateString('es-BO', { month: 'short' })} ${y - 2}`;
    
    return `${strCur} vs ${str1Ago} vs ${str2Ago}`;
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

    // Selector Interactivo de Estilos de Gráfica (grouped_bars, line_nodes, area)
    const [chartStyle, setChartStyle] = useState<'grouped_bars' | 'line_nodes' | 'area'>('grouped_bars');

    const [data, setData] = useState<BIComparativaResponse | null>(null);

    // Paneles multianuales dinámicos para los 3 años seleccionados
    const [multiYearPanels, setMultiYearPanels] = useState<{
        panelCur: BIPanelGeneralResponse | null;
        panel1Ago: BIPanelGeneralResponse | null;
        panel2Ago: BIPanelGeneralResponse | null;
    }>({ panelCur: null, panel1Ago: null, panel2Ago: null });

    const currentYear = getYearFromDateStr(startDate, 0);
    const year1Ago = getYearFromDateStr(startDate, 1);
    const year2Ago = getYearFromDateStr(startDate, 2);

    // Construcción dinámico-reactiva de datos multianuales por hora desde la API
    const allHourlyData: HourlyMultiYearData[] = useMemo(() => {
        const { panelCur, panel1Ago, panel2Ago } = multiYearPanels;
        return Array.from({ length: 24 }, (_, h) => {
            const horaStr = `${String(h).padStart(2, '0')}:00`;
            const curHour = panelCur?.ventas_por_hora?.find(item => item.hora === h);
            const p1Hour = panel1Ago?.ventas_por_hora?.find(item => item.hora === h);
            const p2Hour = panel2Ago?.ventas_por_hora?.find(item => item.hora === h);

            return {
                hora: horaStr,
                hourNum: h,
                v2026: curHour?.ingresos || 0,
                ord2026: curHour?.ordenes || 0,
                v2025: p1Hour?.ingresos || 0,
                ord2025: p1Hour?.ordenes || 0,
                v2024: p2Hour?.ingresos || 0,
                ord2024: p2Hour?.ordenes || 0,
                isOffHours: h < 8 || h > 21
            };
        });
    }, [multiYearPanels]);

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

    // Escala del gráfico dinámica
    const maxValCalculated = Math.max(
        ...visibleHourlyData.flatMap(h => [h.v2026, h.v2025, h.v2024]),
        100
    );
    const maxChartVal = Math.max(Math.ceil(maxValCalculated / 100) * 100, 500);

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
            const y = height - 25 - (val / maxVal) * (height - 40);
            return { x, y, val, hora: item.hora };
        });

        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const controlX = (current.x + next.x) / 2;
            pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
        }

        return { pathD, points };
    };

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
            const date1Ago = getPrevYearDateStr(sDate, 1);
            const date2Ago = getPrevYearDateStr(sDate, 2);

            const [resComp, pCur, p1Ago, p2Ago] = await Promise.all([
                getBIComparativas(sDate, eDate, compMode, sucId),
                getBIPanelGeneral(sDate, sDate, sucId),
                getBIPanelGeneral(date1Ago, date1Ago, sucId),
                getBIPanelGeneral(date2Ago, date2Ago, sucId)
            ]);

            setData(resComp);
            setMultiYearPanels({
                panelCur: pCur,
                panel1Ago: p1Ago,
                panel2Ago: p2Ago
            });
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
                    <ArrowUpRight size={12} /> ↑ {pct.toFixed(1)}%
                </span>
            );
        }
        if (pct < 0) {
            return (
                <span className="text-[10px] font-black text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-xl border border-rose-200/80 inline-flex items-center gap-1">
                    <ArrowDownRight size={12} /> ↓ {Math.abs(pct).toFixed(1)}%
                </span>
            );
        }
        return (
            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 inline-flex items-center gap-1">
                <Minus size={10} /> 0.0%
            </span>
        );
    };

    // Cálculos de KPIs Nivel Superior
    const ingCur = multiYearPanels.panelCur?.ingresos_totales || 0;
    const ing1Ago = multiYearPanels.panel1Ago?.ingresos_totales || 0;
    const ing2Ago = multiYearPanels.panel2Ago?.ingresos_totales || 0;

    const var1AgoPct = ing1Ago > 0 ? (((ingCur - ing1Ago) / ing1Ago) * 100) : null;
    const var2AgoPct = ing2Ago > 0 ? (((ingCur - ing2Ago) / ing2Ago) * 100) : null;

    const maxHistIng = Math.max(ing1Ago, ing2Ago);
    let statusBadgeText = 'Debajo del Histórico';
    let statusBadgeClass = 'text-rose-900 bg-rose-100/90 border-rose-200/80';
    let statusDotClass = 'bg-rose-600';

    if (ingCur === 0 && maxHistIng === 0) {
        statusBadgeText = 'Sin Registros de Venta';
        statusBadgeClass = 'text-slate-700 bg-slate-100 border-slate-200';
        statusDotClass = 'bg-slate-400';
    } else if (ingCur >= maxHistIng && ingCur > 0) {
        statusBadgeText = 'Sobre el Histórico';
        statusBadgeClass = 'text-emerald-900 bg-emerald-100/90 border-emerald-200/80';
        statusDotClass = 'bg-emerald-600';
    } else if (ingCur > 0) {
        statusBadgeText = 'Debajo del Histórico';
        statusBadgeClass = 'text-rose-900 bg-rose-100/90 border-rose-200/80';
        statusDotClass = 'bg-rose-600';
    }

    const currentBoliviaHourStr = new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());

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
                        <strong className="text-slate-900 text-sm font-black capitalize">{getFormattedDateLong(startDate)}</strong>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">ALINEACIÓN HISTÓRICA</span>
                        <span className="text-indigo-700 font-black capitalize">
                            {getAlignmentHistoryText(startDate)}
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

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-slate-700">
                        <Calendar size={14} className="text-indigo-600 shrink-0" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setStartDate(e.target.value);
                                    setEndDate(e.target.value);
                                }
                            }}
                            className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer text-xs"
                        />
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

            {/* BANNER SUPERIOR KPIS DE VENTA NETA MULTIANUAL (FONDO PASTEL ELEGANTE Y DINÁMICO) */}
            <div className="bg-gradient-to-r from-indigo-50/80 via-sky-50/70 to-slate-50/80 rounded-3xl p-6 border border-indigo-100/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                
                {/* AÑO ACTUAL */}
                <div className="flex-1 pr-4 border-b md:border-b-0 md:border-r border-indigo-200/60 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider block">{currentYear} (AÑO ACTUAL)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-3xl font-black text-indigo-950">{formatBs(ingCur)}</h2>
                        <span className="text-xs font-bold text-slate-500">Venta Neta del Día</span>
                    </div>
                </div>

                {/* HACE 1 AÑO */}
                <div className="flex-1 px-0 md:px-4 border-b md:border-b-0 md:border-r border-indigo-200/60 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-sky-900 uppercase tracking-wider block">{year1Ago} (HACE 1 AÑO)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-2xl font-black text-sky-950">{formatBs(ing1Ago)}</h2>
                        {renderVariationBadge(var1AgoPct, var1AgoPct === null ? 'SIN_BASE_COMPARATIVA' : 'OK')}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Venta Neta Histórica</span>
                </div>

                {/* HACE 2 AÑOS */}
                <div className="flex-1 px-0 md:px-4 pb-4 md:pb-0">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{year2Ago} (HACE 2 AÑOS)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-2xl font-black text-slate-800">{formatBs(ing2Ago)}</h2>
                        {renderVariationBadge(var2AgoPct, var2AgoPct === null ? 'SIN_BASE_COMPARATIVA' : 'OK')}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Venta Neta Histórica</span>
                </div>

                {/* BADGE DE ESTADO DINÁMICO */}
                <div className="self-end md:self-center shrink-0">
                    <span className={`text-xs font-black px-4 py-2 rounded-2xl border inline-flex items-center gap-2 shadow-xs ${statusBadgeClass}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass} animate-pulse`}></span>
                        {statusBadgeText}
                    </span>
                </div>

            </div>

            {/* SECCIÓN DEL GRÁFICO CON NUEVA PALETA CROMÁTICA ARMÓNICA Y EJECUTIVA */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-6">
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-indigo-600" />
                            <h3 className="text-base font-black text-slate-900">Ventas por Rango Horario (Multianual)</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Trayectoria armónica:</span>
                            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-black">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block shadow-2xs"></span> {currentYear} (Índigo Ejecutivo)
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="inline-flex items-center gap-1.5 text-cyan-600 font-black">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-2xs"></span> {year1Ago} (Cian Fresco)
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="inline-flex items-center gap-1.5 text-slate-500 font-black">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block shadow-2xs"></span> {year2Ago} (Slate Neutro)
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* SELECTOR DE ESTILOS DE GRÁFICA */}
                        <div className="flex items-center gap-1 bg-indigo-50/70 p-1.5 rounded-2xl border border-indigo-100">
                            <button
                                onClick={() => setChartStyle('grouped_bars')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    chartStyle === 'grouped_bars'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-indigo-900 hover:bg-indigo-100/80'
                                }`}
                            >
                                <BarChart3 size={13} />
                                <span>Barras Agrupadas</span>
                            </button>
                            <button
                                onClick={() => setChartStyle('line_nodes')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    chartStyle === 'line_nodes'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-indigo-900 hover:bg-indigo-100/80'
                                }`}
                            >
                                <TrendingUp size={13} />
                                <span>3 Líneas Multianuales</span>
                            </button>
                            <button
                                onClick={() => setChartStyle('area')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    chartStyle === 'area'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-indigo-900 hover:bg-indigo-100/80'
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
                            className="text-indigo-700 font-black hover:underline cursor-pointer ml-4 whitespace-nowrap"
                        >
                            Ver 24 Horas Completas &gt;
                        </button>
                    </div>
                )}

                {/* CONTENEDOR DE LA GRÁFICA CON LA NUEVA PALETA CROMÁTICA ARMÓNICA */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 relative">
                    
                    {/* Marcador de Hora Actual en el gráfico */}
                    <div className="absolute right-12 top-4 z-10 flex flex-col items-center">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-xs mb-1">
                            Hora actual {currentBoliviaHourStr}
                        </span>
                        <div className="w-px h-44 bg-indigo-400 stroke-dasharray-2 border-r border-dashed border-indigo-400"></div>
                    </div>

                    <div className="h-56 relative flex items-end justify-between px-4 pt-8">
                        {/* Escala Eje Y Dinámica */}
                        <div className="absolute left-2 top-0 bottom-6 flex flex-col justify-between text-[10px] font-bold text-slate-400 pointer-events-none z-10">
                            <span>Bs {maxChartVal.toLocaleString('en-US')}</span>
                            <span>Bs {Math.round(maxChartVal * 0.75).toLocaleString('en-US')}</span>
                            <span>Bs {Math.round(maxChartVal * 0.5).toLocaleString('en-US')}</span>
                            <span>Bs {Math.round(maxChartVal * 0.25).toLocaleString('en-US')}</span>
                            <span>Bs 0</span>
                        </div>

                        {/* ESTILO 1: BARRAS AGRUPADAS TRIPLES (NUEVA PALETA ARMÓNICA) */}
                        {chartStyle === 'grouped_bars' && (
                            <div className="w-full h-full flex items-end justify-between pl-12 pr-12 gap-2">
                                {visibleHourlyData.map((h) => {
                                    const h2026Pct = Math.min((h.v2026 / maxChartVal) * 100, 100);
                                    const h2025Pct = Math.min((h.v2025 / maxChartVal) * 100, 100);
                                    const h2024Pct = Math.min((h.v2024 / maxChartVal) * 100, 100);

                                    return (
                                        <div key={h.hora} className="flex-1 flex items-end justify-center gap-1 h-full relative group">
                                            {/* Current Year (Índigo Ejecutivo) */}
                                            <div
                                                style={{ height: `${h2026Pct}%` }}
                                                className="w-3 bg-indigo-600 rounded-t-sm transition-all group-hover:bg-indigo-700 shadow-xs"
                                                title={`${currentYear}: ${formatBs(h.v2026)}`}
                                            ></div>
                                            {/* Year 1 Ago (Cian Fresco) */}
                                            <div
                                                style={{ height: `${h2025Pct}%` }}
                                                className="w-3 bg-cyan-500 rounded-t-sm transition-all group-hover:bg-cyan-600 shadow-xs"
                                                title={`${year1Ago}: ${formatBs(h.v2025)}`}
                                            ></div>
                                            {/* Year 2 Ago (Slate Neutro) */}
                                            <div
                                                style={{ height: `${h2024Pct}%` }}
                                                className="w-3 bg-slate-400 rounded-t-sm transition-all group-hover:bg-slate-500 shadow-xs"
                                                title={`${year2Ago}: ${formatBs(h.v2024)}`}
                                            ></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ESTILO 2: 3 LÍNEAS MULTIANUALES CON PUNTOS PUNTUALES ALINEADOS (PALETA ARMÓNICA) */}
                        {chartStyle === 'line_nodes' && (
                            <div className="w-full h-full pl-12 pr-12 relative">
                                <svg
                                    className="w-full h-full overflow-visible"
                                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                    preserveAspectRatio="none"
                                >
                                    <line x1="0" y1="20" x2={svgWidth} y2="20" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="65" x2={svgWidth} y2="65" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="110" x2={svgWidth} y2="110" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="155" x2={svgWidth} y2="155" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="195" x2={svgWidth} y2="195" stroke="#CBD5E1" strokeWidth="1.5" />

                                    {/* LÍNEA Year 2 Ago (Slate Neutro) */}
                                    {line2024.pathD && (
                                        <path
                                            d={line2024.pathD}
                                            fill="none"
                                            stroke="#94A3B8"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    )}

                                    {/* LÍNEA Year 1 Ago (Cian Fresco) */}
                                    {line2025.pathD && (
                                        <path
                                            d={line2025.pathD}
                                            fill="none"
                                            stroke="#06B6D4"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                        />
                                    )}

                                    {/* LÍNEA Current Year (Índigo Ejecutivo) */}
                                    {line2026.pathD && (
                                        <path
                                            d={line2026.pathD}
                                            fill="none"
                                            stroke="#6366F1"
                                            strokeWidth="4.5"
                                            strokeLinecap="round"
                                        />
                                    )}

                                    {/* NODOS Year 2 Ago */}
                                    {line2024.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <circle key={`p24-${i}`} cx={pt.x} cy={pt.y} r="4.5" fill="#94A3B8" stroke="#FFFFFF" strokeWidth="2" />
                                        )
                                    ))}

                                    {/* NODOS Year 1 Ago */}
                                    {line2025.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <circle key={`p25-${i}`} cx={pt.x} cy={pt.y} r="5.5" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" />
                                        )
                                    ))}

                                    {/* NODOS Current Year */}
                                    {line2026.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <g key={`p26-${i}`}>
                                                <circle cx={pt.x} cy={pt.y} r="6.5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2.5" />
                                                <circle cx={pt.x} cy={pt.y} r="2.5" fill="#FFFFFF" />
                                            </g>
                                        )
                                    ))}
                                </svg>
                            </div>
                        )}

                        {/* ESTILO 3: ÁREAS SUPERPUESTAS ALINEADAS (PALETA ARMÓNICA) */}
                        {chartStyle === 'area' && (
                            <div className="w-full h-full pl-12 pr-12 relative">
                                <svg
                                    className="w-full h-full overflow-visible"
                                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                    preserveAspectRatio="none"
                                >
                                    {/* ÁREA Current Year */}
                                    {line2026.pathD && (
                                        <path
                                            d={`${line2026.pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`}
                                            fill="rgba(99, 102, 241, 0.18)"
                                        />
                                    )}
                                    {line2026.pathD && (
                                        <path
                                            d={line2026.pathD}
                                            fill="none"
                                            stroke="#6366F1"
                                            strokeWidth="3.5"
                                        />
                                    )}
                                    {line2026.points.map((pt, i) => (
                                        pt.val > 0 && (
                                            <circle key={`p26-a-${i}`} cx={pt.x} cy={pt.y} r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
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

                {/* TABLA INFERIOR DE DETALLE HORARIO CON COLORES ARMÓNICOS */}
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
                                    <th className="py-3 px-3 text-right text-indigo-900">
                                        <span className="inline-flex items-center justify-end gap-1.5 font-black">
                                            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span> {currentYear} (Bs.)
                                        </span>
                                    </th>
                                    <th className="py-3 px-3 text-right text-indigo-900 font-black">🎟️ {currentYear} (Ord.)</th>
                                    <th className="py-3 px-3 text-right text-cyan-900">
                                        <span className="inline-flex items-center justify-end gap-1.5 font-black">
                                            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span> {year1Ago} (Bs.)
                                        </span>
                                    </th>
                                    <th className="py-3 px-3 text-right text-cyan-900 font-black">🎫 {year1Ago} (Ord.)</th>
                                    <th className="py-3 px-3 text-right text-slate-700">
                                        <span className="inline-flex items-center justify-end gap-1.5 font-black">
                                            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span> {year2Ago} (Bs.)
                                        </span>
                                    </th>
                                    <th className="py-3 px-3 text-center">📈 Var. {String(currentYear).slice(-2)} vs {String(year1Ago).slice(-2)}</th>
                                    <th className="py-3 px-3 text-center">📊 Var. {String(currentYear).slice(-2)} vs {String(year2Ago).slice(-2)}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {visibleHourlyData.map((h) => {
                                    const var1Ago = h.v2025 > 0 ? (((h.v2026 - h.v2025) / h.v2025) * 100).toFixed(1) : null;
                                    const var2Ago = h.v2024 > 0 ? (((h.v2026 - h.v2024) / h.v2024) * 100).toFixed(1) : null;

                                    return (
                                        <tr key={h.hora} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-3 px-3 font-black text-slate-900">{h.hora}</td>
                                            <td className="py-3 px-3 text-right font-black text-indigo-950">{formatBs(h.v2026)}</td>
                                            <td className="py-3 px-3 text-right font-extrabold text-indigo-800">{h.ord2026} ord.</td>
                                            <td className="py-3 px-3 text-right font-bold text-sky-900">{formatBs(h.v2025)}</td>
                                            <td className="py-3 px-3 text-right font-semibold text-sky-700">{h.ord2025} ord.</td>
                                            <td className="py-3 px-3 text-right font-semibold text-slate-600">{formatBs(h.v2024)}</td>
                                            <td className="py-3 px-3 text-center">
                                                {var1Ago !== null ? (
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                        Number(var1Ago) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {Number(var1Ago) >= 0 ? '+' : ''}{var1Ago}%
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {var2Ago !== null ? (
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                        Number(var2Ago) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {Number(var2Ago) >= 0 ? '+' : ''}{var2Ago}%
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
                    <span>Última actualización: <strong>{data?.ultima_actualizacion || new Date().toLocaleTimeString('es-BO')}</strong></span>
                </div>
            </div>

        </div>
    );
};
