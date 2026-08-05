import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import { getHourlyMultiyear } from '../api/api';
import {
    ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { 
    Calendar, Loader2, 
    Clock, Zap, FileSpreadsheet
} from 'lucide-react';
import { useOnClickOutside } from 'usehooks-ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers & Festividades
// ───────────────────────────────────────────────────────────────────────────────
const formatBs = (n: number) =>
    `Bs. ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatReadableDate = (dateStr: string) => {
    if (!dateStr || dateStr === "—") return dateStr;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
};

const formatFullReadableDate = (dateStr?: string) => {
    if (!dateStr || dateStr === "—") return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayName = dateObj.toLocaleDateString("es-ES", { weekday: 'short' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace('.', '');
    const monthName = dateObj.toLocaleDateString("es-ES", { month: 'short' });
    return `${capitalizedDay} ${parseInt(d)} ${monthName} ${y}`;
};

const getTodayDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const getEasterSunday = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = Math.floor((h + l - 7 * m + 114) / 31);
    const p = (h + l - 7 * m + 114) % 31;
    return new Date(year, n - 1, p + 1);
};

const getHolidayInfo = (d: Date) => {
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    if (day === 14 && month === 2) return { name: "San Valentín", bg: "bg-red-50 text-red-600 hover:bg-red-100", dot: "bg-red-400" };
    if (day === 19 && month === 3) return { name: "Día del Padre", bg: "bg-blue-50 text-blue-600 hover:bg-blue-100", dot: "bg-blue-400" };
    if (day === 27 && month === 5) return { name: "Día de la Madre", bg: "bg-pink-50 text-pink-600 hover:bg-pink-100", dot: "bg-pink-400" };
    if (day === 1 && month === 5) return { name: "Día del Trabajo", bg: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", dot: "bg-emerald-400" };
    if (day === 6 && month === 8) return { name: "Día de la Patria", bg: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", dot: "bg-emerald-400" };
    if (day === 25 && month === 12) return { name: "Navidad", bg: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", dot: "bg-emerald-400" };
    if (day === 1 && month === 1) return { name: "Año Nuevo", bg: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", dot: "bg-emerald-400" };

    const easter = getEasterSunday(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);

    if (day === goodFriday.getDate() && month === (goodFriday.getMonth() + 1)) {
        return { name: "Viernes Santo", bg: "bg-amber-50 text-amber-700 hover:bg-amber-100", dot: "bg-amber-400" };
    }
    if (day === easter.getDate() && month === (easter.getMonth() + 1)) {
        return { name: "Pascua", bg: "bg-amber-50 text-amber-700 hover:bg-amber-100", dot: "bg-amber-400" };
    }

    return null;
};

// ───────────────────────────────────────────────────────────────────────────────
// Custom Calendar Picker
// ───────────────────────────────────────────────────────────────────────────────
const CustomDatePicker = ({ fechaRef, setFechaRef }: { fechaRef: string, setFechaRef: (f: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useOnClickOutside(ref as RefObject<HTMLElement>, () => setIsOpen(false));

    const [currentMonth, setCurrentMonth] = useState(() => {
        const [y, m] = fechaRef.split('-');
        return new Date(parseInt(y), parseInt(m) - 1, 1);
    });

    useEffect(() => {
        if (!isOpen) {
            const [y, m] = fechaRef.split('-');
            setCurrentMonth(new Date(parseInt(y), parseInt(m) - 1, 1));
        }
    }, [fechaRef, isOpen]);

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const selectedDateObj = new Date(fechaRef + 'T00:00:00');
    const selectedHoliday = getHolidayInfo(selectedDateObj);

    const generateDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const days = generateDays();
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="relative flex items-center gap-2" ref={ref}>
            <div 
                className={`flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border transition-colors rounded-xl px-3 py-1.5 shadow-sm cursor-pointer ${isOpen ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-gray-200'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar size={14} className={selectedHoliday ? selectedHoliday.bg.split(' ')[1] : "text-indigo-600 shrink-0"} />
                <span className={`text-xs font-bold ${selectedHoliday ? selectedHoliday.bg.split(' ')[1] : 'text-gray-800'}`}>
                    {selectedDateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {selectedHoliday && (
                    <span className={`ml-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${selectedHoliday.bg.split(' ')[0]} ${selectedHoliday.bg.split(' ')[1]}`}>
                        {selectedHoliday.name}
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-12 left-0 z-50 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-4 w-[320px] animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            ←
                        </button>
                        <span className="text-xs font-black text-gray-800">
                            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            →
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map((d, i) => (
                            <span key={i} className="text-[10px] font-black text-gray-400 uppercase">{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            if (!day) return <div key={idx} className="h-8" />;

                            const dateStr = day.toISOString().split('T')[0];
                            const isSelected = dateStr === fechaRef;
                            const isToday = dateStr === getTodayDateString();
                            const holiday = getHolidayInfo(day);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setFechaRef(dateStr);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "h-8 text-xs font-semibold rounded-lg flex flex-col items-center justify-center relative transition-all",
                                        isSelected 
                                            ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200" 
                                            : isToday 
                                                ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200" 
                                                : "hover:bg-gray-100 text-gray-700",
                                        holiday && !isSelected && holiday.bg
                                    )}
                                >
                                    <span>{day.getDate()}</span>
                                    {holiday && (
                                        <span className={cn(
                                            "w-1 h-1 rounded-full absolute bottom-1",
                                            isSelected ? "bg-white" : holiday.dot
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────────
// Custom Tooltip Reutilizable
// ───────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const real = data.real || 0;
        const anio1 = data.anio1 || 0;
        const anio2 = data.anio2 || 0;

        const diff1 = real - anio1;
        const pct1 = anio1 > 0 ? ((real - anio1) / anio1) * 100 : 0;

        return (
            <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
                    <span className="font-black text-indigo-400 text-sm flex items-center gap-1.5">
                        <Clock size={14} /> {label} hs
                    </span>
                </div>
                
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center font-bold">
                        <span className="text-indigo-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 2026 (Actual):
                        </span>
                        <span className="text-white text-sm">{formatBs(real)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span> 2025 (-1 Año):
                        </span>
                        <span>{formatBs(anio1)}</span>
                    </div>

                    {anio2 > 0 && (
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-400"></span> 2024 (-2 Años):
                            </span>
                            <span>{formatBs(anio2)}</span>
                        </div>
                    )}

                    {anio1 > 0 && (
                        <div className="pt-2 border-t border-slate-700/80 flex justify-between items-center text-[11px] font-black">
                            <span className="text-slate-400">Variación YoY:</span>
                            <span className={pct1 >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                {pct1 >= 0 ? '▲ +' : '▼ '}{pct1.toFixed(1)}% ({diff1 >= 0 ? '+' : ''}{formatBs(diff1)})
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

// ───────────────────────────────────────────────────────────────────────────────
// Componente principal ÚNICO REUTILIZABLE
// ───────────────────────────────────────────────────────────────────────────────
export interface HourlyMultiyearChartProps {
    modo?: 'dashboard' | 'festividad';
    festividadNombre?: string;
    fechasFestivas?: {
        actual: string;
        past1: string;
        past2: string;
    };
    sucursalProp?: string;
    hideHeaderControls?: boolean;
}

export function HourlyMultiyearChart({
    modo = 'dashboard',
    festividadNombre,
    fechasFestivas,
    sucursalProp,
    hideHeaderControls = false
}: HourlyMultiyearChartProps) {
    const [fechaRef, setFechaRef] = useState<string>(fechasFestivas?.actual || getTodayDateString());
    const [sucursal, setSucursal] = useState<string>(sucursalProp || ''); 
    const [chartData, setChartData] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (sucursalProp !== undefined) {
            setSucursal(sucursalProp);
        }
    }, [sucursalProp]);

    useEffect(() => {
        if (modo === 'festividad' && fechasFestivas?.actual) {
            setFechaRef(fechasFestivas.actual);
        }
    }, [modo, fechasFestivas]);

    const HORAS_OPERACION = [
        "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
        "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
        "20:00", "21:00", "22:00", "23:00"
    ];

    const SUCURSALES = [
        { value: '', label: 'Todas las Sucursales' },
        { value: 'Heroinas', label: 'Heroínas' },
        { value: 'Recoleta', label: 'Recoleta' },
        { value: 'Calacoto', label: 'Calacoto' },
    ];

    const HORAS_OPERACION_REF = HORAS_OPERACION;

    const fetchData = useCallback(async (fecha: string, suc: string) => {
        setIsLoading(true);
        setIsError(false);
        try {
            let res: any;
            if (modo === 'festividad' && fechasFestivas) {
                res = await getHourlyMultiyear(fechasFestivas.actual, suc || undefined, fechasFestivas.past1, fechasFestivas.past2);
            } else {
                res = await getHourlyMultiyear(fecha, suc || undefined);
            }

            const rawHoras: any[] = res?.horas || [];

            const dataByHora = new Map<string, any>();
            for (const item of rawHoras) {
                if (HORAS_OPERACION_REF.includes(item.hora)) {
                    dataByHora.set(item.hora, item);
                }
            }
            const normalizedData = HORAS_OPERACION_REF.map((hora) => (
                dataByHora.get(hora) ?? { hora, real: 0, anio1: 0, anio2: 0 }
            ));

            setChartData(normalizedData);
            setMeta(res?.meta || null);
        } catch (e) {
            console.error('HourlyMultiyear error:', e);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [modo, fechasFestivas]);

    useEffect(() => {
        fetchData(fechaRef, sucursal);
    }, [fechaRef, sucursal, fetchData]);

    const renderedData = chartData;

    const totalVendidoHoy   = meta?.total_real  ?? chartData.reduce((acc, curr) => acc + (curr.real  || 0), 0);
    const totalVendidoAnio1 = meta?.total_a1    ?? chartData.reduce((acc, curr) => acc + (curr.anio1 || 0), 0);
    const totalVendidoAnio2 = meta?.total_a2    ?? chartData.reduce((acc, curr) => acc + (curr.anio2 || 0), 0);

    const handleExportHourlyCSV = useCallback(() => {
        if (!renderedData || renderedData.length === 0) return;
        const headers = ["Hora", "Real_2026", "Anio_2025", "Anio_2024", "Variacion_YoY_Pct", "Diferencia_Bs"];
        const rows = renderedData.map(r => {
            const valReal = r.real || 0;
            const valAnio1 = r.anio1 || 0;
            const diffBs = valReal - valAnio1;
            const pctYoY = valAnio1 > 0 ? (((valReal - valAnio1) / valAnio1) * 100).toFixed(2) : '0';
            return [r.hora, valReal, valAnio1, r.anio2 || 0, `${pctYoY}%`, diffBs];
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `comparativa_horaria_${fechaRef}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [renderedData, fechaRef]);

    const currentHourStr = `${String(new Date().getHours()).padStart(2, '0')}:00`;

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col h-full space-y-5">

            {/* Header Ejecutivo */}
            {!hideHeaderControls && (
                <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl px-5 py-3 shadow-sm flex flex-wrap items-center justify-between gap-4 min-h-[54px]">
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                        <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                                {modo === 'festividad' ? 'Festividad Analizada' : 'Fecha analizada'}
                            </span>
                            <span className="text-xs font-black text-slate-800 block truncate">
                                {modo === 'festividad' && festividadNombre ? `${festividadNombre} (${fechasFestivas?.actual})` : formatReadableDate(fechaRef)}
                            </span>
                        </div>

                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                        <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Alineación Histórica</span>
                            <span className="text-xs font-black text-indigo-700 block truncate">
                                {modo === 'festividad' && fechasFestivas 
                                    ? `Actual: ${fechasFestivas.actual} • -1 Yr: ${fechasFestivas.past1} • -2 Yr: ${fechasFestivas.past2}`
                                    : meta?.f0_date && meta?.f1_date && meta?.f2_date
                                        ? `${formatFullReadableDate(meta.f0_date)}  vs  ${formatFullReadableDate(meta.f1_date)}  vs  ${formatFullReadableDate(meta.f2_date)}`
                                        : '2026 vs 2025 vs 2024'}
                            </span>
                        </div>
                    </div>

                    {modo === 'dashboard' && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                onClick={() => setFechaRef(getTodayDateString())}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                                    fechaRef === getTodayDateString()
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                Hoy
                            </button>

                            <CustomDatePicker fechaRef={fechaRef} setFechaRef={setFechaRef} />

                            <select
                                value={sucursal}
                                onChange={(e) => setSucursal(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 focus:border-indigo-500 rounded-xl font-bold text-xs text-gray-800 outline-none transition-all cursor-pointer appearance-none"
                            >
                                {SUCURSALES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleExportHourlyCSV}
                                className="flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm transition-all"
                                title="Exportar archivo CSV"
                            >
                                <FileSpreadsheet size={14} /> 📄 Exportar Horarios
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Subtítulo explícito para Modo Festividad */}
            {modo === 'festividad' && fechasFestivas && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Clock size={16} className="text-indigo-600" />
                            Comparativa Horaria Multi-Año — {festividadNombre}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-semibold text-slate-600">
                            <span className="bg-slate-200 text-slate-900 px-2.5 py-0.5 rounded-lg font-bold">
                                Actual: {fechasFestivas.actual}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg font-bold">
                                Hace 1 año: {fechasFestivas.past1}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-lg font-bold">
                                Hace 2 años: {fechasFestivas.past2}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleExportHourlyCSV}
                        className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs transition-all"
                    >
                        <FileSpreadsheet size={14} /> Exportar CSV
                    </button>
                </div>
            )}

            {/* Resumen del Rendimiento */}
            {meta && !isLoading && (() => {
                const varAnio1 = meta.variacion_vs_anio1;
                const varAnio2 = meta.variacion_vs_anio2;
                const isBelow = varAnio1 !== null && varAnio1 < -5;
                const isAbove = varAnio1 !== null && varAnio1 > 0;
                
                const bgStyle = isAbove 
                    ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-950"
                    : isBelow 
                        ? "bg-rose-50/90 border-rose-200/80 text-rose-950"
                        : "bg-amber-50/90 border-amber-200/80 text-amber-950";

                return (
                    <div className={cn("p-4 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all shadow-sm", bgStyle)}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-75">2026 (Año Actual)</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black">{formatBs(totalVendidoHoy)}</span>
                                <span className="text-xs font-bold opacity-80">
                                    {modo === 'festividad' ? 'Venta Neta Festividad' : 'Venta Neta del Día'}
                                </span>
                            </div>
                        </div>

                        <div className="h-10 w-px bg-black/10 hidden lg:block"></div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-75">2025 (Hace 1 Año)</p>
                            {totalVendidoAnio1 > 0 ? (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black text-slate-800">{formatBs(totalVendidoAnio1)}</span>
                                    <span className={cn("text-xs font-black", (varAnio1 ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700")}>
                                        {varAnio1 !== null ? `${varAnio1 >= 0 ? '▲ +' : '▼ '}${varAnio1.toFixed(1)}%` : '—'}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-xs font-bold text-slate-500 italic">Sin registros para esta festividad (2025)</p>
                            )}
                        </div>

                        <div className="h-10 w-px bg-black/10 hidden lg:block"></div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-75">2024 (Hace 2 Años)</p>
                            {totalVendidoAnio2 > 0 ? (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black text-slate-800">{formatBs(totalVendidoAnio2)}</span>
                                    <span className={cn("text-xs font-black", (varAnio2 ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700")}>
                                        {varAnio2 !== null ? `${varAnio2 >= 0 ? '▲ +' : '▼ '}${varAnio2.toFixed(1)}%` : '—'}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-xs font-bold text-slate-500 italic">Sin registros para esta festividad (2024)</p>
                            )}
                        </div>

                        <div className="h-10 w-px bg-black/10 hidden lg:block"></div>

                        <div className="text-left lg:text-right">
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-75 mb-1">Estado</p>
                            <p className="text-xs font-black inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-full shadow-sm">
                                {isAbove ? '🟢 Superando Objetivos' : isBelow ? '🔴 Debajo del Histórico' : '🟡 Manteniendo Nivel'}
                            </p>
                        </div>
                    </div>
                );
            })()}

            {/* Gráfico Recharts Exacto */}
            <div className="w-full h-[400px] min-h-[400px] pt-2">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-indigo-500">
                        <Loader2 size={40} className="animate-spin" />
                        <p className="text-sm font-black tracking-widest uppercase animate-pulse">Analizando registros horarios...</p>
                    </div>
                ) : isError ? (
                    <div className="h-full flex items-center justify-center text-red-400 text-sm font-bold bg-red-50 rounded-2xl border border-red-100">
                        Error cargando datos del backend.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <ComposedChart data={renderedData} margin={{ top: 25, right: 20, left: 35, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="hora"
                                interval={0}
                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                            />
                            <YAxis
                                tickFormatter={(v) => `Bs ${v.toLocaleString()}`}
                                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                dx={-4}
                                width={90}
                                domain={[0, 'auto']}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />

                            {modo === 'dashboard' && HORAS_OPERACION.includes(currentHourStr) && (
                                <ReferenceLine 
                                    x={currentHourStr} 
                                    stroke="#6366f1" 
                                    strokeWidth={1.5}
                                    strokeDasharray="3 3" 
                                    label={{ 
                                        value: `Hora actual ${currentHourStr}`, 
                                        fill: '#4f46e5', 
                                        fontSize: 10, 
                                        fontWeight: 'bold', 
                                        position: 'top',
                                        offset: 10
                                    }} 
                                />
                            )}

                            {/* Barras Año 2024 */}
                            {totalVendidoAnio2 > 0 && (
                                <Bar dataKey="anio2" fill="#fb7185" opacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={18} />
                            )}

                            {/* Barras Año 2025 */}
                            {totalVendidoAnio1 > 0 && (
                                <Bar dataKey="anio1" fill="#fcd34d" opacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={18} />
                            )}
                            
                            {/* Barras Real 2026 */}
                            <Bar dataKey="real" fill="#818cf8" opacity={0.9} radius={[4, 4, 0, 0]} maxBarSize={18} />

                            {/* Línea Real 2026 */}
                            <Line
                                type="monotone"
                                dataKey="real"
                                stroke="#4f46e5"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }}
                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3, fill: '#4f46e5' }}
                                connectNulls
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Resumen Inferior */}
            {!isLoading && !isError && renderedData.length > 0 && (
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
                    {(() => {
                        let peakHour2026 = renderedData[0];
                        for (const d of renderedData) {
                            if ((d.real || 0) > (peakHour2026.real || 0)) {
                                peakHour2026 = d;
                            }
                        }

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5 h-full min-h-[90px]">
                                    <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl shrink-0">
                                        <Zap size={22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-0.5">Hora Pico</p>
                                        <h4 className="text-2xl font-black text-slate-900 leading-none">
                                            {peakHour2026?.real > 0 ? peakHour2026.hora : 'Sin ventas'}
                                        </h4>
                                        <p className="text-xs font-black text-indigo-700 mt-1">
                                            {peakHour2026?.real > 0 ? formatBs(peakHour2026.real) : 'Sin ventas registradas'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

export const ComparativaHorariaMultiAnio = HourlyMultiyearChart;
export default HourlyMultiyearChart;
