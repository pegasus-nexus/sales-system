import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyEvolution, getSucursales } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { 
    TrendingUp, TrendingDown, DollarSign, ShoppingBag, CreditCard, 
    Store, Calendar, Loader2, AlertTriangle, Building2, Percent, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, PieChart, Pie, Cell 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const formatBs = (num?: number) => `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6'];

export default function MonthlyEvolutionView() {
    const { role } = useAuthStore();
    const esMatriz = ['SUPERADMIN', 'ADMIN', 'ADMIN_MATRIZ'].includes(role || '');

    const [months, setMonths] = useState<number>(12);
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales'],
        queryFn: getSucursales,
        enabled: esMatriz
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ['monthly-evolution', months, selectedSucursal],
        queryFn: () => getMonthlyEvolution(months, selectedSucursal)
    });

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center py-28 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Loader2 size={44} className="animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Cargando reporte de evolución mensual (MoM)...</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100 flex flex-col items-center">
                <AlertTriangle size={36} className="mb-2" />
                <h3 className="font-bold text-lg">Error al cargar la evolución mensual</h3>
                <p className="text-sm opacity-80">Por favor, intenta nuevamente más tarde.</p>
            </div>
        );
    }

    const { resumen_mom, evolucion_mensual, participacion_sucursales } = data;

    const isIngresosPositive = resumen_mom.diferencia_pct >= 0;
    const isTxPositive = resumen_mom.diferencia_tx_pct >= 0;
    const isTktPositive = resumen_mom.diferencia_tkt_pct >= 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Controles de Filtros ─────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-gray-900">Evolución e Indicadores MoM</h2>
                        <p className="text-xs text-gray-400">Análisis comparativo contra el mes anterior y distribución por sucursal</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Selector de Sucursal */}
                    {esMatriz && sucursales.length > 0 && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium">
                            <Building2 size={16} className="text-gray-400" />
                            <select
                                value={selectedSucursal}
                                onChange={(e) => setSelectedSucursal(e.target.value)}
                                className="bg-transparent border-none text-gray-700 font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="all">Todas las Sucursales</option>
                                {sucursales.map((s) => (
                                    <option key={s._id} value={s._id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Selector de Rango de Meses */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                        {[6, 12, 24].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMonths(m)}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                                    months === m ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {m} Meses
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── KPI Cards Resumen MoM ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Ingresos Mensuales */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
                    <div className="flex items-center justify-between mb-3 opacity-90">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Ventas Mes Actual ({resumen_mom.periodo_actual})</span>
                        <DollarSign size={20} className="text-indigo-200" />
                    </div>
                    <h3 className="text-4xl font-black mb-3">{formatBs(resumen_mom.ingresos_actual)}</h3>
                    
                    <div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-indigo-400/30">
                        <div className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black",
                            isIngresosPositive ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30" : "bg-red-400/20 text-red-300 border border-red-400/30"
                        )}>
                            {isIngresosPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span>{isIngresosPositive ? '+' : ''}{resumen_mom.diferencia_pct}% MoM</span>
                        </div>
                        <span className="text-indigo-200">({isIngresosPositive ? '+' : ''}{formatBs(resumen_mom.diferencia_abs)} vs mes ant.)</span>
                    </div>
                </div>

                {/* 2. Transacciones MoM */}
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3 text-gray-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Transacciones Realizadas</span>
                        <ShoppingBag size={20} className="text-indigo-500" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3">{resumen_mom.transacciones_actual.toLocaleString()}</h3>
                    
                    <div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-gray-100">
                        <div className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black",
                            isTxPositive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                        )}>
                            {isTxPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{isTxPositive ? '+' : ''}{resumen_mom.diferencia_tx_pct}%</span>
                        </div>
                        <span className="text-gray-400">vs {resumen_mom.transacciones_anterior.toLocaleString()} mes anterior</span>
                    </div>
                </div>

                {/* 3. Ticket Promedio MoM */}
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3 text-gray-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio (Venta)</span>
                        <CreditCard size={20} className="text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3">{formatBs(resumen_mom.ticket_promedio_actual)}</h3>
                    
                    <div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-gray-100">
                        <div className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black",
                            isTktPositive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                        )}>
                            {isTktPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{isTktPositive ? '+' : ''}{resumen_mom.diferencia_tkt_pct}%</span>
                        </div>
                        <span className="text-gray-400">vs {formatBs(resumen_mom.ticket_promedio_anterior)} ant.</span>
                    </div>
                </div>
            </div>

            {/* ── Gráficos Principales (Evolución Historica + Participación) ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolución Mensual Historica (Area Chart) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={18} className="text-indigo-600" /> Evolución Mensual de Facturación
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">Últimos {months} meses</span>
                    </div>

                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={evolucion_mensual} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `Bs. ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                                <Tooltip 
                                    formatter={(value: any) => [`Bs. ${Number(value || 0).toLocaleString()}`, 'Total Facturado']}
                                    labelFormatter={(label) => `Período: ${label}`}
                                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="total_ventas" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMonthly)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Participación por Sucursal (Donut Chart) */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                            <Store size={18} className="text-emerald-600" /> Participación por Sucursal
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">Mes {resumen_mom.periodo_actual}</span>
                    </div>

                    {participacion_sucursales.length > 0 ? (
                        <>
                            <div className="w-full h-52 flex justify-center items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={participacion_sucursales}
                                            dataKey="total_ventas"
                                            nameKey="sucursal_nombre"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                        >
                                            {participacion_sucursales.map((_, idx) => (
                                                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => `Bs. ${Number(value || 0).toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend / Breakdown */}
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                {participacion_sucursales.map((item, idx) => (
                                    <div key={item.sucursal_nombre} className="flex items-center justify-between text-xs font-semibold">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-gray-700 truncate">{item.sucursal_nombre}</span>
                                        </div>
                                        <span className="text-gray-900 font-black">{item.participacion_porcentaje}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Building2 size={32} className="mb-2 opacity-50" />
                            <p className="text-xs">Sin registros de ventas en el período</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tabla Ejecutiva de Desempeño por Sucursal (MoM Analysis) ───── */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                            <Percent size={20} className="text-indigo-600" /> Desempeño y Crecimiento Individual por Sucursal
                        </h3>
                        <p className="text-xs text-gray-400">Comparativa intermensual de cada sucursal y cuota de participación sobre el total</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Sucursal</th>
                                <th className="py-3 px-4">Facturación Mes Actual</th>
                                <th className="py-3 px-4 text-center">Cuota de Participación</th>
                                <th className="py-3 px-4 text-center">Variación MoM (%)</th>
                                <th className="py-3 px-4 text-right">Variación MoM ($)</th>
                                <th className="py-3 px-4 text-right">Transacciones</th>
                                <th className="py-3 px-4 text-right">Ticket Prom.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {participacion_sucursales.map((s, idx) => {
                                const isPositive = s.variacion_mom_porcentaje >= 0;
                                return (
                                    <tr key={s.sucursal_nombre} className="hover:bg-gray-50/80 transition-colors font-medium">
                                        <td className="py-3.5 px-4 font-extrabold text-gray-900 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            {s.sucursal_nombre}
                                        </td>
                                        <td className="py-3.5 px-4 font-black text-gray-900">{formatBs(s.total_ventas)}</td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                                        style={{ width: `${Math.min(s.participacion_porcentaje, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-extrabold text-gray-700">{s.participacion_porcentaje}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black",
                                                isPositive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                                            )}>
                                                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                {isPositive ? '+' : ''}{s.variacion_mom_porcentaje}%
                                            </span>
                                        </td>
                                        <td className={cn("py-3.5 px-4 text-right font-extrabold", isPositive ? "text-emerald-600" : "text-red-500")}>
                                            {isPositive ? '+' : ''}{formatBs(s.variacion_mom_abs)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right text-gray-700 font-bold">{s.transacciones.toLocaleString()}</td>
                                        <td className="py-3.5 px-4 text-right font-bold text-gray-900">{formatBs(s.ticket_promedio)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
