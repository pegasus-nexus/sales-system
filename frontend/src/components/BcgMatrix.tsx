import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getBcgMatrix, getProducts, getCategories, getSucursales } from '../api/api';
import {
    Target, Star, Package, HelpCircle, ArrowDownCircle,
    AlertTriangle, Search, Store, Filter, Layers, BarChart2, LayoutGrid, CircleDollarSign, Plus, X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

/* ─── Configuración de cuadrantes ────────────────────────── */
const QUADRANTS_CONFIG = [
    {
        key: 'estrellas', label: '⭐ Alto Valor',
        desc: 'Alto volumen · Altas ventas',
        bg: 'bg-emerald-50/50', border: 'border-emerald-200/50', hdr: 'text-emerald-800',
        icon: <Star fill="currentColor" size={16}/>, iconBg: 'bg-emerald-100 text-emerald-600',
        empty: 'Sin productos de alto valor.',
    },
    {
        key: 'interrogantes', label: '❓ Gen. de Volumen',
        desc: 'Alto volumen · Bajas ventas',
        bg: 'bg-purple-50/50', border: 'border-purple-200/50', hdr: 'text-purple-800',
        icon: <HelpCircle size={16}/>, iconBg: 'bg-purple-100 text-purple-600',
        empty: 'Sin generadores de volumen.',
    },
    {
        key: 'vacas', label: '🐄 Premium/Nicho',
        desc: 'Bajo volumen · Altas ventas',
        bg: 'bg-blue-50/50', border: 'border-blue-200/50', hdr: 'text-blue-800',
        icon: <Package size={16}/>, iconBg: 'bg-blue-100 text-blue-600',
        empty: 'Sin productos premium/nicho.',
    },
    {
        key: 'perros', label: '🐕 A Revisar',
        desc: 'Bajo volumen · Bajas ventas',
        bg: 'bg-gray-100/50', border: 'border-gray-200/80', hdr: 'text-gray-700',
        icon: <ArrowDownCircle size={16}/>, iconBg: 'bg-gray-200 text-gray-600',
        empty: 'Sin elementos a revisar.',
    },
];

export interface BcgItem {
    producto_id: string;
    nombre: string;
    categoria_nombre?: string;
    ingresos_actuales: number;
    cantidad_vendida: number;
    margen_ganancia: number;
    cuadrante: 'ESTRELLA' | 'VACA' | 'INTERROGANTE' | 'PERRO';
    participacion_ventas?: number;
    participacion_margen?: number;
    totalItemsCount?: number;
}

export default function BcgMatrix() {
    const [selectedMonths, setSelectedMonths] = useState<string[]>([new Date().toISOString().slice(0, 7)]);
    const [newMonthInput, setNewMonthInput] = useState(() => new Date().toISOString().slice(0, 7));
    const [sucursal, setSucursal] = useState('');
    const [search,   setSearch]   = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError,   setIsError]   = useState(false);
    const [rawProducts, setRawProducts] = useState<BcgItem[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);

    const [groupBy, setGroupBy] = useState<'product' | 'category'>('product');
    const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
    const [hoveredPoint, setHoveredPoint] = useState<BcgItem | null>(null);
    
    const [bubbleSizeMetric, setBubbleSizeMetric] = useState<'sales' | 'margin'>('sales');

    const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [catalogo, setCatalogo] = useState<any[]>([]);
    const [sucursalesOptions, setSucursalesOptions] = useState<any[]>([]);

    useEffect(() => {
        getCategories().then(cats => setCategories(cats)).catch(console.error);
        getProducts(1, 2000).then(res => setCatalogo(res.items || [])).catch(console.error);
        getSucursales().then(res => setSucursalesOptions(res)).catch(console.error);
    }, []);

    const fetchData = useCallback(async () => {
        if (selectedMonths.length === 0) {
            setRawProducts([]);
            return;
        }
        setIsLoading(true); setIsError(false);
        try { 
            const sortedMonths = [...selectedMonths].sort((a, b) => a.localeCompare(b));
            
            const results = await Promise.all(sortedMonths.map(async (m) => {
                const [y, mm] = m.split('-');
                const s = new Date(+y, +mm-1, 1);
                const e = new Date(+y, +mm, 0); e.setHours(23,59,59,999);
                const raw: any = await getBcgMatrix(s.toISOString(), e.toISOString(), sucursal || undefined);
                return {
                    month: m,
                    products: [
                        ...(raw?.estrellas || []),
                        ...(raw?.vacas || []),
                        ...(raw?.interrogantes || []),
                        ...(raw?.perros || [])
                    ]
                };
            }));

            const productMap = new Map<string, BcgItem>();
            let totalVentas = 0;
            let totalMargen = 0;

            // Agregamos todos los meses en una sola burbuja unificada (SUMA)
            results.forEach(res => {
                res.products.forEach(p => {
                    const id = p.producto_id || p.nombre;
                    if (!productMap.has(id)) {
                        productMap.set(id, {
                            producto_id: p.producto_id,
                            nombre: p.nombre,
                            ingresos_actuales: 0,
                            cantidad_vendida: 0,
                            margen_ganancia: 0,
                            cuadrante: p.cuadrante, // Guardamos el cuadrante del primer mes que lo encuentre (o se re-calcula luego)
                        });
                    }
                    const item = productMap.get(id)!;
                    item.ingresos_actuales += (p.ingresos || 0);
                    item.cantidad_vendida += (p.cantidad || 0);
                    item.margen_ganancia += (p.margen || 0);
                    
                    totalVentas += (p.ingresos || 0);
                    totalMargen += (p.margen || 0);
                });
            });

            // Calculamos la participación %
            const allProducts = Array.from(productMap.values()).map(p => {
                p.participacion_ventas = totalVentas > 0 ? (p.ingresos_actuales / totalVentas) : 0;
                p.participacion_margen = totalMargen > 0 ? (p.margen_ganancia / totalMargen) : 0;
                return p;
            });
            
            setRawProducts(allProducts);
        }
        catch (e) {
            console.error(e);
            setIsError(true);
        }
        finally { setIsLoading(false); }
    }, [selectedMonths, sucursal]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const bcgData = useMemo(() => {
        let universoAnalisis: BcgItem[] = [];

        if (groupBy === 'category' && catalogo.length > 0) {
            const catMap: Record<string, BcgItem & {count: number}> = {};
            const prodToCat: Record<string, string> = {};
            catalogo.forEach(c => {
                prodToCat[(c.descripcion || c.nombre || '').toLowerCase().trim()] = (c.categoria || c.categoria_nombre || 'otros').toLowerCase().trim();
            });

            rawProducts.forEach(p => {
                const normName = p.nombre.toLowerCase().trim();
                const cat = prodToCat[normName] || 'otros';
                
                if (!catMap[cat]) {
                    catMap[cat] = {
                        producto_id: cat, nombre: cat.charAt(0).toUpperCase() + cat.slice(1), categoria_nombre: cat,
                        ingresos_actuales: 0, cantidad_vendida: 0, cuadrante: 'PERRO', margen_ganancia: 0, count: 0,
                        participacion_ventas: 0, participacion_margen: 0
                    };
                }
                catMap[cat].ingresos_actuales += p.ingresos_actuales;
                catMap[cat].cantidad_vendida += p.cantidad_vendida;
                catMap[cat].margen_ganancia += p.margen_ganancia;
                catMap[cat].participacion_ventas! += (p.participacion_ventas || 0);
                catMap[cat].participacion_margen! += (p.participacion_margen || 0);
                catMap[cat].count += 1;
            });

            universoAnalisis = Object.values(catMap).map(c => {
                c.totalItemsCount = c.count;
                return c;
            });
        } else {
            universoAnalisis = rawProducts.map(p => {
                const pCatMatch = catalogo.find(c => (c.descripcion || c.nombre || '').toLowerCase().trim() === p.nombre.toLowerCase().trim());
                p.categoria_nombre = pCatMatch ? (pCatMatch.categoria || pCatMatch.categoria_nombre || 'otros').toLowerCase().trim() : 'otros';
                return p;
            });
        }

        const filtered = universoAnalisis.filter(p => {
            if (groupBy === 'product' && selectedCategory && selectedCategory !== 'all') {
                if (p.categoria_nombre !== selectedCategory) return false;
            }
            if (search.trim().length >= 2) {
                if (!p.nombre.toLowerCase().includes(search.trim().toLowerCase())) return false;
            }
            return true;
        });

        const maxRevenue = filtered.length > 0 ? Math.max(...filtered.map(p => p.ingresos_actuales), 1) : 1;
        const maxVolume = filtered.length > 0 ? Math.max(...filtered.map(p => p.cantidad_vendida), 1) : 1;
        
        const avgRevenue = filtered.length > 0 ? filtered.reduce((a, b) => a + b.ingresos_actuales, 0) / filtered.length : 0;
        const avgVolume = filtered.length > 0 ? filtered.reduce((a, b) => a + b.cantidad_vendida, 0) / filtered.length : 0;

        filtered.forEach(item => {
            const es_alto_volumen = item.cantidad_vendida >= avgVolume;
            const es_altas_ventas = item.ingresos_actuales >= avgRevenue;

            if (item.ingresos_actuales === 0 && item.cantidad_vendida === 0) item.cuadrante = "PERRO";
            else if (es_alto_volumen && es_altas_ventas) item.cuadrante = "ESTRELLA";
            else if (!es_alto_volumen && es_altas_ventas) item.cuadrante = "VACA";
            else if (es_alto_volumen && !es_altas_ventas) item.cuadrante = "INTERROGANTE";
            else item.cuadrante = "PERRO";
        });

        const estrellas = filtered.filter(f => f.cuadrante === 'ESTRELLA').sort((a,b)=>b.ingresos_actuales - a.ingresos_actuales);
        const vacas = filtered.filter(f => f.cuadrante === 'VACA').sort((a,b)=>b.ingresos_actuales - a.ingresos_actuales);
        const interrogantes = filtered.filter(f => f.cuadrante === 'INTERROGANTE').sort((a,b)=>b.ingresos_actuales - a.ingresos_actuales);
        const perros = filtered.filter(f => f.cuadrante === 'PERRO').sort((a,b)=>b.ingresos_actuales - a.ingresos_actuales);

        return { estrellas, vacas, interrogantes, perros, itemsList: filtered, maxRevenue, maxVolume, avgRevenue, avgVolume };
    }, [rawProducts, selectedCategory, search, catalogo, groupBy]);

    const getLogPos = (val: number, maxVal: number) => {
        if (maxVal <= 0) return 0;
        return Math.log10(Math.max(val, 0) + 1) / Math.log10(maxVal + 1);
    };

    return (
        <div className="bg-[#f0f4f8] rounded-2xl shadow-sm border border-slate-200 p-5 overflow-hidden flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0"><Target size={20}/></div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none">Cartera de Productos</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Análisis de rentabilidad y participación unificada de los meses seleccionados.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm px-3 flex-wrap">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Meses:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                        {selectedMonths.map(m => (
                            <span key={m} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-100 shadow-sm">
                                {m}
                                {selectedMonths.length > 1 && (
                                    <button onClick={() => setSelectedMonths(prev => prev.filter(x => x !== m))} className="hover:bg-indigo-200 hover:text-indigo-900 p-0.5 rounded-full transition-colors ml-1"><X size={10}/></button>
                                )}
                            </span>
                        ))}
                    </div>
                    <div className="w-px h-5 bg-gray-200 mx-1"></div>
                    <input type="month" value={newMonthInput} onChange={e => setNewMonthInput(e.target.value)} className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-gray-100" />
                    <button onClick={() => {
                        if (newMonthInput && !selectedMonths.includes(newMonthInput)) {
                            setSelectedMonths(prev => [...prev, newMonthInput]);
                        }
                    }} className="p-1 bg-gray-800 text-white rounded-md hover:bg-black transition-colors shadow-sm disabled:opacity-50" disabled={!newMonthInput || selectedMonths.includes(newMonthInput)}>
                        <Plus size={12}/>
                    </button>
                </div>
                
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={() => setGroupBy('product')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", groupBy === 'product' ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><Package size={14} /> Productos</button>
                    <button onClick={() => setGroupBy('category')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", groupBy === 'category' ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><Layers size={14} /> Categorías</button>
                </div>
                
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2 mr-1">Tamaño de Burbujas:</span>
                    <button onClick={() => setBubbleSizeMetric('sales')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all", bubbleSizeMetric === 'sales' ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><BarChart2 size={14} /> Participación en Ventas</button>
                    <button onClick={() => setBubbleSizeMetric('margin')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all", bubbleSizeMetric === 'margin' ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><CircleDollarSign size={14} /> Participación en Margen</button>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={() => setViewMode('chart')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'chart' ? "bg-gray-900 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><BarChart2 size={14} /> Gráfico</button>
                    <button onClick={() => setViewMode('cards')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'cards' ? "bg-gray-900 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><LayoutGrid size={14} /> Cuadrantes</button>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-auto">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={groupBy === 'product' ? "Buscar producto..." : "Buscar categoría..."} className="w-48 pl-9 pr-7 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all shadow-sm"/>
                        {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 font-black text-xs">✕</button>}
                    </div>
                    {groupBy === 'product' && (
                        <div className="relative min-w-[140px]">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none cursor-pointer shadow-sm">
                                <option value="all">Todas las Categorías</option>
                                {categories.map(c => <option key={c._id} value={c.name.toLowerCase().trim()}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="relative min-w-[140px]">
                        <Store size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none"/>
                        <select value={sucursal} onChange={e => setSucursal(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none cursor-pointer shadow-sm">
                            <option value="">Todas las Sucursales</option>
                            {sucursalesOptions.map(s => <option key={s._id} value={s.nombre}>{s.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-1">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-20 text-center animate-pulse">
                        <Target size={40} className="text-indigo-400 mb-3 animate-spin"/>
                        <p className="font-bold text-gray-600 text-sm">Integrando datos de {selectedMonths.length} meses...</p>
                    </div>
                ) : isError ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
                        <AlertTriangle size={32} className="mx-auto mb-2"/>
                        <h3 className="font-bold">Error cargando Matriz</h3>
                    </div>
                ) : viewMode === 'chart' ? (
                    <div className="flex flex-col xl:flex-row gap-4">
                        <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 rounded-3xl p-4 md:p-6 shadow-2xl border border-gray-800 text-white overflow-hidden flex flex-col gap-4">
                            
                            <div className="flex flex-wrap gap-2 justify-center mb-2">
                                <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-500/30"><HelpCircle size={14}/> Gen. Volumen ({bcgData.interrogantes.length})</div>
                                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase bg-emerald-900/40 px-3 py-1.5 rounded-xl border border-emerald-500/30"><Star fill="currentColor" size={14}/> Alto Valor ({bcgData.estrellas.length})</div>
                                <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50"><ArrowDownCircle size={14}/> A Revisar ({bcgData.perros.length})</div>
                                <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-500/30"><Package size={14}/> Premium/Nicho ({bcgData.vacas.length})</div>
                            </div>

                            <div className="relative w-full h-[550px] bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden select-none">
                                {(() => {
                                    const crossX = 5 + getLogPos(bcgData.avgRevenue, bcgData.maxRevenue) * 90;
                                    const crossY = 95 - getLogPos(bcgData.avgVolume, bcgData.maxVolume) * 90;
                                    return (
                                        <>
                                            <div className="absolute top-0 left-0 bg-purple-950/20 border-r border-b border-purple-500/20 pointer-events-none" style={{ width: `${crossX}%`, height: `${crossY}%` }} />
                                            <div className="absolute top-0 right-0 bg-emerald-950/20 border-b border-emerald-500/20 pointer-events-none" style={{ left: `${crossX}%`, width: `${100-crossX}%`, height: `${crossY}%` }} />
                                            <div className="absolute bottom-0 left-0 bg-slate-900/40 border-r border-slate-700/30 pointer-events-none" style={{ width: `${crossX}%`, top: `${crossY}%`, height: `${100-crossY}%` }} />
                                            <div className="absolute bottom-0 right-0 bg-blue-950/20 pointer-events-none" style={{ left: `${crossX}%`, width: `${100-crossX}%`, top: `${crossY}%`, height: `${100-crossY}%` }} />
                                            <div className="absolute left-0 right-0 border-t-2 border-dashed border-indigo-500/40 pointer-events-none" style={{ top: `${crossY}%` }}/>
                                            <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-indigo-500/40 pointer-events-none" style={{ left: `${crossX}%` }}/>
                                        </>
                                    );
                                })()}

                                <svg className="w-full h-full absolute inset-0 overflow-visible">
                                    {bcgData.itemsList.map((item, idx) => {
                                        const posX = 5 + getLogPos(item.ingresos_actuales, bcgData.maxRevenue) * 90;
                                        const posY = 95 - getLogPos(item.cantidad_vendida, bcgData.maxVolume) * 90;

                                        // Size based on selected metric (now representing participation)
                                        const maxBubbleSizeSource = bubbleSizeMetric === 'sales' ? bcgData.maxRevenue : Math.max(...bcgData.itemsList.map(i => i.margen_ganancia), 1);
                                        const bubbleValue = bubbleSizeMetric === 'sales' ? item.ingresos_actuales : item.margen_ganancia;
                                        
                                        const maxValForSize = Math.max(maxBubbleSizeSource, 1);
                                        const radius = 6 + (Math.sqrt(Math.max(bubbleValue, 0) / maxValForSize) * 20);

                                        const isHovered = hoveredPoint?.nombre === item.nombre;
                                        
                                        let colorCircle = "#94a3b8"; 
                                        if (item.cuadrante === 'ESTRELLA') colorCircle = "#10b981";
                                        else if (item.cuadrante === 'VACA') colorCircle = "#3b82f6";
                                        else if (item.cuadrante === 'INTERROGANTE') colorCircle = "#a855f7";

                                        if (item.ingresos_actuales === 0 && item.cantidad_vendida === 0) return null;

                                        return (
                                            <g key={item.nombre + idx} className="cursor-pointer transition-all duration-300" onMouseEnter={() => setHoveredPoint(item)} onMouseLeave={() => setHoveredPoint(null)}>
                                                <circle cx={`${posX}%`} cy={`${posY}%`} r={radius} fill={colorCircle} fillOpacity={isHovered ? 1 : 0.75} stroke={isHovered ? "#ffffff" : colorCircle} strokeWidth={isHovered ? 3 : 1.5} className="transition-all duration-200 z-10 relative"/>
                                                {isHovered && <text x={`${posX}%`} y={`calc(${posY}% - ${radius + 8}px)`} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" className="pointer-events-none drop-shadow-md">{item.nombre}</text>}
                                            </g>
                                        );
                                    })}
                                </svg>

                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pointer-events-none">
                                    &larr; Ventas Generadas (Bs) (Eje X) &rarr;
                                </div>
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-gray-500 uppercase tracking-widest origin-center whitespace-nowrap pointer-events-none">
                                    &larr; Volumen / Cantidad Vendida (Eje Y) &rarr;
                                </div>
                            </div>
                        </div>

                        {/* Panel lateral de detalles (A LA DERECHA) */}
                        <div className="w-full xl:w-72 shrink-0 flex flex-col">
                            {hoveredPoint ? (
                                <div className="p-5 bg-slate-800 rounded-3xl border border-indigo-500/40 flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-200 shadow-xl h-full">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{hoveredPoint.categoria_nombre}</span>
                                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{hoveredPoint.cuadrante}</span>
                                        </div>
                                        <h3 className="font-black text-xl text-white leading-tight">{hoveredPoint.nombre}</h3>
                                        <p className="text-xs text-indigo-200 mt-1">Datos consolidados de {selectedMonths.length} mes(es)</p>
                                    </div>
                                    
                                    <div className="flex flex-col gap-4">
                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">Total Ventas (Bs)</span>
                                            <div className="flex items-end gap-2">
                                                <span className="font-black text-white text-lg leading-none">Bs. {hoveredPoint.ingresos_actuales.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                <span className="text-indigo-400 text-[10px] uppercase font-bold block">Participación en Ventas:</span>
                                                <span className="font-bold text-white text-sm">{((hoveredPoint.participacion_ventas || 0) * 100).toFixed(2)}% del total</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">Total Margen de Ganancia</span>
                                            <div className="flex items-end gap-2">
                                                <span className="font-black text-emerald-400 text-lg leading-none">Bs. {hoveredPoint.margen_ganancia.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                <span className="text-emerald-500 text-[10px] uppercase font-bold block">Participación en Ganancia:</span>
                                                <span className="font-bold text-white text-sm">{((hoveredPoint.participacion_margen || 0) * 100).toFixed(2)}% del total</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                                            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">Volumen Vendido</span>
                                            <span className="font-black text-white text-lg">{hoveredPoint.cantidad_vendida.toLocaleString('en-US')} u.</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200 text-center text-sm text-slate-500 h-full flex flex-col items-center justify-center min-h-[300px] shadow-sm">
                                    <Target size={40} className="text-slate-300 mb-4" />
                                    <p className="font-bold text-slate-600 mb-1">Panel de Detalles</p>
                                    <p>Posa el cursor sobre una burbuja en la gráfica para visualizar su participación de mercado exacta.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border border-gray-200 rounded-xl bg-white overflow-hidden mt-4 shadow-sm">
                        {QUADRANTS_CONFIG.map(cat => {
                            const items = bcgData[cat.key as keyof typeof bcgData] as BcgItem[] ?? [];
                            return (
                                <div key={cat.key} className="flex flex-col">
                                    <div className={cn('p-4 shrink-0 flex items-start justify-between gap-2 border-b border-gray-100', cat.bg)}>
                                        <div className="flex gap-2.5">
                                            <div className={cn('p-2 rounded-xl shrink-0 shadow-sm border border-white/40', cat.iconBg)}>{cat.icon}</div>
                                            <div><h3 className={cn('font-black uppercase text-xs tracking-wide', cat.hdr)}>{cat.label}</h3><p className="text-[9px] text-gray-500 font-semibold mt-0.5">{cat.desc}</p></div>
                                        </div>
                                        <div className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0 border border-white/50 shadow-sm', cat.iconBg)}>{items.length}</div>
                                    </div>
                                    <div className="flex-1 max-h-[500px] overflow-y-auto custom-scrollbar bg-white">
                                        {items.length === 0 ? <p className={cn('text-xs text-center py-10 font-medium opacity-50', cat.hdr)}>{cat.empty}</p> : (
                                            <div className="p-2 flex flex-col gap-2.5 bg-gray-50/50">
                                                {items.map((prod: BcgItem) => {
                                                    return (
                                                        <div key={prod.nombre || Math.random()} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2">
                                                            <div className="flex justify-between items-start"><span className="text-[11px] font-bold text-gray-800 uppercase leading-tight line-clamp-2">{prod.nombre}</span><span className="text-[9px] font-semibold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{prod.categoria_nombre}</span></div>
                                                            <div className="flex justify-between items-center"><span className="text-xs font-black text-gray-900">Ventas: Bs. {prod.ingresos_actuales.toLocaleString('en-US', {minimumFractionDigits: 2})}</span><span className="px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-700">Pt: {((prod.participacion_ventas||0)*100).toFixed(1)}%</span></div>
                                                            <div className="mt-1"><div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>Ganancia (Margen):</span><span className="font-bold text-emerald-600">Bs. {prod.margen_ganancia.toLocaleString('en-US')}</span></div><div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>Volumen vendido:</span><span className="font-bold text-indigo-600">{prod.cantidad_vendida.toLocaleString('en-US')} u.</span></div></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
