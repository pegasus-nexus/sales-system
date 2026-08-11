import { useState, useMemo } from 'react';
import HourlyMultiyearChart from './HourlyMultiyearChart';
import { 
    CalendarDays, ChevronDown, 
    Sparkles, ChevronUp
} from 'lucide-react';

interface DayOption {
    id: string;
    dayName: string;
    date2026: string; // YYYY-MM-DD
    date2025: string; // YYYY-MM-DD
    date2024: string; // YYYY-MM-DD
    label: string;
    isYesterday?: boolean;
    isToday?: boolean;
}

// ───────────────────────────────────────────────────────────────────────────────
// DÍAS DE LA SEMANA ACTUAL (Semana del Lunes 10 de Agosto de 2026)
// ───────────────────────────────────────────────────────────────────────────────
const WEEK_DAYS: DayOption[] = [
    {
        id: 'mon',
        dayName: 'Lunes',
        date2026: '2026-08-10',
        date2025: '2025-08-11',
        date2024: '2024-08-12',
        label: 'Lunes 10 Ago (Ayer)',
        isYesterday: true
    },
    {
        id: 'tue',
        dayName: 'Martes',
        date2026: '2026-08-11',
        date2025: '2025-08-12',
        date2024: '2024-08-13',
        label: 'Martes 11 Ago (Hoy)',
        isToday: true
    },
    {
        id: 'wed',
        dayName: 'Miércoles',
        date2026: '2026-08-12',
        date2025: '2025-08-13',
        date2024: '2024-08-14',
        label: 'Miércoles 12 Ago'
    },
    {
        id: 'thu',
        dayName: 'Jueves',
        date2026: '2026-08-13',
        date2025: '2025-08-14',
        date2024: '2024-08-15',
        label: 'Jueves 13 Ago'
    },
    {
        id: 'fri',
        dayName: 'Viernes',
        date2026: '2026-08-14',
        date2025: '2025-08-15',
        date2024: '2024-08-16',
        label: 'Viernes 14 Ago'
    },
    {
        id: 'sat',
        dayName: 'Sábado',
        date2026: '2026-08-15',
        date2025: '2025-08-16',
        date2024: '2024-08-17',
        label: 'Sábado 15 Ago'
    },
    {
        id: 'sun',
        dayName: 'Domingo',
        date2026: '2026-08-16',
        date2025: '2025-08-17',
        date2024: '2024-08-18',
        label: 'Domingo 16 Ago'
    }
];

interface WeeklyHourlyChartProps {
    sucursalProp?: string;
}

export function WeeklyHourlyChart({ sucursalProp }: WeeklyHourlyChartProps) {
    const [selectedDayId, setSelectedDayId] = useState<string>('mon'); // Lunes (10-08-2026) por defecto
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    const activeDay = useMemo(() => {
        return WEEK_DAYS.find(d => d.id === selectedDayId) || WEEK_DAYS[0];
    }, [selectedDayId]);

    return (
        <div className="rounded-[2.5rem] p-4 sm:p-8 border border-indigo-100/80 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/60 shadow-sm transition-all duration-300 relative font-sans">
            
            {/* CABECERA DESPLEGABLE */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-indigo-100/80">
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-3 cursor-pointer select-none group"
                >
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition-all duration-300 group-hover:scale-105">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 group-hover:text-indigo-900 transition-colors">
                            Comparativa Horaria Semanal Multi-Año
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                Día Equivalente de la Semana
                            </span>
                        </h2>
                        <p className="text-slate-500 text-xs font-semibold mt-0.5">
                            Comparación por hora de días específicos de la semana actual ({activeDay.dayName}) vs 2025 vs 2024.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 shadow-sm transition-all active:scale-95"
                    >
                        <span>{isExpanded ? 'Contraer Módulo' : 'Expandir Módulo'}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {/* CONTENIDO COMPLETO DEL MÓDULO */}
            {isExpanded && (
                <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    
                    {/* BARRA SELECCIONADORA DE DÍA DE LA SEMANA */}
                    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-600" />
                            <span>Selecciona un día de la semana para auditar el rendimiento horario tri-anual:</span>
                        </div>

                        {/* Pestañas de Días de la Semana */}
                        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end">
                            {WEEK_DAYS.map(d => {
                                const isSelected = selectedDayId === d.id;
                                return (
                                    <button
                                        key={d.id}
                                        onClick={() => setSelectedDayId(d.id)}
                                        className={`px-3 py-2 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                                            isSelected 
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                                        }`}
                                    >
                                        <span>{d.dayName}</span>
                                        {d.isYesterday && (
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                                Ayer
                                            </span>
                                        )}
                                        {d.isToday && (
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                                Hoy
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* GRÁFICO REUTILIZABLE CON LA FECHA EXACTA SELECCIONADA */}
                    <HourlyMultiyearChart
                        modo="dashboard"
                        fechaRefProp={activeDay.date2026}
                        sucursalProp={sucursalProp}
                        hideHeaderControls={false}
                    />
                </div>
            )}
        </div>
    );
}

export default WeeklyHourlyChart;
