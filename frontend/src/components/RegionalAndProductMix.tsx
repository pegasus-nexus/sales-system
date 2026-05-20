import { useState, useEffect, useCallback } from 'react';
import { getSalesByBranch, getTopProducts } from '../api/api';
import {
    ResponsiveContainer, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { MapPin, PieChart as PieChartIcon, Loader2, AlertTriangle } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function RegionalAndProductMix() {
    // ─────────────────────────────────────────────────────────────────
    // Estados y Tiempo
    // ─────────────────────────────────────────────────────────────────
    const [mode, setMode] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

    const [dates, setDates] = useState({ start: '', end: '' });

    // Calcula start_date y end_date según el modo seleccionado
    useEffect(() => {
        let start = new Date();
        let end = new Date();
        
        // Ajuste de timezone local para fechas exactas
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (mode === 'today') {
            // Ya es hoy
        } else if (mode === 'week') {
            start.setDate(end.getDate() - 6);
        } else if (mode === 'month') {
            const [y, m] = selectedMonth.split('-');
            start = new Date(parseInt(y), parseInt(m) - 1, 1);
            end = new Date(parseInt(y), parseInt(m), 0);
            end.setHours(23, 59, 59, 999);
        } else if (mode === 'year') {
            const y = parseInt(selectedYear);
            start = new Date(y, 0, 1);
            end = new Date(y, 11, 31);
            end.setHours(23, 59, 59, 999);
        }

        setDates({
            start: start.toISOString(),
            end: end.toISOString()
        });
    }, [mode, selectedMonth, selectedYear]);

    // ─────────────────────────────────────────────────────────────────
    // Data Fetching
    // ─────────────────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [branchData, setBranchData] = useState<any[]>([]);
    const [topData, setTopData] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        if (!dates.start || !dates.end) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const [branchRes, topRes] = await Promise.all([
                getSalesByBranch(dates.start, dates.end),
                getTopProducts(dates.start, dates.end)
            ]);
            setBranchData(branchRes.sales_by_branch || []);
            setTopData(topRes.top_categories || []);
        } catch (e) {
            console.error("Error fetching regional/top mix:", e);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [dates]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // UI Helpers
    // ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header de la sección y Filtro independiente */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <MapPin className="text-rose-500" />
                        Análisis Regional y de Producto
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">Filtros independientes para explorar el pasado</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button onClick={() => setMode('today')} className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${mode==='today'?'bg-indigo-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        Hoy
                    </button>
                    <button onClick={() => setMode('week')} className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${mode==='week'?'bg-indigo-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        Hace 1 Semana
                    </button>
                    
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm transition-colors ${mode==='month'?'border-indigo-500 bg-indigo-50/30':'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setMode('month')}>
                            <input type="radio" checked={mode==='month'} readOnly className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"/>
                            <span className="text-sm font-bold text-gray-700">Mes</span>
                        </label>
                        <input type="month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setMode('month'); }} className="bg-transparent text-sm outline-none font-semibold text-indigo-900 cursor-pointer w-[120px]" />
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm transition-colors ${mode==='year'?'border-indigo-500 bg-indigo-50/30':'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setMode('year')}>
                            <input type="radio" checked={mode==='year'} readOnly className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"/>
                            <span className="text-sm font-bold text-gray-700">Año</span>
                        </label>
                        <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setMode('year'); }} className="bg-transparent text-sm outline-none font-semibold text-indigo-900 cursor-pointer w-[70px]">
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Contenedor de Gráficos */}
            {isLoading ? (
                <div className="flex flex-col justify-center items-center py-20 space-y-4 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100">
                    <Loader2 size={36} className="animate-spin text-indigo-500" />
                    <p className="text-indigo-900 font-bold tracking-widest text-sm uppercase animate-pulse">Cargando datos regionales...</p>
                </div>
            ) : isError ? (
                <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <h3 className="font-bold">Error obteniendo datos regionales</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sucursales */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 lg:col-span-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <MapPin className="text-rose-500" /> Aportación Geográfica
                            </h3>
                            <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                {new Date(dates.start).toLocaleDateString()} - {new Date(dates.end).toLocaleDateString()}
                            </div>
                        </div>
                        
                        <div className="h-[340px] w-full">
                            {branchData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm">No hay datos para este periodo</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                    <BarChart data={branchData} layout="vertical" margin={{ left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                        <XAxis type="number" tickFormatter={(val) => `Bs ${val.toLocaleString()}`} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 700 }} axisLine={false} tickLine={false} width={100} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any, name: any) => [`Bs. ${Number(value).toLocaleString()}`, name === 'ventas' ? 'Venta Total' : 'Margen 15%']}
                                        />
                                        <Bar dataKey="ventas" name="ventas" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
                                        <Bar dataKey="margen" name="margen" fill="#10b981" radius={[0, 8, 8, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Mix Rápido Top 5 */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <PieChartIcon className="text-amber-500" /> Mix Top 5
                            </h3>
                        </div>
                        
                        {topData.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 font-bold text-sm">Sin datos</div>
                        ) : (
                            <>
                                <div className="relative h-[200px] w-full min-h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={topData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                                {topData.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: any) => [`${value}%`, 'Participación']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-gray-900">Top 5</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Productos</span>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {topData.map((cat: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between text-sm group">
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <div className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                <span className="font-bold text-gray-600 truncate text-xs transition-colors group-hover:text-gray-900" title={cat.name}>{cat.name}</span>
                                            </div>
                                            <span className="font-black text-gray-900 pl-3 text-sm bg-gray-50 px-2 py-0.5 rounded-lg">{cat.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
