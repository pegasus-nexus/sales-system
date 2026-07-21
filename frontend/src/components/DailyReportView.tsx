import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport, getSucursales } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { 
    Calendar, Loader2, Wallet, 
    ShoppingBag, Ban, Printer, FileDown, Filter, CheckCircle2,
    TrendingUp, ArrowDownCircle, Package, Coins, Tag
} from 'lucide-react';
import { getBoliviaTodayISO } from '../utils/dateUtils';
import { descargarPDFJornada } from '../utils/reportPDF';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const formatBs = (num?: number) => `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DailyReportView() {
    const { user, role } = useAuthStore();
    const esMatriz = ['SUPERADMIN', 'ADMIN', 'ADMIN_MATRIZ'].includes(role || '');
    
    // Draft filters state
    const [draftDate, setDraftDate] = useState(getBoliviaTodayISO());
    const [draftSucursal, setDraftSucursal] = useState(user?.sucursal_id || 'CENTRAL');

    // Applied filters state (executes API query only when clicking "Aplicar Filtros")
    const [appliedFilters, setAppliedFilters] = useState({
        date: getBoliviaTodayISO(),
        sucursal: user?.sucursal_id || 'CENTRAL'
    });

    const isFilterDirty = draftDate !== appliedFilters.date || draftSucursal !== appliedFilters.sucursal;

    const handleApplyFilters = () => {
        setAppliedFilters({
            date: draftDate,
            sucursal: draftSucursal
        });
    };

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales'],
        queryFn: getSucursales,
        enabled: esMatriz
    });

    const { data: report, isLoading, isError } = useQuery({
        queryKey: ['daily-report', appliedFilters.date, appliedFilters.sucursal],
        queryFn: () => getDailyReport(appliedFilters.date, appliedFilters.sucursal)
    });

    const handlePrint = () => window.print();
    const handleDownloadPDF = () => {
        if (!report) return;
        const sucNombre = sucursales.find(s => s._id === appliedFilters.sucursal)?.nombre || appliedFilters.sucursal;
        descargarPDFJornada(report, appliedFilters.date, sucNombre);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Control Panel con Filtros & Botón Aplicar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                        <Calendar size={16} className="text-indigo-500" />
                        <input 
                            type="date" 
                            value={draftDate}
                            onChange={(e) => setDraftDate(e.target.value)}
                            className="bg-transparent text-gray-900 text-xs font-bold outline-none"
                        />
                    </div>
                    {esMatriz && (
                        <select 
                            value={draftSucursal}
                            onChange={(e) => setDraftSucursal(e.target.value)}
                            className="bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
                        >
                            {sucursales.map(s => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                        </select>
                    )}

                    <button
                        onClick={handleApplyFilters}
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm",
                            isFilterDirty
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 animate-pulse"
                                : "bg-gray-900 hover:bg-black text-white"
                        )}
                    >
                        {isFilterDirty ? <Filter size={14} className="animate-bounce" /> : <CheckCircle2 size={14} />}
                        Aplicar Filtros
                        {isFilterDirty && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all"
                    >
                        <Printer size={15} /> Imprimir
                    </button>
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={!report}
                        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                    >
                        <FileDown size={15} /> Descargar PDF
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                    <p className="text-gray-500 font-medium text-sm">Generando reporte de jornada...</p>
                </div>
            ) : isError || !report ? (
                <div className="p-10 text-center bg-red-50 rounded-2xl border border-red-100">
                    <Ban className="text-red-500 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-bold text-red-900">Error al cargar el reporte</h3>
                    <p className="text-red-600 text-sm">No se pudo obtener la información para los filtros seleccionados.</p>
                </div>
            ) : (() => {
                const { resumen_ventas = { por_metodo: {}, anuladas: {} }, gastos = { detalle: [] }, items_vendidos = [], balance_neto = 0 } = (report as any) || {};
                return (
                    <div className="space-y-6">
                        {/* Print Header (Only visible when printing) */}
                        <div className="hidden print:block text-center border-b-2 border-gray-900 pb-6 mb-8">
                            <h1 className="text-3xl font-black uppercase tracking-widest mb-1">Cierre de Jornada</h1>
                            <p className="text-lg font-bold text-gray-700">Sucursal: {sucursales.find(s => s._id === appliedFilters.sucursal)?.nombre || appliedFilters.sucursal}</p>
                            <div className="flex justify-center gap-8 mt-4 text-sm font-bold">
                                <span>Fecha: {appliedFilters.date}</span>
                                <span>Generado: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-indigo-50 hover:border-indigo-100 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ventas Totales (Bruto)</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{formatBs(resumen_ventas.total_bruto)}</h3>
                    <p className="text-xs text-indigo-600 font-bold mt-2">Incluye todos los métodos</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-emerald-50 hover:border-emerald-100 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ingreso en Efectivo</p>
                    <h3 className="text-2xl font-black text-emerald-700 mt-1">{formatBs(resumen_ventas.por_metodo.EFECTIVO)}</h3>
                    <p className="text-xs text-emerald-600 font-bold mt-2">Monto real en caja física</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-amber-50 hover:border-amber-100 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <ArrowDownCircle size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Gastos / Egresos</p>
                    <h3 className="text-2xl font-black text-amber-700 mt-1">{formatBs(gastos.total)}</h3>
                    <p className="text-xs text-amber-600 font-bold mt-2">{gastos.detalle.length} movimientos de salida</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-900/5 hover:border-gray-900/20 transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-900 text-white rounded-xl">
                            <ShoppingBag size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Balance Neto de Caja</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{formatBs(balance_neto)}</h3>
                    <p className="text-xs text-gray-400 font-bold mt-2">Efectivo - Gastos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods Detail */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-600" />
                        <h3 className="font-bold text-gray-800">Ventas por Método de Pago</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {Object.entries(resumen_ventas.por_metodo).map(([metodo, monto]) => (
                            <div key={metodo} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-8 rounded-full ${metodo === 'EFECTIVO' ? 'bg-emerald-500' : metodo === 'QR' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                                    <span className="font-bold text-gray-700 text-sm tracking-tight">{metodo}</span>
                                </div>
                                <span className="font-black text-gray-900">{formatBs(monto as number)}</span>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between">
                            <span className="font-bold text-red-500 text-sm flex items-center gap-1.5"><Ban size={14}/> Ventas Anuladas</span>
                            <span className="font-black text-red-600">{formatBs(resumen_ventas.anuladas.monto)} ({resumen_ventas.anuladas.cantidad})</span>
                        </div>
                        <div className="pt-2 flex justify-between">
                            <span className="font-bold text-orange-500 text-sm flex items-center gap-1.5"><Tag size={14}/> Descuentos Otorgados</span>
                            <span className="font-black text-orange-600">{formatBs(resumen_ventas.total_descuentos)}</span>
                        </div>
                        <div className="pt-2 flex justify-between border-t border-gray-100 mt-2">
                            <span className="font-bold text-gray-500 text-sm flex items-center gap-1.5"><Coins size={14}/> Vueltos Entregados (Cambio)</span>
                            <span className="font-black text-gray-700">{formatBs(resumen_ventas.total_cambio || 0)}</span>
                        </div>
                        <div className="pt-2 flex justify-between border-t border-gray-100 mt-2">
                            <span className="font-bold text-purple-600 text-sm flex items-center gap-1.5" title="Crédito otorgado a clientes, no ingresa a caja física hoy"><Coins size={14}/> Créditos Otorgados (no afecta efectivo)</span>
                            <span className="font-black text-purple-700">{formatBs(resumen_ventas.total_creditos || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2 text-amber-700">
                        <ArrowDownCircle size={18} />
                        <h3 className="font-bold">Detalle de Gastos de Caja</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Motivo</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                    <th className="px-6 py-3 text-center">Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {gastos.detalle.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-gray-400 font-medium italic">Sin gastos registrados hoy</td>
                                    </tr>
                                ) : (
                                    gastos.detalle.map((g: any, i: number) => (
                                        <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{g.descripcion}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">Cajero: {g.cajero}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-amber-600">{formatBs(g.monto)}</td>
                                            <td className="px-6 py-4 text-center font-mono text-gray-400">{g.hora}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Inventory Sold */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                    <Package size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-gray-800">Artículos Vendidos Hoy</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Producto / Descripción</th>
                                <th className="px-6 py-3 text-center">Cant.</th>
                                <th className="px-6 py-3 text-right">Total Bs.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items_vendidos.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400 font-medium italic">Sin ventas de artículos</td>
                                </tr>
                            ) : (
                                items_vendidos.map((it: any, i: number) => (
                                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{it.producto}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-gray-100 rounded-lg font-black text-gray-700">{it.cantidad}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900">{formatBs(it.total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
                );
            })()}
        </div>
    );
}
