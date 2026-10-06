import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { client, getSucursales } from '../api/api';
import { 
    Loader2, Calendar, Store, Scale, AlertTriangle, Info, TrendingUp, Download, FileDown
} from 'lucide-react';
import { getBoliviaTodayISO } from '../utils/dateUtils';
import html2canvas from 'html2canvas';
import { descargarPDFAuditoria } from '../utils/reportPDF';

const formatBs = (num?: number) => `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ReconciliationData {
    inventario_inicial_costo: number;
    revalorizacion_costos: number;
    ingresos_inventario_costo: number;
    salidas_mermas_costo: number;
    costo_ventas: number;
    ventas_netas: number;
    ventas_promocion?: number;
    ventas_regulares?: number;
    ganancia_bruta: number;
    inventario_final_costo: number;
    desglose_ingresos?: Record<string, number>;
    desglose_salidas?: Record<string, number>;
    detalles_anomalias?: {
        id: string;
        tipo: string;
        producto: string;
        cantidad: number;
        costo: number;
        fecha: string;
        usuario_id: string;
    }[];
}

export default function InventoryReconciliationView() {
    const today = getBoliviaTodayISO();
    const sevenDaysAgo = (() => {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    })();
    
    const [searchParams, setSearchParams] = useSearchParams();
    
    const startDate = searchParams.get('rec_start') || sevenDaysAgo;
    const endDate = searchParams.get('rec_end') || today;
    const selectedSucursal = searchParams.get('rec_sucursal') || 'all';

    const setStartDate = (val: string) => { const p = new URLSearchParams(searchParams); p.set('rec_start', val); setSearchParams(p); };
    const setEndDate = (val: string) => { const p = new URLSearchParams(searchParams); p.set('rec_end', val); setSearchParams(p); };
    const setSelectedSucursal = (val: string) => { const p = new URLSearchParams(searchParams); p.set('rec_sucursal', val); setSearchParams(p); };

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: getSucursales
    });

    const { data: report, isLoading, isError } = useQuery({
        queryKey: ['conciliacion', startDate, endDate, selectedSucursal],
        queryFn: () => client<ReconciliationData>(`/reports/conciliacion-inventario?start_date=${startDate}&end_date=${endDate}&sucursal_id=${selectedSucursal}`),
        enabled: !!startDate && !!endDate
    });

    const handleDownloadImg = async () => {
        const el = document.getElementById('conciliacion-card');
        if (!el) return;
        const canvas = await html2canvas(el, { scale: 2 });
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `Auditoria_Inventario_${selectedSucursal}_${today}.png`;
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Filter Controls ───────────────────────────────────── */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end print:hidden">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Fecha Inicio</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Fecha Fin</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 grow max-w-xs">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Sucursal</label>
                    <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select 
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm font-bold text-gray-700 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {sucursales?.map((s: any) => (
                                <option key={s._id} value={s._id}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <button 
                        onClick={handleDownloadImg}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                        <Download size={18} /> Imagen
                    </button>
                    <button 
                        onClick={() => {
                            if (report) {
                                const sucNombre = selectedSucursal === 'all' ? 'Global' : (sucursales?.find(s => s._id === selectedSucursal)?.nombre || selectedSucursal);
                                descargarPDFAuditoria(report, startDate, endDate, sucNombre);
                            }
                        }}
                        disabled={!report}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        <FileDown size={18} /> Descargar PDF
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-gray-100">
                    <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                    <p className="text-gray-400 font-medium animate-pulse">Cruzando bases de datos de inventario y caja...</p>
                </div>
            ) : isError || !report ? (
                <div className="p-10 bg-red-50 text-red-600 rounded-[32px] text-center border border-red-100 italic font-medium">
                    Ocurrió un error al procesar la conciliación. Intenta acortar el rango de fechas.
                </div>
            ) : (
                <div id="conciliacion-card" className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Scale className="text-indigo-600" /> Auditoría: Inventario vs Caja
                            </h2>
                            <p className="text-gray-500 mt-1">Del {startDate} al {endDate}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sucursal</p>
                            <p className="text-lg font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg inline-block">
                                {selectedSucursal === 'all' ? 'Consolidado Global' : sucursales?.find(s => s._id === selectedSucursal)?.nombre}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* ── Columna 1: Análisis de Inventario ────────────────────────────────── */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2">
                                <Store size={14} /> 1. Movimientos Físicos (Valor al Costo)
                            </h3>
                            
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-bold text-[11px] uppercase tracking-wider">Inventario Inicial <span className="opacity-50">(antes del {startDate})</span></span>
                                    <span className="font-bold text-gray-900">{formatBs(report.inventario_inicial_costo)}</span>
                                </div>
                                <div className="h-px bg-gray-200/50 my-1"></div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-medium">(+) Ingresos a Inventario (Pedidos, Compras)</span>
                                    <span className="font-bold text-indigo-600">+{formatBs(report.ingresos_inventario_costo)}</span>
                                </div>
                                
                                {report.desglose_ingresos && Object.entries(report.desglose_ingresos).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs pl-4 text-gray-500">
                                        <span>• {k.replace('_', ' ')}</span>
                                        <span>{formatBs(v)}</span>
                                    </div>
                                ))}
                                <div className="text-right mt-1 mb-2">
                                    <Link to="/compras" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase block">Ir al Historial de Compras/Ingresos →</Link>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="font-medium flex items-center gap-1">(-) Mermas y Salidas Manuales <div title="Mercadería retirada sin cobrar"><Info size={14} className="opacity-50" /></div></span>
                                    <span className="font-bold">-{formatBs(report.salidas_mermas_costo)}</span>
                                </div>
                                {report.desglose_salidas && Object.entries(report.desglose_salidas).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs pl-4 text-red-400/80">
                                        <span>• {k.replace('_', ' ')}</span>
                                        <span>{formatBs(v)}</span>
                                    </div>
                                ))}
                                <div className="text-right mt-1 mb-2">
                                    <Link to="/auditoria-inventario" className="text-[10px] text-red-500 hover:underline font-bold uppercase block">Auditar Mermas e Inventario →</Link>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="font-medium">(-) Costo de Ventas (Salió por Caja)</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>
                                {report.revalorizacion_costos !== 0 && (
                                    <>
                                        <div className="h-px bg-gray-200/50 my-1"></div>
                                        <div className="flex justify-between items-center text-sm text-orange-600">
                                            <span className="font-medium flex items-center gap-1">(±) Ajuste por Revalorización <div title="Diferencia generada por cambios en el Costo Unitario del catálogo"><Info size={14} className="opacity-50" /></div></span>
                                            <span className="font-bold">{report.revalorizacion_costos > 0 ? '+' : ''}{formatBs(report.revalorizacion_costos)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex justify-between items-center">
                                <div>
                                    <span className="text-blue-800 font-bold block">Inventario Final Calculado</span>
                                    <span className="text-[11px] text-blue-600">Stock físico actual valorado al costo</span>
                                </div>
                                <span className="font-black text-blue-900 text-xl">{formatBs(report.inventario_final_costo)}</span>
                            </div>
                        </div>

                        {/* ── Columna 2: Análisis Financiero (Caja) ────────────────────────────── */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2">
                                <TrendingUp size={14} /> 2. Rendimiento Financiero
                            </h3>

                            <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-200">
                                <span className="text-indigo-200 font-bold uppercase tracking-widest text-[10px] block mb-1">Total Ingresos en Caja (Ventas Netas)</span>
                                <span className="font-black text-4xl">{formatBs(report.ventas_netas)}</span>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-gray-200 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-bold">Ventas Netas (Global)</span>
                                    <span className="font-bold text-gray-900">{formatBs(report.ventas_netas)}</span>
                                </div>
                                {report.ventas_regulares !== undefined && (
                                    <>
                                        <div className="flex justify-between items-center text-xs pl-4 text-gray-500">
                                            <span>• Ventas a Precio Regular</span>
                                            <span>{formatBs(report.ventas_regulares)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pl-4 text-indigo-500 font-bold bg-indigo-50/50 rounded p-1">
                                            <span>• Ventas Fraccionadas / Promoción</span>
                                            <span>{formatBs(report.ventas_promocion)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="text-right mt-1 mb-2">
                                    <Link to="/reportes?tab=daily" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase block">Ver Reporte de Ventas por Jornada →</Link>
                                </div>
                                <div className="h-px bg-gray-100 my-2"></div>
                                <div className="flex justify-between items-center text-sm text-red-500">
                                    <span className="font-medium">(-) Costo de la Mercadería Vendida</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>
                                <div className="h-px bg-gray-200 my-2"></div>
                                <div className="flex justify-between items-center text-lg text-emerald-600">
                                    <span className="font-black uppercase tracking-wide">Ganancia Bruta</span>
                                    <span className="font-black">{formatBs(report.ganancia_bruta)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alertas Automáticas */}
                    {report.salidas_mermas_costo > 0 && (
                        <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start text-amber-800 text-sm">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <strong>Atención:</strong> Tuviste salidas de inventario o mermas por un valor al costo de {formatBs(report.salidas_mermas_costo)} que no generaron ingresos en caja. Esta mercadería "perdida" afecta tu rentabilidad final.
                            </div>
                        </div>
                    )}

                    {report.detalles_anomalias && report.detalles_anomalias.length > 0 && (
                        <div className="mt-8">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <AlertTriangle size={18} className="text-amber-500" /> Registro Detallado de Anomalías (Mermas, Ajustes y Salidas Manuales)
                            </h3>
                            <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3 text-right">Cantidad</th>
                                            <th className="px-4 py-3 text-right">Impacto (Bs)</th>
                                            <th className="px-4 py-3">Usuario / Ref</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {report.detalles_anomalias.map(an => (
                                            <tr key={an.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-600">{new Date(an.fecha).toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <span className={an.costo < 0 ? "px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700" : "px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700"}>
                                                        {an.tipo.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{an.producto}</td>
                                                <td className="px-4 py-3 text-right text-gray-700">{an.cantidad}</td>
                                                <td className={an.costo < 0 ? "px-4 py-3 text-right font-bold text-red-600" : "px-4 py-3 text-right font-bold text-emerald-600"}>
                                                    {formatBs(Math.abs(an.costo))}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[150px]">{an.usuario_id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center text-xs text-gray-400">
                        * El costo de ventas se calcula basándose en el "Costo Unitario" registrado en el Kárdex al momento exacto de la venta.<br/>
                        Generado el {new Date().toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}
