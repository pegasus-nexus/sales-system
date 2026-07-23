import { useQuery } from '@tanstack/react-query';
import { getTenants, getAdminDashboardMetrics } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { Building, AlertCircle, TrendingUp, DollarSign, Activity } from 'lucide-react';
import type { Tenant } from '../api/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboardPage() {
 const { user } = useAuthStore();
 
 // Dark Mode Toggle Logic
 const isDark = false;
 
 const { data: tenants, isLoading: isLoadingTenants } = useQuery<Tenant[]>({
 queryKey: ['tenants'],
 queryFn: getTenants,
 });

 const { data: metrics, isLoading: isMetricsLoading } = useQuery({
 queryKey: ['admin-dashboard-metrics'],
 queryFn: getAdminDashboardMetrics
 });

 const activeCount = tenants?.filter(t => t.is_active).length || 0;
 const inactiveCount = tenants?.filter(t => !t.is_active).length || 0;

 const now = new Date();
 const nextWeek = new Date();
 nextWeek.setDate(now.getDate() + 7);

 const expiringSoon = tenants?.filter(t => {
 if (!t.plan_expires_at) return false;
 const expires = new Date(t.plan_expires_at);
 return expires <= nextWeek && expires > now;
 }).sort((a, b) => new Date(a.plan_expires_at!).getTime() - new Date(b.plan_expires_at!).getTime()) || [];

 if (user?.role !== 'SUPERADMIN') return <div className="p-5 text-center text-red-500">Acceso Restringido</div>;

 if (isLoadingTenants || isMetricsLoading) {
 return <div className="p-5 flex justify-center text-gray-500 font-bold animate-pulse">Cargando métricas SaaS...</div>;
 }

 const mrr = metrics?.mrr || 0;
 const totalDbGb = metrics?.totalDbGb || 0;
 const storageByTenant = metrics?.storageByTenant || [];

 // Simulated MRR trend
 const mrrTrendData = [
 { name: 'Ene', mrr: mrr * 0.4 },
 { name: 'Feb', mrr: mrr * 0.5 },
 { name: 'Mar', mrr: mrr * 0.55 },
 { name: 'Abr', mrr: mrr * 0.65 },
 { name: 'May', mrr: mrr * 0.8 },
 { name: 'Jun', mrr: mrr * 0.95 },
 { name: 'Jul', mrr: mrr },
 ];

 return (
 <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 md:pb-8 transition-colors duration-300 [#0a0a0a]">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
 <div>
 <h1 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-3">
 <Activity className="text-indigo-500" />
 SaaS Pulse Dashboard
 </h1>
 <p className="text-gray-500 font-medium mt-1">El centro de mando de tu negocio de software.</p>
 </div>
 </div>

 {/* Quick Metrics */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-colors">
 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
 <DollarSign size={24} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">MRR Actual</p>
 <p className="text-base font-black text-gray-900">${mrr.toFixed(2)}</p>
 </div>
 </div>

 <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-colors">
 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
 <Building size={24} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Empresas Activas</p>
 <p className="text-base font-black text-gray-900">{activeCount}</p>
 </div>
 </div>

 <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-colors">
 <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
 <AlertCircle size={24} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inactivas / Churn</p>
 <p className="text-base font-black text-gray-900">{inactiveCount}</p>
 </div>
 </div>

 <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-colors">
 <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
 <TrendingUp size={24} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Renovaciones (7 días)</p>
 <p className="text-base font-black text-gray-900">{expiringSoon.length}</p>
 </div>
 </div>
 </div>

 {/* Charts Section */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* MRR Chart */}
 <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-colors">
 <h3 className="text-base font-bold text-gray-900 mb-6">Crecimiento de MRR (Ingreso Recurrente)</h3>
 <div className="h-48 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={mrrTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(value) => `$${value}`} />
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1f2937' : '#f3f4f6'} />
 <RechartsTooltip 
 contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', borderRadius: '12px', border: isDark ? '1px solid #374151' : 'none', color: isDark ? '#fff' : '#000' }}
 formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'MRR']}
 />
 <Area type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Storage Chart */}
 <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-colors flex flex-col">
 <h3 className="text-base font-bold text-gray-900 mb-2">Uso de Base de Datos (GB)</h3>
 <p className="text-xs text-gray-500 mb-4">Métricas simuladas por Tenant (Total Real: {totalDbGb.toFixed(2)} GB)</p>
 
 <div className="flex-1 min-h-[200px]">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={storageByTenant}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={80}
 paddingAngle={5}
 dataKey="value"
 >
 {storageByTenant.map((_: any, index: number) => (
 <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'][index % 5]} stroke="transparent" />
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
 {storageByTenant.map((entry: any, i: number) => (
 <div key={i} className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'][i % 5] }}></div>
 <span className="text-gray-700 font-medium">{entry.name}</span>
 </div>
 <span className="font-bold text-gray-900">{entry.value} GB</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Expiring Alerts */}
 <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-colors">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
 <AlertCircle size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-gray-900">Alertas de Vencimiento de Pago</h3>
 <p className="text-sm text-gray-500">Clientes cuyo plan ya expiró o expirará en los próximos 7 días.</p>
 </div>
 </div>

 {expiringSoon.length === 0 ? (
 <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 font-bold">
 No hay pagos próximos a vencer.
 </div>
 ) : (
 <div className="space-y-4">
 {expiringSoon.map(tenant => {
 const isExpired = new Date(tenant.plan_expires_at!) < new Date();
 return (
 <div key={tenant._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 transition-colors">
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${isExpired ? 'bg-red-500' : 'bg-amber-500'}`}>
 {tenant.name.substring(0, 1)}
 </div>
 <div>
 <p className="font-bold text-gray-900">{tenant.name}</p>
 <p className={`text-xs font-bold ${isExpired ? 'text-red-600 ' : 'text-amber-600 '}`}>
 {isExpired ? 'Pago Expirado el ' : 'Vence el '} 
 {new Date(tenant.plan_expires_at!).toLocaleDateString()}
 </p>
 </div>
 </div>
 <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600">
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
