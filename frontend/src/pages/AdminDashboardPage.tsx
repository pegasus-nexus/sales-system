import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTenants, client } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { Building, AlertCircle, TrendingUp, Moon, Sun, Database, DollarSign, Activity } from 'lucide-react';
import type { Tenant } from '../api/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

// Mocks para el dashboard visual
const mockMRRData = [
    { month: 'Ene', mrr: 1200 },
    { month: 'Feb', mrr: 1500 },
    { month: 'Mar', mrr: 2100 },
    { month: 'Abr', mrr: 2400 },
    { month: 'May', mrr: 3200 },
    { month: 'Jun', mrr: 3800 },
    { month: 'Jul', mrr: 4500 },
];

const mockStorageData = [
    { name: 'Tenant A (Supermercado)', value: 4.5, color: '#6366f1' },
    { name: 'Tenant B (Restaurante)', value: 2.1, color: '#ec4899' },
    { name: 'Tenant C (Ferretería)', value: 1.2, color: '#10b981' },
    { name: 'Otros (24)', value: 3.8, color: '#9ca3af' },
];

export default function AdminDashboardPage() {
    const { user } = useAuthStore();
    
    // Dark Mode Toggle Logic
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    
    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    const { data: tenants, isLoading: isLoadingTenants } = useQuery({
        queryKey: ['tenants'],
        queryFn: getTenants,
    });

    const { isLoading: isLoadingPlans } = useQuery({
        queryKey: ['admin-plans'],
        queryFn: () => client<any[]>('/tenants/admin/plans'),
    });

    const metrics = useMemo(() => {
        if (!tenants) return { total: 0, active: 0, inactive: 0, popularPlan: '-', expiring: [] as Tenant[] };
        
        const active = tenants.filter(t => t.is_active).length;
        const inactive = tenants.length - active;
        
        const planCounts = tenants.reduce((acc, t) => {
            acc[t.plan] = (acc[t.plan] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        let popularPlan = '-';
        let maxCount = 0;
        for (const [plan, count] of Object.entries(planCounts)) {
            if (count > maxCount) {
                maxCount = count;
                popularPlan = plan;
            }
        }

        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const expiring = tenants.filter(t => {
            if (!t.plan_expires_at) return false;
            const expires = new Date(t.plan_expires_at);
            return expires <= nextWeek;
        }).sort((a, b) => new Date(a.plan_expires_at!).getTime() - new Date(b.plan_expires_at!).getTime());

        return { total: tenants.length, active, inactive, popularPlan, expiring };
    }, [tenants]);

    if (user?.role !== 'SUPERADMIN') return <div className="p-8 text-center text-red-500">Acceso Restringido</div>;

    if (isLoadingTenants || isLoadingPlans) {
        return <div className="p-8 flex justify-center text-gray-500 font-bold animate-pulse">Cargando métricas SaaS...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 md:pb-8 transition-colors duration-300 dark:bg-[#0a0a0a]">
            {/* Header & Theme Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Activity className="text-indigo-500" />
                        SaaS Pulse Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">El centro de mando de tu negocio de software.</p>
                </div>
                <button 
                    onClick={() => setIsDark(!isDark)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    {isDark ? 'Modo Claro' : 'Modo Hacker (Dark)'}
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 transition-colors">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">MRR Estimado</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">$4,500 <span className="text-xs text-emerald-500 ml-1">+15%</span></p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 transition-colors">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                        <Building size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empresas Activas</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics.active} <span className="text-xs text-gray-400 ml-1">/ {metrics.total} totales</span></p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 transition-colors">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                        <Database size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Storage Consumido</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">11.6 GB</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 transition-colors">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={24} className="rotate-180" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Churn Rate (Bajas)</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">2.4%</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* MRR Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Crecimiento de MRR (Ingreso Recurrente)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockMRRData}>
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1f2937' : '#f3f4f6'} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12}} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', borderRadius: '12px', border: isDark ? '1px solid #374151' : 'none', color: isDark ? '#fff' : '#000' }}
                                    formatter={(val: any) => [`$${val}`, 'MRR']}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Storage Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Uso de Base de Datos (GB)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Métricas simuladas de almacenamiento MongoDB por Tenant.</p>
                    
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockStorageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mockStorageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', borderRadius: '12px', border: isDark ? '1px solid #374151' : 'none', color: isDark ? '#fff' : '#000' }}
                                    formatter={(val: any) => [`${val} GB`, 'Consumo']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        {mockStorageData.map((entry, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{entry.name}</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{entry.value} GB</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expiring Alerts */}
            <div className="bg-white dark:bg-gray-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Alertas de Vencimiento de Pago</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Clientes cuyo plan ya expiró o expirará en los próximos 7 días.</p>
                    </div>
                </div>

                {metrics.expiring.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 text-center text-gray-500 dark:text-gray-400 font-bold">
                        No hay pagos próximos a vencer.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {metrics.expiring.map(tenant => {
                            const isExpired = new Date(tenant.plan_expires_at!) < new Date();
                            return (
                                <div key={tenant._id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${isExpired ? 'bg-red-500' : 'bg-amber-500'}`}>
                                            {tenant.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{tenant.name}</p>
                                            <p className={`text-xs font-bold ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {isExpired ? 'Pago Expirado el ' : 'Vence el '} 
                                                {new Date(tenant.plan_expires_at!).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                                        Plan: {tenant.plan}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
