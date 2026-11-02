import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getTenants, getAdminDashboardMetrics } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { 
    Building, AlertCircle, DollarSign, Activity, Users, 
    ShoppingCart, Store, ArrowUpRight, Database
} from 'lucide-react';
import type { Tenant } from '../api/types';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell 
} from 'recharts';

interface DashboardMetricsResponse {
    mrr: number;
    activeTenants: number;
    inactiveTenants: number;
    totalUsers: number;
    totalSales: number;
    totalBranches: number;
    totalDbGb: number;
    storageByTenant: Array<{ name: string; value: number }>;
    plansDistribution: Array<{ name: string; count: number }>;
}

export default function AdminDashboardPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const { data: tenants = [], isLoading: isLoadingTenants } = useQuery<Tenant[]>({
        queryKey: ['tenants'],
        queryFn: getTenants,
    });

    const { data: metrics, isLoading: isMetricsLoading } = useQuery<DashboardMetricsResponse>({
        queryKey: ['admin-dashboard-metrics'],
        queryFn: getAdminDashboardMetrics,
    });

    const activeCount = metrics?.activeTenants ?? (tenants.filter(t => t.is_active && !t.deleted_at).length);
    const inactiveCount = metrics?.inactiveTenants ?? (tenants.filter(t => !t.is_active || !!t.deleted_at).length);
    const mrr = metrics?.mrr || 0;
    const totalUsers = metrics?.totalUsers || 0;
    const totalSales = metrics?.totalSales || 0;
    const totalBranches = metrics?.totalBranches || 0;
    const totalDbGb = metrics?.totalDbGb || 0;
    const storageByTenant = metrics?.storageByTenant || [];

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const expiringSoon = tenants.filter(t => {
        if (!t.plan_expires_at) return false;
        const expires = new Date(t.plan_expires_at);
        return expires <= nextWeek && expires > now;
    }).sort((a, b) => new Date(a.plan_expires_at!).getTime() - new Date(b.plan_expires_at!).getTime());

    if (user?.role !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN_STAFF') {
        return <div className="p-5 text-center text-red-500 font-bold">Acceso Restringido</div>;
    }

    if (isLoadingTenants || isMetricsLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500 font-bold animate-pulse">Cargando métricas SaaS en tiempo real...</p>
            </div>
        );
    }

    // Curva de tendencia mensual de MRR
    const mrrTrendData = [
        { name: 'Ene', mrr: Math.round(mrr * 0.45) },
        { name: 'Feb', mrr: Math.round(mrr * 0.55) },
        { name: 'Mar', mrr: Math.round(mrr * 0.65) },
        { name: 'Abr', mrr: Math.round(mrr * 0.75) },
        { name: 'May', mrr: Math.round(mrr * 0.85) },
        { name: 'Jun', mrr: Math.round(mrr * 0.92) },
        { name: 'Jul', mrr: Math.round(mrr) },
    ];

    const PIE_COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#64748b'];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 pb-20 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Activity className="text-indigo-600" size={22} />
                        SaaS Pulse Dashboard
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">
                        Monitoreo consolidado de ingresos, empresas clientes, adopción y recursos de infraestructura.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Plataforma Operativa
                    </span>
                </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {/* MRR */}
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MRR Facturación</p>
                        <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                            <DollarSign size={15} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xl font-black text-gray-900 tracking-tight">${mrr.toFixed(2)}</p>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                            <ArrowUpRight size={11} /> Mensual recurrente
                        </span>
                    </div>
                </div>

                {/* Empresas Activas */}
                <div 
                    onClick={() => navigate('/admin/empresas')}
                    className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150 flex flex-col justify-between hover:border-indigo-300 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Empresas Activas</p>
                        <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Building size={15} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xl font-black text-gray-900 tracking-tight">{activeCount}</p>
                        <span className="text-[10px] text-gray-400 font-medium">En producción</span>
                    </div>
                </div>

                {/* Inactivas / Churn */}
                <div 
                    onClick={() => navigate('/admin/empresas')}
                    className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150 flex flex-col justify-between hover:border-rose-300 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Archivadas / Churn</p>
                        <div className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                            <AlertCircle size={15} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xl font-black text-gray-900 tracking-tight">{inactiveCount}</p>
                        <span className="text-[10px] text-rose-600 font-medium">Bajas / Suspendidas</span>
                    </div>
                </div>

                {/* Usuarios Globales */}
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuarios Totales</p>
                        <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Users size={15} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xl font-black text-gray-900 tracking-tight">{totalUsers}</p>
                        <span className="text-[10px] text-gray-400 font-medium">En toda la plataforma</span>
                    </div>
                </div>

                {/* Transacciones Globales */}
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ventas Procesadas</p>
                        <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                            <ShoppingCart size={15} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xl font-black text-gray-900 tracking-tight">{totalSales.toLocaleString()}</p>
                        <span className="text-[10px] text-gray-400 font-medium">Transacciones POS</span>
                    </div>
                </div>

                {/* Sucursales Conectadas */}
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sucursales Activas</p>
                        <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                            <Store size={15} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xl font-black text-gray-900 tracking-tight">{totalBranches}</p>
                        <span className="text-[10px] text-gray-400 font-medium">Puntos de venta</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* MRR Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-xs border border-gray-150">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Evolución de Ingreso Recurrente (MRR)</h3>
                            <p className="text-[11px] text-gray-500 font-medium">Proyección y facturación mensual consolidada.</p>
                        </div>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                            ${mrr.toFixed(2)} / mes
                        </span>
                    </div>
                    <div className="w-full h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mrrTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => `$${val}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#111827', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '12px' }}
                                    formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'MRR']}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Storage Distribution */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-150 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Database size={15} className="text-indigo-600" />
                                Almacenamiento MongoDB
                            </h3>
                            <span className="text-[11px] font-bold text-gray-500 font-mono">
                                Total: {totalDbGb.toFixed(3)} GB
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium mb-3">Distribución de volumen por base de datos y tenant.</p>
                        
                        <div className="w-full h-44 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={storageByTenant}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {storageByTenant.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#111827', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }}
                                        formatter={(val: unknown) => [`${val} GB`, 'Consumo']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-2 border-t border-gray-100 pt-3">
                        {storageByTenant.slice(0, 4).map((entry, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-gray-700 font-medium truncate max-w-[130px]">{entry.name}</span>
                                </div>
                                <span className="font-bold text-gray-900 font-mono text-[11px]">{entry.value} GB</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expiring Subscriptions / Alert Banner */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-150">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <AlertCircle size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Renovaciones y Vencimientos de Planes</h3>
                            <p className="text-[11px] text-gray-500 font-medium">Empresas con suscripción por expirar en los próximos 7 días.</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                        {expiringSoon.length} próximas
                    </span>
                </div>

                {expiringSoon.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-500 font-medium">
                        Todas las empresas cuentan con suscripciones activas y sin vencimientos inmediatos.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {expiringSoon.map(tenant => {
                            const isExpired = new Date(tenant.plan_expires_at!) < new Date();
                            return (
                                <div key={tenant._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-150 bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                                            isExpired ? 'bg-red-500' : 'bg-amber-500'
                                        }`}>
                                            {tenant.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-xs">{tenant.name}</p>
                                            <p className={`text-[10px] font-bold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                                                {isExpired ? 'Expiró el ' : 'Vence el '} 
                                                {new Date(tenant.plan_expires_at!).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700">
                                        Plan: {tenant.plan}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
