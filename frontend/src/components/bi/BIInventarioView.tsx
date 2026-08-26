import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, Filter, Maximize2, RotateCcw, AlertTriangle,
    Package, DollarSign, AlertCircle, CheckCircle2, XCircle, Info, Building2
} from 'lucide-react';
import { getBIInventarioControl, getBISucursales } from '../../api/biApi';
import type { BIInventarioControlResponse, BISucursalOption } from '../../api/biApi';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const BIInventarioView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursalesOptions, setSucursalesOptions] = useState<BISucursalOption[]>([]);

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
            
            {/* CABECERA ESTILO PASTEL */}
            <div className="bg-gradient-to-r from-purple-50/90 via-violet-50/70 to-indigo-50/90 rounded-3xl p-6 shadow-sm border border-purple-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-purple-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Package size={14} className="text-purple-700" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — FASE 6</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Inventario, Stock & Valorización</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Modelo Estrella (`FACT_INVENTARIO`) sobre MongoDB `inventario` y `products` (<span className="text-purple-700 font-black bg-purple-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)
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

            {/* BARRA TRANSPARENTE SOBRE ROTACIÓN KARDEX DECLARADA NO DISPONIBLE */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-amber-900 text-xs font-bold shadow-xs">
                <Info size={18} className="text-amber-600 shrink-0" />
                <span>
                    <strong>Índice de Rotación Kardex:</strong> Declarado oficial como <span className="bg-amber-200/70 px-2 py-0.5 rounded-md font-black">NO DISPONIBLE</span> al no contar con un historial de movimientos continuos de almacén en la base de datos operacional.
                </span>
            </div>

            {/* CONTROLES DE FILTRADO */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {sucursalesOptions.map((s) => (
                                <option key={s.sucursal_id} value={s.sucursal_id}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {data && (
                    <div className="text-xs font-bold text-slate-500">
                        <span>Última Sincronización POS: <strong className="text-purple-700">{data.ultima_actualizacion}</strong></span>
                    </div>
                )}
            </div>

            {/* TARJETAS KPIS PRINCIPALES */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* KPI 1: UNIDADES TOTALES EN STOCK */}
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

                    {/* KPI 2: VALORIZACIÓN A PRECIO DE COSTO */}
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

                    {/* KPI 3: SKUS AGOTADOS EN TIENDA */}
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

                    {/* KPI 4: SKUS EN STOCK BAJO / CRÍTICO */}
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

            {/* SECCIÓN SUCURSALES Y DETALLE DE PRODUCTOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* SIDEBAR DESGLOSE DE SUCURSALES (1 TERCIO) */}
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

                {/* TABLA DE TOP PRODUCTOS EN INVENTARIO (2 TERCIOS) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Productos con Mayor Valor de Inventario</h3>
                            <p className="text-xs text-slate-400 font-bold">Ordenados por `valor_total_costo`</p>
                        </div>
                        <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
                            {data?.top_productos_inventario.length || 0} Productos
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
                                {data?.top_productos_inventario.slice(0, 30).map((p, idx) => (
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

        </div>
    );
};
