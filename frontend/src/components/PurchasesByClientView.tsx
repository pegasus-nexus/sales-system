import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPurchasesByClient, getSucursales } from '../api/api';
import { useAuthStore } from '../store/authStore';
import {
    Calendar, Loader2, Users, TrendingUp, Wallet, CreditCard,
    Banknote, Printer, UserCheck, Receipt, Filter, Store
} from 'lucide-react';
import { getBoliviaTodayISO, formatFullDate } from '../utils/dateUtils';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const formatBs = (num?: number) => `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PurchasesByClientView() {
    const { user, role } = useAuthStore();
    const esMatriz = ['SUPERADMIN', 'ADMIN', 'ADMIN_MATRIZ'].includes(role || '');

    const defaultStartDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    })();
    const defaultEndDate = getBoliviaTodayISO();

    // Draft filter state (user selections)
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [selectedSucursal, setSelectedSucursal] = useState(user?.sucursal_id || 'all');

    // Applied filter state (triggers API fetch on "Aplicar Filtros")
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        sucursal: user?.sucursal_id || 'all'
    });

    const handleApplyFilters = () => {
        setAppliedFilters({
            startDate,
            endDate,
            sucursal: selectedSucursal
        });
    };

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales'],
        queryFn: () => getSucursales(),
        enabled: esMatriz
    });

    const { data: report, isLoading, isError } = useQuery({
        queryKey: ['purchases-by-client', appliedFilters.startDate, appliedFilters.endDate, appliedFilters.sucursal],
        queryFn: () => getPurchasesByClient(appliedFilters.startDate, appliedFilters.endDate, appliedFilters.sucursal)
    });

    const handlePrint = () => window.print();

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Analizando compras por cliente...</p>
        </div>
    );

    if (isError || !report) return (
        <div className="p-10 text-center bg-red-50 rounded-2xl border border-red-100">
            <p className="text-red-600 font-medium">Error al cargar el reporte de compras por cliente.</p>
        </div>
    );

    const { resumen, por_cliente, filtros } = report as any;
    const porMetodo = resumen?.por_metodo || {};

    const chartDataMetodos = [
        { name: 'Efectivo', value: porMetodo.EFECTIVO || 0, color: '#10b981' },
        { name: 'QR', value: porMetodo.QR || 0, color: '#6366f1' },
        { name: 'Tarjeta', value: porMetodo.TARJETA || 0, color: '#f59e0b' },
        { name: 'Transferencia', value: porMetodo.TRANSFERENCIA || 0, color: '#3b82f6' },
        { name: 'Crédito', value: porMetodo.CREDITO || 0, color: '#ec4899' }
    ].filter(d => d.value > 0);

    const topClientes = por_cliente?.slice(0, 10) || [];
    const chartDataTopClientes = topClientes.map((c: any) => ({
        name: c.razon_social?.length > 15 ? c.razon_social.substring(0, 15) + '...' : c.razon_social,
        total: c.total_comprado,
        efectivo: c.efectivo,
        qr: c.qr,
        tarjeta: c.tarjeta,
        transferencia: c.transferencia,
        credito: c.credito
    }));

    const metodoMasUsado = Object.entries(porMetodo).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 text-gray-900 border-transparent focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                        />
                        <span className="text-gray-400 font-bold">a</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 text-gray-900 border-transparent focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                        />
                    </div>
                    {esMatriz && (
                        <div className="flex items-center gap-2">
                            <Store size={18} className="text-gray-400" />
                            <select
                                value={selectedSucursal}
                                onChange={(e) => setSelectedSucursal(e.target.value)}
                                className="bg-gray-50 text-gray-900 border-transparent focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all cursor-pointer"
                            >
                                <option value="all">Todas las sucursales</option>
                                {sucursales.map((s: any) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                            </select>
                        </div>
                    )}
                    <button 
                        onClick={handleApplyFilters}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200"
                    >
                        <Filter size={16} /> Aplicar Filtros
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all"
                    >
                        <Printer size={16} /> Imprimir
                    </button>
                </div>
            </div>

            <div className="hidden print:block text-center border-b-2 border-gray-900 pb-6 mb-8">
                <h1 className="text-3xl font-black uppercase tracking-widest mb-1">Reporte de Compras por Cliente</h1>
                <p className="text-lg font-bold text-gray-700">Periodo: {filtros?.start_date} al {filtros?.end_date}</p>
                <p className="text-sm font-medium text-gray-500">Sucursal: {filtros?.sucursal_id}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Generado: {formatFullDate(new Date())}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wider opacity-80">Total Comprado</p>
                    <h3 className="text-3xl font-black mt-1">{formatBs(resumen?.total_comprado)}</h3>
                    <p className="text-xs opacity-70 mt-2">{resumen?.total_transacciones} transacciones</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-emerald-50 hover:border-emerald-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <UserCheck size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Clientes Únicos</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{(resumen?.clientes_unicos || 0).toLocaleString()}</h3>
                    <p className="text-xs text-emerald-600 font-bold mt-2">identificados en el periodo</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-amber-50 hover:border-amber-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Receipt size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ticket Promedio</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{formatBs(resumen?.ticket_promedio_general)}</h3>
                    <p className="text-xs text-amber-600 font-bold mt-2">por cliente</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-purple-50 hover:border-purple-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <CreditCard size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Método Preferido</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{metodoMasUsado?.[0] || 'N/A'}</h3>
                    <p className="text-xs text-purple-600 font-bold mt-2">{formatBs(metodoMasUsado?.[1] as number)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                        <Wallet size={18} className="text-indigo-600" />
                        <h3 className="font-bold text-gray-800">Distribución por Método de Pago</h3>
                    </div>
                    <div className="p-6">
                        {chartDataMetodos.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={chartDataMetodos}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(1)}%`}
                                        labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                                    >
                                        {chartDataMetodos.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatBs(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-gray-400">Sin datos</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                        <Users size={18} className="text-emerald-600" />
                        <h3 className="font-bold text-gray-800">Top 10 Clientes por Total Comprado</h3>
                    </div>
                    <div className="p-6">
                        {chartDataTopClientes.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartDataTopClientes} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                    <XAxis type="number" tickFormatter={(v) => `Bs ${v.toLocaleString()}`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                                    <Tooltip formatter={(value: any) => formatBs(value)} cursor={{ fill: '#f9fafb' }} />
                                    <Bar dataKey="total" name="Total Comprado" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-gray-400">Sin datos</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                    <Banknote size={18} className="text-amber-600" />
                    <h3 className="font-bold text-gray-800">Métodos de Pago - Comparativa</h3>
                </div>
                <div className="p-6">
                    {chartDataMetodos.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartDataMetodos} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `Bs ${v.toLocaleString()}`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(value: any) => formatBs(value)} cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="value" name="Monto" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {chartDataMetodos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-72 flex items-center justify-center text-gray-400">Sin datos</div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                    <Users size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-gray-800">Detalle por Cliente ({por_cliente?.length || 0} clientes)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3 text-center">Compras</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3 text-right">Ticket Prom.</th>
                                <th className="px-6 py-3 text-right">Efectivo</th>
                                <th className="px-6 py-3 text-right">QR</th>
                                <th className="px-6 py-3 text-right">Tarjeta</th>
                                <th className="px-6 py-3 text-right">Transfer.</th>
                                <th className="px-6 py-3 text-right">Crédito</th>
                                <th className="px-6 py-3 text-center">Método Pref.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {por_cliente?.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-10 text-center text-gray-400 font-medium italic">Sin clientes registrados en este periodo</td>
                                </tr>
                            ) : (
                                por_cliente?.map((cliente: any, i: number) => (
                                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{cliente.razon_social}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">
                                                {cliente.nit ? `NIT: ${cliente.nit}` : 'Sin NIT'} {cliente.telefono ? `• ${cliente.telefono}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-black text-sm">{cliente.cantidad_compras}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900">{formatBs(cliente.total_comprado)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-600">{formatBs(cliente.ticket_promedio)}</td>
                                        <td className={cn("px-6 py-4 text-right font-medium", cliente.efectivo > 0 ? "text-emerald-600" : "text-gray-300")}>
                                            {formatBs(cliente.efectivo)}
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-medium", cliente.qr > 0 ? "text-indigo-600" : "text-gray-300")}>
                                            {formatBs(cliente.qr)}
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-medium", cliente.tarjeta > 0 ? "text-amber-600" : "text-gray-300")}>
                                            {formatBs(cliente.tarjeta)}
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-medium", cliente.transferencia > 0 ? "text-blue-600" : "text-gray-300")}>
                                            {formatBs(cliente.transferencia)}
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-medium", cliente.credito > 0 ? "text-pink-600" : "text-gray-300")}>
                                            {formatBs(cliente.credito)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-black uppercase",
                                                cliente.metodo_preferido === 'EFECTIVO' ? "bg-emerald-100 text-emerald-700" :
                                                cliente.metodo_preferido === 'QR' ? "bg-indigo-100 text-indigo-700" :
                                                cliente.metodo_preferido === 'TARJETA' ? "bg-amber-100 text-amber-700" :
                                                cliente.metodo_preferido === 'TRANSFERENCIA' ? "bg-blue-100 text-blue-700" :
                                                "bg-pink-100 text-pink-700"
                                            )}>
                                                {cliente.metodo_preferido}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}