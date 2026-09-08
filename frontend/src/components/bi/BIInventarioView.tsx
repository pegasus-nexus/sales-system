import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, Filter, Maximize2, RotateCcw, AlertTriangle, Search, X,
    Package, DollarSign, AlertCircle, CheckCircle2, XCircle, Building2,
    ShoppingCart, Sparkles, Clock, ShieldAlert
} from 'lucide-react';
import { getBIInventarioControl, getBISucursales } from '../../api/biApi';
import type { BIInventarioControlResponse, BISucursalOption } from '../../api/biApi';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface BIInventarioViewProps {
    initialSubTab?: 'valorizacion' | 'demanda' | 'kardex';
    hideHeader?: boolean;
}

export const BIInventarioView: React.FC<BIInventarioViewProps> = ({
    initialSubTab = 'valorizacion',
    hideHeader = false
}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursalesOptions, setSucursalesOptions] = useState<BISucursalOption[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeSubTab, setActiveSubTab] = useState<'valorizacion' | 'demanda' | 'kardex'>(initialSubTab);

    useEffect(() => {
        if (initialSubTab) {
            setActiveSubTab(initialSubTab);
        }
    }, [initialSubTab]);

    const [data, setData] = useState<BIInventarioControlResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursalesOptions(list);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
        }
    };

    const fetchInventarioData = useCallback(async (sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIInventarioControl(sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo control de inventario:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi-inventario/control no fue encontrado.'
                    : 'Error de conexión con el servicio de inventario del BI.');
            setError(msg);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSucursales();
    }, []);

    useEffect(() => {
        fetchInventarioData(selectedSucursal);
    }, [selectedSucursal, fetchInventarioData]);

    const handleReset = () => {
        setSelectedSucursal('all');
        setSearchTerm('');
        setActiveSubTab('valorizacion');
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const filteredProducts = (data?.top_productos_inventario || []).filter(p => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) || p.categoria_nombre.toLowerCase().includes(term);
    });

    const filteredReorder = (data?.sugerencias_reabastecimiento || []).filter(p => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) || p.categoria_nombre.toLowerCase().includes(term);
    });

    if (error && !loading) {
        return (
            <div className="bg-rose-50/90 border-2 border-rose-200/80 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 text-rose-950 max-w-4xl mx-auto my-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-600 shadow-xs">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900">No fue posible obtener el control de inventario</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">Error de Comunicación HTTP / Servidor Backend</p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">{error}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-rose-200 flex justify-end">
                    <button
                        onClick={() => fetchInventarioData(selectedSucursal)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={14} /> Reintentar Conexión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#f8f9fd] p-1 sm:p-2 space-y-6 font-sans text-slate-800 w-full ${isFullscreen ? 'p-8' : ''}`}>
            
            {/* CABECERA DINÁMICA SEGÚN PESTAÑA */}
            {!hideHeader && (
                <div className="bg-gradient-to-r from-purple-50/90 via-violet-50/70 to-indigo-50/90 rounded-3xl p-6 shadow-sm border border-purple-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                    <div>
                        <div className="flex items-center gap-2 text-purple-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                            <div className="p-1 bg-white rounded-lg shadow-xs">
                                <Package size={14} className="text-purple-700" />
                            </div>
                            <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 6</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            {activeSubTab === 'valorizacion' && 'Inventario, Stock & Valorización'}
                            {activeSubTab === 'demanda' && 'Demanda Predictiva & Pedidos a Futuro'}
                            {activeSubTab === 'kardex' && 'Historial de Movimientos Kárdex'}
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                            Modelo Estrella (`FACT_INVENTARIO`) sobre MongoDB `inventario`, `products` y `sales` (<span className="text-purple-700 font-black bg-purple-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchInventarioData(selectedSucursal)}
                            disabled={loading}
                            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            <span>Actualizar</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs"
                        >
                            <RotateCcw size={14} className="text-slate-500" />
                            <span>Restablecer</span>
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs"
                        >
                            <Maximize2 size={14} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            )}

            {/* CONTROLES DE FILTRADO Y BÚSQUEDA */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* FILTRO SUCURSALES */}
                    <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
                        <Filter size={14} className="text-purple-600" />
                        <span className="text-xs font-black text-slate-500">Sucursal:</span>
                        <select
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="bg-transparent text-xs font-black text-purple-950 outline-none cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {sucursalesOptions.map((s) => (
                                <option key={s.sucursal_id} value={s.sucursal_id}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* BUSCADOR DE PRODUCTOS */}
                    <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl w-full sm:w-64">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar producto o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full placeholder:text-slate-400 placeholder:font-semibold"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {data && (
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                        <Clock size={14} className="text-purple-600" />
                        <span>Última Sincronización POS: <strong className="text-purple-700 font-black">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* SUB-PESTAÑA 1: VALORIZACIÓN Y STOCK GENERAL */}
            {activeSubTab === 'valorizacion' && (
                <>
                    {/* TARJETAS KPIS PRINCIPALES */}
                    {data && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
                            <div className="bg-gradient-to-br from-purple-50/90 via-violet-50/40 to-white rounded-3xl p-5 shadow-xs border border-purple-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-purple-100/60">
                                    <span className="text-xs font-black uppercase text-purple-950">Total Unidades Stock</span>
                                    <div className="p-2 bg-purple-100/70 text-purple-600 rounded-2xl">
                                        <Package size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {data.kpis.total_unidades_stock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} un.
                                    </h2>
                                    <p className="text-xs font-extrabold text-purple-700 mt-1">
                                        {data.kpis.skus_con_stock_disponible} SKUs activos con stock (`&gt; 0`)
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">SUM(inventario.cantidad)</span>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-emerald-100/60">
                                    <span className="text-xs font-black uppercase text-emerald-950">Valorización del Inventario</span>
                                    <div className="p-2 bg-emerald-100/70 text-emerald-600 rounded-2xl">
                                        <DollarSign size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {formatBs(data.kpis.valorizacion_costo_total)}
                                    </h2>
                                    <p className="text-xs font-extrabold text-emerald-700 mt-1">
                                        Calculado a Precio de Costo Maestro
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">SUM(cantidad * costo_producto)</span>
                            </div>

                            <div className="bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white rounded-3xl p-5 shadow-xs border border-rose-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-rose-100/60">
                                    <span className="text-xs font-black uppercase text-rose-950">SKUs Agotados en Tienda</span>
                                    <div className="p-2 bg-rose-100/70 text-rose-600 rounded-2xl">
                                        <XCircle size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {data.kpis.skus_agotados}
                                    </h2>
                                    <p className="text-xs font-extrabold text-rose-700 mt-1">
                                        Registros de almacén con `cantidad &lt;= 0`
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">Registros de inventario agotados</span>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-amber-100/60">
                                    <span className="text-xs font-black uppercase text-amber-950">SKUs en Stock Bajo</span>
                                    <div className="p-2 bg-amber-100/70 text-amber-600 rounded-2xl">
                                        <AlertCircle size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {data.kpis.skus_stock_bajo}
                                    </h2>
                                    <p className="text-xs font-extrabold text-amber-700 mt-1">
                                        Stock crítico entre 1 y 5 unidades
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">1 &lt;= cantidad &lt;= 5</span>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN SUCURSALES Y TABLA PRINCIPAL DE VALORIZACIÓN */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4 h-fit">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Stock por Sucursal / Tienda</h3>
                                    <p className="text-xs text-slate-400 font-bold">Valorización a precio de costo</p>
                                </div>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-2xl">
                                    <Building2 size={18} />
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {data?.desglose_sucursales.map((s) => (
                                    <div key={s.sucursal_id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-black text-slate-900">{s.nombre}</span>
                                            <span className="font-black text-purple-700">{formatBs(s.valorizacion_costo)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                            <span>{s.unidades_stock.toLocaleString()} un. ({s.skus_conteo} SKUs)</span>
                                            <span className="text-rose-600 font-black">{s.skus_agotados} agotados</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Catálogo de Productos y Valorización de Inventario</h3>
                                    <p className="text-xs text-slate-400 font-bold">Ordenados por `valor_total_costo`</p>
                                </div>
                                <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
                                    {filteredProducts.length} Productos
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                            <th className="py-3 px-3">Producto</th>
                                            <th className="py-3 px-3">Categoría</th>
                                            <th className="py-3 px-3 text-right">Stock Actual</th>
                                            <th className="py-3 px-3 text-right">Costo Unit.</th>
                                            <th className="py-3 px-3 text-right">Valor Total</th>
                                            <th className="py-3 px-3 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                        {filteredProducts.slice(0, 50).map((p, idx) => (
                                            <tr key={p.producto_id || idx} className="hover:bg-purple-50/40 transition-colors">
                                                <td className="py-3 px-3 font-black text-slate-900 max-w-xs truncate">
                                                    {p.nombre}
                                                </td>
                                                <td className="py-3 px-3 text-slate-500">
                                                    {p.categoria_nombre}
                                                </td>
                                                <td className="py-3 px-3 text-right text-slate-800">{p.stock_actual} un.</td>
                                                <td className="py-3 px-3 text-right text-slate-500">{formatBs(p.costo_unitario)}</td>
                                                <td className="py-3 px-3 text-right font-black text-slate-900">{formatBs(p.valor_total_costo)}</td>
                                                <td className="py-3 px-3 text-center">
                                                    {p.estado_stock === 'OK' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                            <CheckCircle2 size={10} /> OK
                                                        </span>
                                                    )}
                                                    {p.estado_stock === 'BAJO' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                            <AlertCircle size={10} /> BAJO
                                                        </span>
                                                    )}
                                                    {p.estado_stock === 'AGOTADO' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                                            <XCircle size={10} /> AGOTADO
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* SUB-PESTAÑA 2: DEMANDA PREDICTIVA & REABASTECIMIENTO A FUTURO */}
            {activeSubTab === 'demanda' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                                <Sparkles size={16} />
                                <span>Algoritmo de Inferencia de Demanda a 30 Días</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black">Proyección & Presupuesto de Pedidos a Futuro</h2>
                            <p className="text-xs text-purple-200 font-medium max-w-2xl">
                                Analiza la velocidad diaria de ventas reales (`unidades/día`) en los últimos 30 días y estima el stock necesario para mantener cobertura óptima sin quiebres de inventario.
                            </p>
                        </div>
                    </div>

                    {/* KPIS DE PREVISIÓN */}
                    {data && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white rounded-3xl p-5 shadow-xs border border-indigo-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-indigo-100">
                                    <span className="text-xs font-black uppercase text-indigo-950">Presupuesto Estimado Pedido (30d)</span>
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl">
                                        <DollarSign size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {formatBs(data.kpis.presupuesto_reabastecimiento_bs)}
                                    </h2>
                                    <p className="text-xs font-extrabold text-indigo-700 mt-1">
                                        Costo total estimado para abastecer catálogo
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">SUM(sugerencia_unidades * costo_unitario)</span>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 via-violet-50/50 to-white rounded-3xl p-5 shadow-xs border border-purple-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-purple-100">
                                    <span className="text-xs font-black uppercase text-purple-950">Unidades Totales Sugeridas</span>
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-2xl">
                                        <ShoppingCart size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {(data.kpis.unidades_sugeridas_totales || 0).toLocaleString()} un.
                                    </h2>
                                    <p className="text-xs font-extrabold text-purple-700 mt-1">
                                        Volumen recomendado a solicitar a proveedores
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">Target Cobertura: 30 Días</span>
                            </div>

                            <div className="bg-gradient-to-br from-rose-50 via-amber-50/50 to-white rounded-3xl p-5 shadow-xs border border-rose-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start pb-2 border-b border-rose-100">
                                    <span className="text-xs font-black uppercase text-rose-950">SKUs Reabastecimiento Crítico</span>
                                    <div className="p-2 bg-rose-100 text-rose-600 rounded-2xl">
                                        <ShieldAlert size={18} />
                                    </div>
                                </div>
                                <div className="my-3">
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">
                                        {data.kpis.skus_sugerencia_pedido} SKUs
                                    </h2>
                                    <p className="text-xs font-extrabold text-rose-700 mt-1">
                                        Productos agotados o con cobertura &lt; 15 días
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">Reabastecimiento urgente recomendado</span>
                            </div>
                        </div>
                    )}

                    {/* TABLA DETALLADA DE SUGERENCIAS DE PEDIDO A FUTURO */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Matriz de Sugerencias de Reabastecimiento a Futuro</h3>
                                <p className="text-xs text-slate-400 font-bold">Ordenados por prioridad de monto de compra e impacto en ventas</p>
                            </div>
                            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                                {filteredReorder.length} Sugerencias
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                        <th className="py-3 px-3">Producto / Categoría</th>
                                        <th className="py-3 px-3 text-right">Stock Actual</th>
                                        <th className="py-3 px-3 text-right">Ventas Diarias (30d)</th>
                                        <th className="py-3 px-3 text-center">Días Cobertura</th>
                                        <th className="py-3 px-3 text-right">Sugerencia Pedido (30d)</th>
                                        <th className="py-3 px-3 text-right">Presupuesto Est. (Bs.)</th>
                                        <th className="py-3 px-3 text-center">Prioridad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                    {filteredReorder.map((p, idx) => (
                                        <tr key={p.producto_id || idx} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="py-3.5 px-3">
                                                <div className="font-black text-slate-900">{p.nombre}</div>
                                                <div className="text-[10px] text-slate-400 font-semibold">{p.categoria_nombre}</div>
                                            </td>
                                            <td className="py-3.5 px-3 text-right text-slate-800">{p.stock_actual} un.</td>
                                            <td className="py-3.5 px-3 text-right text-indigo-700 font-black">
                                                {(p.velocidad_diaria_ventas || 0).toFixed(2)} un/día
                                            </td>
                                            <td className="py-3.5 px-3 text-center">
                                                {p.dias_cobertura_estimados !== null && p.dias_cobertura_estimados !== undefined ? (
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                                        p.dias_cobertura_estimados <= 7
                                                            ? 'text-rose-700 bg-rose-50 border-rose-100'
                                                            : p.dias_cobertura_estimados <= 15
                                                            ? 'text-amber-700 bg-amber-50 border-amber-100'
                                                            : 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                                    }`}>
                                                        {p.dias_cobertura_estimados} días
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Sin Ventas</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-3 text-right font-black text-purple-950">
                                                {(p.sugerencia_reabastecimiento_unidades || 0).toLocaleString()} un.
                                            </td>
                                            <td className="py-3.5 px-3 text-right font-black text-slate-900">
                                                {formatBs(p.sugerencia_monto_bs)}
                                            </td>
                                            <td className="py-3.5 px-3 text-center">
                                                {p.alerta_cobertura === 'AGOTADO' && (
                                                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md uppercase">URGENTE (AGOTADO)</span>
                                                )}
                                                {p.alerta_cobertura === 'URGENTE' && (
                                                    <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md uppercase">CRÍTICO</span>
                                                )}
                                                {p.alerta_cobertura === 'ALERTA' && (
                                                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md uppercase">ALERTA</span>
                                                )}
                                                {p.alerta_cobertura === 'SALUDABLE' && (
                                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">SALUDABLE</span>
                                                )}
                                                {p.alerta_cobertura === 'SIN_VENTAS' && (
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">SIN DEMANDA</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* SUB-PESTAÑA 3: MOVIMIENTOS KÁRDEX RECIENTES */}
            {activeSubTab === 'kardex' && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Historial Inmutable de Movimientos (Kárdex)</h3>
                            <p className="text-xs text-slate-400 font-bold">Registros directos de la colección `db.inventory_logs`</p>
                        </div>
                        <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
                            {data?.movimientos_kardex_recientes?.length || 0} Registros
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                    <th className="py-3 px-3">Fecha / Hora</th>
                                    <th className="py-3 px-3">Producto</th>
                                    <th className="py-3 px-3">Tipo Movimiento</th>
                                    <th className="py-3 px-3 text-right">Cantidad Movida</th>
                                    <th className="py-3 px-3 text-right">Stock Resultante</th>
                                    <th className="py-3 px-3 text-right">Operador</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {(data?.movimientos_kardex_recientes || []).map((m) => (
                                    <tr key={m.log_id} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{m.fecha}</td>
                                        <td className="py-3 px-3 font-black text-slate-900">{m.descripcion}</td>
                                        <td className="py-3 px-3">
                                            <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                                {m.tipo_movimiento}
                                            </span>
                                        </td>
                                        <td className={`py-3 px-3 text-right font-black ${m.cantidad_movida >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {m.cantidad_movida > 0 ? `+${m.cantidad_movida}` : m.cantidad_movida} un.
                                        </td>
                                        <td className="py-3 px-3 text-right font-black text-slate-900">{m.stock_resultante} un.</td>
                                        <td className="py-3 px-3 text-right text-slate-500">{m.usuario_nombre}</td>
                                    </tr>
                                ))}
                                {(!data?.movimientos_kardex_recientes || data.movimientos_kardex_recientes.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                                            No existen registros recientes en el Kárdex de almacén.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

