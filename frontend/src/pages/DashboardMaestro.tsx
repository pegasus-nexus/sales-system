import { useState, useEffect, memo } from 'react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { getAnalyticsDashboardV3, getSucursales } from '../api/api';
import {
    LayoutDashboard, DollarSign,
    Package, AlertTriangle, Loader2,
    Activity, CheckCircle2, Bot, ChevronDown,
    RefreshCw, Download, Maximize2, Minimize2, Clock, Layers, FileSpreadsheet, RotateCcw, Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import HourlyMultiyearChartRaw from '../components/HourlyMultiyearChart';
import SpecialDatesChartRaw from '../components/SpecialDatesChart';
import RegionalAndProductMixRaw from '../components/RegionalAndProductMix';
import SalesPercentileTrackerRaw from '../components/SalesPercentileTracker';
import WeeklyHourlyChartRaw from '../components/WeeklyHourlyChart';

const HourlyMultiyearChart = memo(HourlyMultiyearChartRaw);
const SpecialDatesChart = memo(SpecialDatesChartRaw);
const RegionalAndProductMix = memo(RegionalAndProductMixRaw);
const SalesPercentileTracker = memo(SalesPercentileTrackerRaw);
const WeeklyHourlyChart = memo(WeeklyHourlyChartRaw);

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const formatBs = (num?: number) => `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


export interface DesgloseSucursal {
    ingresos: number;
    comision: number;
    margenRetail: number;
    margenNeto: number;
    ticketMedio: number;
    visitas: number;
}
export type DesgloseSucursales = Record<string, DesgloseSucursal>;


interface VentasCardProps {
    ventasBrutas: number;
    desgloseSucursales?: DesgloseSucursales;
    showBreakdown: boolean;
    setShowBreakdown: (val: boolean) => void;
    formatBs: (num?: number) => string;
}

const VentasCard = memo((props: VentasCardProps) => {
    const { ventasBrutas, desgloseSucursales, showBreakdown, setShowBreakdown, formatBs } = props;
    console.log("RENDER VENTASCARD", {
        ventasBrutas,
        timestamp: new Date().toISOString()
    });

    return (
        <div className="bg-[#7b75a6] rounded-3xl p-6 shadow-md flex flex-col justify-between text-white h-full min-h-[295px] select-none border border-white/10 transition-all hover:shadow-lg">
            {/* Header */}
            <div className="pb-3 border-b border-white/20 flex justify-between items-center">
                <div>
                    <span className="text-base font-black uppercase tracking-wider opacity-95 block">Ingresos Totales</span>
                    <span className="text-xs font-semibold opacity-80 mt-0.5 block">Global</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
            
            {/* Cifra Gigante Centrada Visualmente (+40-50% más grande) */}
            <div className="my-auto py-4 text-center sm:text-left flex flex-col justify-center">
                <h2 className="text-4xl xl:text-5xl font-black tracking-tight drop-shadow-md leading-none">{formatBs(ventasBrutas)}</h2>
                <p className="text-xs font-bold opacity-90 mt-2">Ventas Brutas Acumuladas</p>
                
                {showBreakdown && desgloseSucursales && Object.keys(desgloseSucursales).length > 0 && (
                    <div className="mt-3 space-y-1.5 bg-white/10 p-2.5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 text-left">
                        {Object.entries(desgloseSucursales).map(([nombre, datos]) => (
                            <div key={nombre} className="flex justify-between items-center text-xs text-white/90">
                                <span className="font-semibold">{nombre}</span>
                                <span className="font-bold text-white">{formatBs(datos.ingresos)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                <button 
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity uppercase tracking-wider text-xs font-extrabold"
                >
                    <span>Desglose por tienda</span>
                    <ChevronDown size={14} className={cn("transition-transform", showBreakdown && "rotate-180")} />
                </button>
            </div>
        </div>
    );
});

VentasCard.displayName = 'VentasCard';

interface MargenCardProps {
    comisionMatriz: number;
    margenRetail: number;
    margenLiquido: number;
    revenueGrowth: number;
    desgloseSucursales?: DesgloseSucursales;
    showDetails: boolean;
    setShowDetails: (val: boolean) => void;
    formatBs: (num?: number) => string;
}

const MargenCard = memo(({ comisionMatriz, margenRetail, margenLiquido, revenueGrowth, desgloseSucursales, showDetails, setShowDetails, formatBs }: MargenCardProps) => {
    const entries = desgloseSucursales ? Object.values(desgloseSucursales) : [];
    const hasBranches = entries.length > 0;

    const totalComision   = hasBranches ? entries.reduce((a, d) => a + d.comision,    0) : comisionMatriz;
    const totalRetail     = hasBranches ? entries.reduce((a, d) => a + d.margenRetail, 0) : margenRetail;
    const totalMargen     = hasBranches ? entries.reduce((a, d) => a + d.margenNeto,   0) : margenLiquido;
    const totalVentas     = hasBranches ? entries.reduce((a, d) => a + d.ingresos,     0) : 0;
    const margenPct       = totalVentas > 0 ? (totalMargen / totalVentas) * 100 : (revenueGrowth || 0);

    return (
        <div className="bg-[#fbfafd] rounded-3xl p-6 shadow-md border border-slate-200/80 flex flex-col justify-between h-full min-h-[295px] select-none transition-all hover:shadow-lg">
            {/* Header */}
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <span className="text-base font-black text-slate-900 uppercase tracking-wider block">Margen Líquido</span>
                    <span className="text-xs font-semibold text-slate-400 mt-0.5 block">Ganancia Neta</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    +{(margenPct || 0).toFixed(1)}%
                </span>
            </div>
            
            {/* Cifra Gigante Centrada Visualmente (+40-50% más grande) */}
            <div className="my-auto py-4 text-center sm:text-left flex flex-col justify-center">
                <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-none">{formatBs(totalMargen)}</h2>
                <p className="text-xs font-bold text-slate-500 mt-2 truncate">
                    Comisión: {formatBs(totalComision)} • Retail: {formatBs(totalRetail)}
                </p>

                {showDetails && desgloseSucursales && Object.keys(desgloseSucursales).length > 0 && (
                    <div className="mt-3 space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 animate-in fade-in slide-in-from-top-2 text-left">
                        {Object.entries(desgloseSucursales).map(([nombre, datos]) => (
                            <div key={nombre} className="flex justify-between items-center text-xs text-slate-700">
                                <span className="font-semibold">{nombre}</span>
                                <span className="font-bold text-slate-900">{formatBs(datos.margenNeto)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider text-xs font-extrabold"
                >
                    <span>Desglose por tienda</span>
                    <ChevronDown size={14} className={cn("transition-transform", showDetails && "rotate-180")} />
                </button>
            </div>
        </div>
    );
});

MargenCard.displayName = 'MargenCard';

interface TicketMedioCardProps {
    ticketMedio: number;
    desgloseSucursales?: DesgloseSucursales;
    showDetails: boolean;
    setShowDetails: (val: boolean) => void;
    formatBs: (num?: number) => string;
}

const TicketMedioCard = memo(({ ticketMedio, desgloseSucursales, showDetails, setShowDetails, formatBs }: TicketMedioCardProps) => {
    return (
        <div className="bg-[#f3faeb] rounded-3xl p-6 shadow-md border border-[#e8f1df] flex flex-col justify-between h-full min-h-[295px] select-none transition-all hover:shadow-lg">
            {/* Header */}
            <div className="pb-3 border-b border-[#d3e2cd] flex justify-between items-center">
                <div>
                    <span className="text-base font-black text-[#455c45] uppercase tracking-wider block">Ticket Medio</span>
                    <span className="text-xs font-semibold text-[#455c45]/70 mt-0.5 block">Promedio Global</span>
                </div>
            </div>
            
            {/* Cifra Gigante Centrada Visualmente (+40-50% más grande) */}
            <div className="my-auto py-4 text-center sm:text-left flex flex-col justify-center">
                <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-[#3a443a] leading-none">{formatBs(ticketMedio)}</h2>
                <p className="text-xs font-bold text-[#455c45]/90 mt-2">Gasto promedio por cliente</p>

                {showDetails && desgloseSucursales && Object.keys(desgloseSucursales).length > 0 && (
                    <div className="mt-3 space-y-1.5 bg-white/70 p-2.5 rounded-2xl border border-[#d3e2cd] animate-in fade-in slide-in-from-top-2 text-left">
                        {Object.entries(desgloseSucursales).map(([nombre, datos]) => (
                            <div key={nombre} className="flex justify-between items-center text-xs text-[#455c45]">
                                <span className="font-semibold">{nombre}</span>
                                <span className="font-bold text-[#2d362d]">{formatBs(datos.ticketMedio)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="pt-3 border-t border-[#d3e2cd] flex justify-between items-center">
                <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 text-[#455c45] hover:opacity-80 transition-opacity uppercase tracking-wider text-xs font-extrabold"
                >
                    <span>Desglose por tienda</span>
                    <ChevronDown size={14} className={cn("transition-transform", showDetails && "rotate-180")} />
                </button>
            </div>
        </div>
    );
});

TicketMedioCard.displayName = 'TicketMedioCard';

interface TicketClienteCardProps {
    totalOrders: number;
    desgloseSucursales?: DesgloseSucursales;
    showDetails: boolean;
    setShowDetails: (val: boolean) => void;
}

const TicketClienteCard = memo(({ totalOrders, desgloseSucursales, showDetails, setShowDetails }: TicketClienteCardProps) => {
    const branchSummaryLine = desgloseSucursales && Object.keys(desgloseSucursales).length > 0
        ? Object.entries(desgloseSucursales).map(([nombre, datos]) => `${nombre}: ${datos.visitas}`).join(' • ')
        : null;

    return (
        <div className="bg-[#fcf5f1] rounded-3xl p-6 shadow-md border border-[#f3e7e0] flex flex-col justify-between h-full min-h-[295px] select-none transition-all hover:shadow-lg">
            {/* Header */}
            <div className="pb-3 border-b border-[#e8dacd] flex justify-between items-center">
                <div>
                    <span className="text-base font-black text-[#b56d47] uppercase tracking-wider block">Total de Visitas</span>
                    <span className="text-xs font-semibold text-[#c78b66] mt-0.5 block">Ticket Cliente</span>
                </div>
            </div>
            
            {/* Cifra Gigante Centrada Visualmente (+40-50% más grande) */}
            <div className="my-auto py-4 text-center sm:text-left flex flex-col justify-center">
                <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-[#bd754e] leading-none">{totalOrders}</h2>
                <p className="text-xs font-bold text-[#b56d47]/90 mt-2">Clientes atendidos</p>
                {branchSummaryLine && (
                    <p className="text-[10px] font-bold text-[#b56d47]/90 mt-1 truncate">
                        {branchSummaryLine}
                    </p>
                )}

                {showDetails && desgloseSucursales && Object.keys(desgloseSucursales).length > 0 && (
                    <div className="mt-3 space-y-1.5 bg-white/70 p-2.5 rounded-2xl border border-[#e8dacd] animate-in fade-in slide-in-from-top-2 text-left">
                        {Object.entries(desgloseSucursales).map(([nombre, datos]) => (
                            <div key={nombre} className="flex justify-between items-center text-xs text-[#b56d47]">
                                <span className="font-semibold">{nombre}</span>
                                <span className="font-bold text-[#a65f3a]">{datos.visitas} Tickets</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="pt-3 border-t border-[#e8dacd] flex justify-between items-center">
                <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 text-[#b56d47] hover:opacity-80 transition-opacity uppercase tracking-wider text-xs font-extrabold"
                >
                    <span>Desglose por tienda</span>
                    <ChevronDown size={14} className={cn("transition-transform", showDetails && "rotate-180")} />
                </button>
            </div>
        </div>
    );
});

TicketClienteCard.displayName = 'TicketClienteCard';

interface AiCardProps {
    ventasBrutas: number;
    climaEvento: string;
    formatBs: (num?: number) => string;
}

const AiCard = memo(({ ventasBrutas, climaEvento, formatBs }: AiCardProps) => {
    const actual = ventasBrutas || 0;
    const meta = actual * (climaEvento ? 1.15 : 1.05);
    const porcentaje = meta > 0 ? (actual / meta) * 100 : 0;

    return (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 shadow-md border border-indigo-500/30 text-white flex flex-col justify-between h-full min-h-[295px] select-none transition-all relative overflow-hidden hover:shadow-lg">
            {/* Header */}
            <div className="pb-3 border-b border-indigo-500/20 flex justify-between items-center relative z-10">
                <div>
                    <span className="text-base font-black uppercase tracking-wider text-indigo-100 block">Impacto IA</span>
                    <span className="text-xs font-semibold text-indigo-300 mt-0.5 block">Proyección</span>
                </div>
                {climaEvento && <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>}
            </div>
            
            {/* Cifra Gigante Centrada Visualmente (+40-50% más grande) */}
            <div className="my-auto py-4 relative z-10 text-center sm:text-left flex flex-col justify-center">
                <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-white drop-shadow-md leading-none">{formatBs(meta)}</h2>
                <div className="mt-3 space-y-1.5 text-left">
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-emerald-400 to-indigo-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-indigo-200 font-bold pt-0.5">
                        <span>Progreso: {(porcentaje || 0).toFixed(1)}%</span>
                        <span>Objetivo: {formatBs(meta)}</span>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="pt-3 border-t border-indigo-500/20 flex justify-between items-center relative z-10">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Meta Ajustada</span>
                <span className="text-xs font-bold bg-indigo-500/20 text-indigo-200 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-indigo-400/30">
                    Motor IA
                </span>
            </div>
        </div>
    );
});

AiCard.displayName = 'AiCard';



const getDynamicPeriodText = (customStart: Date | null, customEnd: Date | null) => {
    const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (customStart) {
        if (customEnd && customEnd.getTime() !== customStart.getTime()) {
            return `del ${formatDate(customStart)} al ${formatDate(customEnd)}`;
        }
        return `el ${formatDate(customStart)}`;
    }
    
    return 'RANGO DE FECHAS';
};

export default function DashboardMaestro() {
    const { role } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [data, setData] = useState<any>(null);
    const [climaEvento, setClimaEvento] = useState('');
    const [isBackendOffline, setIsBackendOffline] = useState(false);
    const [selectedSucursal] = useState('all');
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
    const [showMargenDetails, setShowMargenDetails] = useState(false);
    const [showTicketMedioDetails, setShowTicketMedioDetails] = useState(false);
    const [showTicketClienteDetails, setShowTicketClienteDetails] = useState(false);

    const [lastSyncTime, setLastSyncTime] = useState<string>('');
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);


    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(), new Date()]);
    const [startDate, endDate] = dateRange;
    const [activeQuickBtn, setActiveQuickBtn] = useState<'today' | 'yesterday' | '30days' | null>('today');
    
    const [dates, setDates] = useState({ start: '2024-01-01T00:00:00.000Z', end: '2026-12-31T23:59:59.000Z' });

    const handleExportCSV = () => {
        if (!data || !data.overview) {
            toast.error("No hay datos disponibles para exportar.");
            return;
        }
        const rows = [
            ["Metrica", "Valor"],
            ["Ventas Brutas", data.overview.ventas_brutas || 0],
            ["Margen Liquido", data.overview.margen_liquido || 0],
            ["Comision Matriz", data.overview.comision_matriz || 0],
            ["Margen Retail", data.overview.margen_retail || 0],
            ["Ticket Medio", data.overview.ticket_medio || 0],
            ["Total Ordenes", data.overview.total_orders || 0],
            [""],
            ["Sucursal", "Ingresos", "Margen Neto", "Ticket Medio", "Visitas"]
        ];

        if (data.desgloseSucursales) {
            Object.entries(data.desgloseSucursales).forEach(([suc, datos]: [string, any]) => {
                rows.push([suc, datos.ingresos, datos.margenNeto, datos.ticketMedio, datos.visitas]);
            });
        }

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Panel_General_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Reporte CSV descargado exitosamente.");
        setShowExportDropdown(false);
    };

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
        }
    };

    const handleResetFilters = () => {
        setQuickDate('today');
        setClimaEvento('');
        toast.info("Filtros restablecidos a Hoy.");
    };



    
    const handleApplyDates = () => {
        if (startDate) {
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            
            const e = endDate ? new Date(endDate) : new Date(startDate);
            e.setHours(23, 59, 59, 999);

            console.log("SETDATES");
            console.log({ start: s.toISOString(), end: e.toISOString() });
            console.trace();
            setDates({ start: s.toISOString(), end: e.toISOString() });
        }
    };

    const setQuickDate = (type: 'today' | 'yesterday' | '30days') => {
        const today = new Date();
        let start: Date;
        let end: Date;

        if (type === 'today') {
            start = today;
            end = today;
            setDateRange([today, null]);
        } else if (type === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            start = yesterday;
            end = yesterday;
            setDateRange([yesterday, null]);
        } else {
            const past = new Date(today);
            past.setDate(today.getDate() - 29);
            start = past;
            end = today;
            setDateRange([past, today]);
        }
        setActiveQuickBtn(type);

        const s = new Date(start);
        s.setHours(0, 0, 0, 0);

        const e = new Date(end);
        e.setHours(23, 59, 59, 999);

        setDates({ start: s.toISOString(), end: e.toISOString() });
    };

    // Aplicar las fechas iniciales
    useEffect(() => {
        handleApplyDates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSucursal]);

    useEffect(() => {
        getSucursales(false).then(setSucursales).catch(console.error);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            setIsError(false);
            setIsBackendOffline(false);
            try {
                console.log("REQUEST DASHBOARD", {
                    start: dates.start,
                    end: dates.end,
                    selectedSucursal,
                    timeRange: 'custom',
                    now: new Date().toISOString()
                });
                const res = await getAnalyticsDashboardV3(
                    dates.start,
                    dates.end,
                    selectedSucursal === 'all' ? undefined : selectedSucursal
                );
                if (isMounted) {
                    console.log("RESPONSE DASHBOARD", {
                        ventas: (res as any)?.overview?.ventas_brutas,
                        start: dates.start,
                        end: dates.end
                    });
                    setData(res);
                    setLastSyncTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                }
            } catch (err: any) {
                if (isMounted) {
                    // Detectar si es error de conexión (backend apagado)
                    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
                        setIsBackendOffline(true);
                        toast.error("Error crítico: No se pudo contactar al servidor. Revisa tu conexión o inicia el backend.");
                    } else {
                        toast.error("Ocurrió un error al cargar las métricas financieras.");
                    }
                    setIsError(true);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [climaEvento, dates, selectedSucursal]);

    useEffect(() => {
        console.log("RENDER NUEVO");
        console.log({
            start: dates.start,
            end: dates.end,
            selectedSucursal,
            overview: data?.overview,
            ventasBrutas: data?.overview?.ventas_brutas,
            desglose: data?.desgloseSucursales
        });
    }, [data, dates, selectedSucursal]);

    const esAdmin = ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN'].includes(role || '');

    if (!esAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <AlertTriangle className="text-amber-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
                <p className="text-gray-500">Solo administradores ejecutivos pueden ver el Dashboard Maestro.</p>
            </div>
        );
    }
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-center max-w-lg mx-auto mt-12">
                <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6 border-2 border-red-100">
                    <AlertTriangle className="text-red-400" size={40} />
                </div>
                {isBackendOffline ? (
                    <>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">Servidor Offline</h2>
                        <p className="text-gray-500 mb-2 font-medium">El backend no está corriendo en el puerto <code className="bg-gray-100 px-2 py-0.5 rounded-lg text-indigo-600 font-bold">8001</code>.</p>
                        <p className="text-gray-400 text-sm mb-6">Para iniciar el sistema, haz <strong>doble clic</strong> en el archivo:</p>
                        <div className="bg-slate-900 text-emerald-400 font-mono text-sm px-6 py-4 rounded-2xl w-full mb-8 text-left">
                            <span className="text-slate-500">SalesSystem/</span><span className="font-bold">start.bat</span>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                        >
                            <Activity size={18} /> Reintentar conexión
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">Error cargando datos</h2>
                        <p className="text-gray-500 mb-6">Ocurrió un error en el servidor. Revisa la consola del backend.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                        >
                            <Activity size={18} /> Reintentar
                        </button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-[90rem] mx-auto px-6 md:px-8 space-y-6 pb-24">

            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3 tracking-tight whitespace-nowrap">
                            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-lg shadow-indigo-200">
                                <LayoutDashboard size={28} />
                            </div>
                            Panel General — Día a Día
                        </h1>
                        <p className="text-gray-500 mt-2 text-base font-medium flex flex-wrap items-center gap-2">
                            <Activity size={16} className="text-emerald-500" />
                            <span>Orquestación en tiempo real sobre <strong>~110,482 Registros Históricos</strong>.</span>
                            {lastSyncTime && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full ml-2">
                                    <Clock size={12} /> Sync: {lastSyncTime}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Toolbar de Acciones Rápidas */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => handleApplyDates()}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-sm transition-all"
                            title="Refrescar métricas del backend"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin text-indigo-600" : "text-gray-500"} />
                            <span>Actualizar</span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                title="Exportar reporte"
                            >
                                <Download size={14} />
                                <span>Exportar</span>
                                <ChevronDown size={12} />
                            </button>

                            {showExportDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in slide-in-from-top-2">
                                    <button
                                        onClick={handleExportCSV}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                                    >
                                        <FileSpreadsheet size={14} className="text-emerald-600" /> Exportar a CSV / Excel
                                    </button>
                                    <button
                                        onClick={() => { window.print(); setShowExportDropdown(false); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                                    >
                                        <Download size={14} className="text-indigo-600" /> Imprimir Reporte (PDF)
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleResetFilters}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-sm transition-all"
                            title="Restablecer filtros a valores por defecto"
                        >
                            <RotateCcw size={14} className="text-gray-500" />
                            <span className="hidden sm:inline">Restablecer</span>
                        </button>

                        <button
                            onClick={handleToggleFullscreen}
                            className="p-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 shadow-sm transition-all"
                            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full border-t border-gray-100 pt-5">

                    {/* Segmented Control Rango (Sin Fondo) */}
                    <div className="flex gap-2 items-center overflow-x-auto w-full lg:w-auto custom-scrollbar relative">

                        {/* Botones rápidos */}
                        <button 
                            onClick={() => setQuickDate('today')} 
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all", activeQuickBtn === 'today' ? "bg-white text-indigo-700 shadow-sm border border-gray-200/50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50")}
                        >
                            Hoy
                        </button>
                        <button 
                            onClick={() => setQuickDate('yesterday')} 
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all", activeQuickBtn === 'yesterday' ? "bg-white text-indigo-700 shadow-sm border border-gray-200/50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50")}
                        >
                            Ayer
                        </button>
                        <button 
                            onClick={() => setQuickDate('30days')} 
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all", activeQuickBtn === '30days' ? "bg-white text-indigo-700 shadow-sm border border-gray-200/50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50")}
                        >
                            30 Días
                        </button>

                        <div className="w-px bg-gray-300 mx-1 my-1 h-6"></div>

                        {/* Rango de Fechas Personalizado (react-datepicker) */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg transition-all bg-white shadow-sm border border-gray-200/50 z-50">
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate || undefined}
                                endDate={endDate || undefined}
                                onChange={(update) => {
                                    const [start, end] = update;
                                    if (start && end && start.getTime() === end.getTime()) {
                                        setDateRange([start, null]);
                                    } else {
                                        setDateRange(update);
                                    }
                                    setActiveQuickBtn(null);
                                }}
                                onKeyDown={(e) => e.preventDefault()}
                                dateFormat="MM/dd/yyyy"
                                className="bg-transparent text-sm outline-none font-bold cursor-pointer transition-colors w-[190px] text-center text-indigo-700"
                                placeholderText="Seleccionar fecha(s)"
                                isClearable={false}
                                portalId="root"
                            />
                        </div>

                        <button 
                            onClick={handleApplyDates}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all ml-1"
                        >
                            Aplicar
                        </button>
                    </div>

                    {/* Filtro Clima / Evento AI */}
                    <div className="relative group w-full lg:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Bot size={18} className="text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={climaEvento}
                            onChange={(e) => setClimaEvento(e.target.value)}
                            placeholder="Ajuste AI (Ej: Lluvia)"
                            className="w-full lg:w-56 pl-10 pr-4 py-2.5 bg-white border-2 border-indigo-50/50 hover:border-indigo-200 focus:border-indigo-500 rounded-xl font-bold text-sm text-indigo-950 shadow-sm transition-all outline-none"
                        />
                        {climaEvento && (
                            <span className="absolute -top-2.5 right-2 bg-indigo-600 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                Aplicando
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Header Ejecutivo - Barra Superior Horizontal (5 Columnas de Igual Ancho, Texto Centrado, Líneas Verticales Sutiles) */}
            <div className="w-full bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm mb-4 min-h-[64px] flex items-center overflow-hidden">
                <div className="w-full grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 text-center py-2.5">
                    {/* Columna 1: FECHA */}
                    <div className="px-3 py-1 flex flex-col items-center justify-center min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">FECHA</span>
                        <span className="text-xs font-black text-slate-800 block truncate">{getDynamicPeriodText(startDate, endDate)}</span>
                    </div>

                    {/* Columna 2: ESTADO */}
                    <div className="px-3 py-1 flex flex-col items-center justify-center min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">ESTADO</span>
                        <span className="text-xs font-black text-emerald-700 block truncate">Datos sincronizados con POS</span>
                    </div>

                    {/* Columna 3: ÚLTIMA ACTUALIZACIÓN */}
                    <div className="px-3 py-1 flex flex-col items-center justify-center min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">ÚLTIMA ACTUALIZACIÓN</span>
                        <span className="text-xs font-black text-slate-800 block truncate">{lastSyncTime || new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    {/* Columna 4: MODO */}
                    <div className="px-3 py-1 flex flex-col items-center justify-center min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">MODO</span>
                        <span className="text-xs font-black text-indigo-700 block truncate">Comparativa Multi-Año activa</span>
                    </div>

                    {/* Columna 5: SUCURSALES */}
                    <div className="px-3 py-1 flex flex-col items-center justify-center min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">SUCURSALES</span>
                        <span className="text-xs font-black text-slate-800 block truncate">
                            {selectedSucursal !== 'all' ? (sucursales.find(s => s.id === selectedSucursal)?.nombre || selectedSucursal) : 'Heroínas • Recoleta • Calacoto'}
                        </span>
                    </div>
                </div>
            </div>

            {isLoading && !data ? (
                <div className="flex flex-col justify-center items-center py-32 space-y-4">
                    <Loader2 size={48} className="animate-spin text-indigo-600 mb-2" />
                    <p className="text-indigo-900 font-bold tracking-widest text-sm uppercase animate-pulse">
                        Calculando Métricas Globales...
                    </p>
                </div>
            ) : isError || (!data && !isLoading) ? (
                <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <h3 className="font-bold">Error obteniendo métricas ejecutivas</h3>
                </div>
            ) : (
                <div className={cn("space-y-10 transition-opacity duration-500", isLoading ? "opacity-50 pointer-events-none" : "opacity-100")}>


                    {/* SECCIÓN 1: KPIS FINANCIEROS (5 Tarjetas en 1 Fila en Desktop) */}
                    <div id="sec-kpis" className="space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <VentasCard 
                                ventasBrutas={data.overview.ventas_brutas}
                                desgloseSucursales={data?.desgloseSucursales}
                                showBreakdown={showRevenueBreakdown}
                                setShowBreakdown={setShowRevenueBreakdown}
                                formatBs={formatBs}
                            />

                            <MargenCard 
                                comisionMatriz={data.overview.comision_matriz}
                                margenRetail={data.overview.margen_retail}
                                margenLiquido={data.overview.margen_liquido}
                                revenueGrowth={data.overview.revenue_growth}
                                desgloseSucursales={data?.desgloseSucursales}
                                showDetails={showMargenDetails}
                                setShowDetails={setShowMargenDetails}
                                formatBs={formatBs}
                            />

                            <TicketMedioCard 
                                ticketMedio={data.overview.ticket_medio}
                                desgloseSucursales={data?.desgloseSucursales}
                                showDetails={showTicketMedioDetails}
                                setShowDetails={setShowTicketMedioDetails}
                                formatBs={formatBs}
                            />

                            <TicketClienteCard 
                                totalOrders={data.overview.total_orders}
                                desgloseSucursales={data?.desgloseSucursales}
                                showDetails={showTicketClienteDetails}
                                setShowDetails={setShowTicketClienteDetails}
                            />

                            <AiCard 
                                ventasBrutas={data.overview.ventas_brutas}
                                climaEvento={climaEvento}
                                formatBs={formatBs}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: COMPARATIVA HORARIA MULTI-AÑO */}
                    <div id="sec-comparativa" className="space-y-4 pt-2">
                        <div className="border-b border-gray-100 pb-2">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Activity className="text-purple-600" size={18} /> Comparativa Horaria Multi-Año
                            </h2>
                        </div>
                        <HourlyMultiyearChart 
                            fechaRefProp={startDate ? startDate.toLocaleDateString('sv-SE') : (dates.start ? dates.start.split('T')[0] : undefined)}
                            sucursalProp={selectedSucursal === 'all' ? '' : selectedSucursal}
                        />
                    </div>

                    {/* SECCIÓN 2.1: COMPARATIVA HORARIA SEMANAL MULTI-AÑO (NUEVA SECCIÓN) */}
                    <div id="sec-semanal" className="space-y-4 pt-4">
                        <div className="border-b border-indigo-100 pb-2 flex items-center justify-between">
                            <h2 className="text-lg font-black text-indigo-900 flex items-center gap-2">
                                <Clock className="text-indigo-600" size={18} /> Comparativa Horaria Semanal Multi-Año (Semana Actual / Día Equivalente)
                            </h2>
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                Nueva Sección Activa
                            </span>
                        </div>
                        <WeeklyHourlyChart sucursalProp={selectedSucursal} />
                    </div>

                    {/* SECCIÓN 2.5: FECHAS ESPECIALES */}
                    <div id="sec-fechas" className="space-y-4 pt-2">
                        <SpecialDatesChart />
                    </div>

                    {/* SECCIÓN 3: BENCHMARK HISTÓRICO */}
                    <div id="sec-radar" className="space-y-4 pt-2">
                        <div className="border-b border-gray-100 pb-2">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-600" size={18} /> Benchmark Histórico
                            </h2>
                        </div>
                        <SalesPercentileTracker />
                    </div>

                    {/* SECCIÓN 4: RENDIMIENTO REGIONAL */}
                    <div id="sec-regional" className="space-y-4 pt-2">
                        <div className="border-b border-gray-100 pb-2">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Layers className="text-cyan-600" size={18} /> Rendimiento Comparativo por Sucursal
                            </h2>
                        </div>
                        <RegionalAndProductMix />
                    </div>

                    {/* SECCIÓN 5: EVENTOS EN TIEMPO REAL */}
                    {data.recent_activity?.length > 0 && (
                        <div id="sec-eventos" className="space-y-4 pt-2">
                            <div className="border-b border-gray-100 pb-2">
                                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <Zap className="text-sky-500" size={18} /> Eventos en Tiempo Real
                                </h2>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
                                <div className="flex gap-4 min-w-max">
                                    {data.recent_activity.map((act: any) => (
                                        <div key={act.id} className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex items-center gap-4 hover:bg-white hover:shadow-md transition-all group w-[300px]">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                                act.type === 'sale' ? 'bg-emerald-100 text-emerald-600' :
                                                act.type === 'inventory' ? 'bg-amber-100 text-amber-600' :
                                                act.type === 'goal' ? 'bg-indigo-100 text-indigo-600' :
                                                'bg-rose-100 text-rose-600'
                                            )}>
                                                {act.type === 'sale' && <DollarSign size={18} />}
                                                {act.type === 'inventory' && <Package size={18} />}
                                                {act.type === 'goal' && <CheckCircle2 size={18} />}
                                                {act.type === 'alert' && <AlertTriangle size={18} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">{act.time}</span>
                                                    <span className="font-black text-xs text-indigo-950">{act.val}</span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-700 truncate mt-0.5">{act.msg}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
