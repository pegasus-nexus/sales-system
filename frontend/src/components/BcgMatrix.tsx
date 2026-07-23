import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getBcgMatrix, getProducts, getCategories } from '../api/api';
import {
    Target, Star, Package, HelpCircle, ArrowDownCircle,
    AlertTriangle, Search, Store, Filter, Layers, BarChart2, LayoutGrid, CircleDollarSign, CalendarDays
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

const SUCS = [
    { value: '', label: 'Todas las Sucursales' },
    { value: 'Heroinas', label: 'Heroínas' },
    { value: 'Cala Cala', label: 'Cala Cala' },
    { value: 'America', label: 'América' },
];

export interface BcgItem {
    producto_id: string;
    nombre: string;
    categoria_nombre?: string;
    ingresos_actuales: number;
    ingresos_anteriores: number;
    cantidad_vendida: number;
    cantidad_anterior: number;
    crecimiento: number;
    cuota_relativa: number;
    cuadrante: 'ESTRELLA' | 'VACA' | 'INTERROGANTE' | 'PERRO';
    margen_ganancia: number;
    history: any[];
    tendencia_str?: string;
    totalItemsCount?: number;
}

export default function BcgMatrix() {
    const [mode, setMode] = useState<'today' | 'week' | 'month' | 'year'>('month');
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [selectedYear]   = useState(() => String(new Date().getFullYear()));
    const [sucursal, setSucursal] = useState('');
    const [search,   setSearch]   = useState('');
    const [dates, setDates] = useState({ start: '', end: '', startPrev: '', endPrev: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isError,   setIsError]   = useState(false);
    const [rawProducts, setRawProducts] = useState<BcgItem[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);

    const [groupBy, setGroupBy] = useState<'product' | 'category'>('product');
    const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
    const [hoveredPoint, setHoveredPoint] = useState<BcgItem | null>(null);
    
    // Configuración UI Visual
    const [bubbleSizeMetric, setBubbleSizeMetric] = useState<'sales' | 'margin'>('sales');
    const [monthsToShow, setMonthsToShow] = useState<1 | 2 | 3>(1); // 1=Solo actual, 2=Actual+1mes, 3=Actual+2meses

    const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [catalogo, setCatalogo] = useState<any[]>([]);

    useEffect(() => {
        getCategories().then(cats => setCategories(cats)).catch(console.error);
        getProducts(1, 2000).then(res => setCatalogo(res.items || [])).catch(console.error);
    }, []);

    useEffect(() => {
        let s = new Date(), e = new Date();
        s.setHours(0,0,0,0); e.setHours(23,59,59,999);
        if (mode === 'month') {
            const [y,m] = selectedMonth.split('-');
            s = new Date(+y, +m-1, 1);
            e = new Date(+y, +m, 0); e.setHours(23,59,59,999);
        } else if (mode === 'year') {
            s = new Date(+selectedYear, 0, 1);
            e = new Date(+selectedYear, 11, 31); e.setHours(23,59,59,999);
        }
        const dias = Math.max(Math.round((e.getTime()-s.getTime())/86400000), 1);
        const sp = new Date(s); sp.setDate(s.getDate()-dias);
        const ep = new Date(e); ep.setDate(e.getDate()-dias);
        setDates({ start:s.toISOString(), end:e.toISOString(), startPrev:sp.toISOString(), endPrev:ep.toISOString() });
    }, [mode, selectedMonth, selectedYear]);

    const fetchData = useCallback(async () => {
        if (!dates.start || !dates.end) return;
        setIsLoading(true); setIsError(false);
        try { 
            const rawBcg: any = await getBcgMatrix(dates.start, dates.end, sucursal || undefined); 
            const allProducts = [
                ...(rawBcg?.estrellas || []),
                ...(rawBcg?.vacas || []),
                ...(rawBcg?.interrogantes || []),
                ...(rawBcg?.perros || [])
            ];
            
            setRawProducts(allProducts);
        }
        catch (e) {
            console.error(e);
            setIsError(true);
        }
        finally { setIsLoading(false); }
    }, [dates.start, dates.end, sucursal]);

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
                        ingresos_actuales: 0, ingresos_anteriores: 0, cantidad_vendida: 0, cantidad_anterior: 0,
                        crecimiento: 0, cuota_relativa: 0, cuadrante: 'PERRO', margen_ganancia: 0, count: 0,
                        history: [
                            {ingresos: 0, cantidad: 0, margen_ganancia: 0},
                            {ingresos: 0, cantidad: 0, margen_ganancia: 0}
                        ]
                    };
                }
                catMap[cat].ingresos_actuales += p.ingresos_actuales;
                catMap[cat].ingresos_anteriores += p.ingresos_anteriores;
                catMap[cat].cantidad_vendida += p.cantidad_vendida;
                catMap[cat].cantidad_anterior += p.cantidad_anterior;
                catMap[cat].margen_ganancia += p.margen_ganancia;
                
                if (p.history && p.history.length > 0) {
                    if (p.history[0]) {
                        catMap[cat].history[0].ingresos += (p.history[0].ingresos || 0);
                        catMap[cat].history[0].cantidad += (p.history[0].cantidad || 0);
                        catMap[cat].history[0].margen_ganancia += (p.history[0].margen_ganancia || 0);
                    }
                    if (p.history[1]) {
                        catMap[cat].history[1].ingresos += (p.history[1].ingresos || 0);
                        catMap[cat].history[1].cantidad += (p.history[1].cantidad || 0);
                        catMap[cat].history[1].margen_ganancia += (p.history[1].margen_ganancia || 0);
                    }
                }
                catMap[cat].count += 1;
            });

            universoAnalisis = Object.values(catMap).map(c => {
                let crec = 0;
                if (c.ingresos_anteriores > 0) crec = (c.ingresos_actuales - c.ingresos_anteriores) / c.ingresos_anteriores;
                else if (c.ingresos_actuales > 0) crec = 1.0;
                c.crecimiento = crec;
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
            item.cuota_relativa = item.ingresos_actuales / maxRevenue;
            
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
                            Análisis temporal de rentabilidad y evolución histórica.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm px-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mes Analizado:</span>
                    <input type="month" value={selectedMonth} onChange={e => {
                        if (e.target.value) {
                            setMode('month');
                            setSelectedMonth(e.target.value);
                        }
                    }} className="text-xs font-bold text-gray-800 bg-gray-100 border-none rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-gray-200" />
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={() => setGroupBy('product')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", groupBy === 'product' ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><Package size={14} /> Productos</button>
                    <button onClick={() => setGroupBy('category')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", groupBy === 'category' ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><Layers size={14} /> Categorías</button>
                </div>
                
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={() => setBubbleSizeMetric('sales')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", bubbleSizeMetric === 'sales' ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><BarChart2 size={14} /> Tamaño: Ventas (Bs)</button>
                    <button onClick={() => setBubbleSizeMetric('margin')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", bubbleSizeMetric === 'margin' ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><CircleDollarSign size={14} /> Tamaño: Ganancia (Margen)</button>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={() => setViewMode('chart')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'chart' ? "bg-gray-900 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><BarChart2 size={14} /> Matriz Evolutiva</button>
                    <button onClick={() => setViewMode('cards')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'cards' ? "bg-gray-900 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><LayoutGrid size={14} /> Cuadrantes Clásicos</button>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={() => setMonthsToShow(1)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", monthsToShow === 1 ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><CalendarDays size={14} /> 1 Mes</button>
                    <button onClick={() => setMonthsToShow(2)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", monthsToShow === 2 ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><CalendarDays size={14} /> 2 Meses</button>
                    <button onClick={() => setMonthsToShow(3)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", monthsToShow === 3 ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}><CalendarDays size={14} /> 3 Meses</button>
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
                            {SUCS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-1">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-20 text-center animate-pulse">
                        <Target size={40} className="text-indigo-400 mb-3 animate-spin"/>
                        <p className="font-bold text-gray-600 text-sm">Procesando Matriz...</p>
                    </div>
                ) : isError ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
                        <AlertTriangle size={32} className="mx-auto mb-2"/>
                        <h3 className="font-bold">Error cargando Matriz</h3>
                    </div>
                ) : viewMode === 'chart' ? (
                    <div className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 rounded-3xl p-4 md:p-6 shadow-2xl border border-gray-800 text-white overflow-hidden flex flex-col gap-4">
                        
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
                                <defs>
                                    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                        <polygon points="0 0, 6 3, 0 6" fill="#fff" opacity="0.3"/>
                                    </marker>
                                </defs>
                                {bcgData.itemsList.map((item, idx) => {
                                    const posX = 5 + getLogPos(item.ingresos_actuales, bcgData.maxRevenue) * 90;
                                    const posY = 95 - getLogPos(item.cantidad_vendida, bcgData.maxVolume) * 90;

                                    const maxBubbleSizeSource = bubbleSizeMetric === 'sales' ? bcgData.maxRevenue : Math.max(...bcgData.itemsList.map(i => i.margen_ganancia), 1);
                                    const bubbleValue = bubbleSizeMetric === 'sales' ? item.ingresos_actuales : item.margen_ganancia;
                                    
                                    const maxValForSize = Math.max(maxBubbleSizeSource, 1);
                                    const radius = 6 + (Math.sqrt(Math.max(bubbleValue, 0) / maxValForSize) * 20);

                                    const isHovered = hoveredPoint?.nombre === item.nombre;
                                    
                                    let colorCircle = "#94a3b8"; 
                                    if (item.cuadrante === 'ESTRELLA') colorCircle = "#10b981";
                                    else if (item.cuadrante === 'VACA') colorCircle = "#3b82f6";
                                    else if (item.cuadrante === 'INTERROGANTE') colorCircle = "#a855f7";

                                    // Precompute valid historical points
                                    const pts: any[] = [];
                                    if (monthsToShow >= 1) {
                                        pts.push({ x: posX, y: posY, r: radius, color: colorCircle, alpha: isHovered ? 0.9 : 0.65, val: item.ingresos_actuales });
                                    }
                                    if (monthsToShow >= 2 && item.history && item.history[0] && (item.history[0].ingresos > 0 || item.history[0].cantidad > 0)) {
                                        const hx = 5 + getLogPos(item.history[0].ingresos, bcgData.maxRevenue) * 90;
                                        const hy = 95 - getLogPos(item.history[0].cantidad, bcgData.maxVolume) * 90;
                                        const hval = bubbleSizeMetric === 'sales' ? item.history[0].ingresos : item.history[0].margen_ganancia;
                                        const hr = 6 + (Math.sqrt(Math.max(hval, 0) / maxValForSize) * 20);
                                        pts.push({ x: hx, y: hy, r: hr, color: colorCircle, alpha: 0.6, val: item.history[0].ingresos });
                                    }
                                    if (monthsToShow >= 3 && item.history && item.history[1] && (item.history[1].ingresos > 0 || item.history[1].cantidad > 0)) {
                                        const hx = 5 + getLogPos(item.history[1].ingresos, bcgData.maxRevenue) * 90;
                                        const hy = 95 - getLogPos(item.history[1].cantidad, bcgData.maxVolume) * 90;
                                        const hval = bubbleSizeMetric === 'sales' ? item.history[1].ingresos : item.history[1].margen_ganancia;
                                        const hr = 6 + (Math.sqrt(Math.max(hval, 0) / maxValForSize) * 20);
                                        pts.push({ x: hx, y: hy, r: hr, color: colorCircle, alpha: 0.4, val: item.history[1].ingresos });
                                    }

                                    return (
                                        <g key={item.nombre + idx} className="cursor-pointer transition-all duration-300" onMouseEnter={() => setHoveredPoint(item)} onMouseLeave={() => setHoveredPoint(null)}>
                                            {/* Lineas Conectoras (Dibujar de lo más antiguo a lo más nuevo) */}
                                            {pts.map((_, i) => {
                                                if (i === pts.length - 1) return null; // Ultimo punto (mas antiguo) no tiene linea anterior
                                                const ptFrom = pts[i + 1]; // El punto más antiguo
                                                const ptTo = pts[i];       // El punto más nuevo
                                                return (
                                                    <line key={`line-${i}`} x1={`${ptFrom.x}%`} y1={`${ptFrom.y}%`} x2={`${ptTo.x}%`} y2={`${ptTo.y}%`} stroke="#fff" strokeWidth={isHovered ? "2" : "1"} opacity={isHovered ? "0.6" : "0.2"} markerEnd="url(#arrowhead)"/>
                                                );
                                            })}

                                            {/* Burbujas Historicas */}
                                            {pts.map((pt, i) => {
                                                if (i === 0) return null; // La burbuja actual se dibuja aparte para quedar por encima
                                                return (
                                                    <circle key={`hist-${i}`} cx={`${pt.x}%`} cy={`${pt.y}%`} r={pt.r} fill={pt.color} fillOpacity={isHovered ? pt.alpha * 1.5 : pt.alpha} />
                                                );
                                            })}

                                            {/* Burbuja Actual */}
                                            {pts.length > 0 && (
                                                <circle cx={`${pts[0].x}%`} cy={`${pts[0].y}%`} r={pts[0].r} fill={pts[0].color} fillOpacity={pts[0].alpha} stroke={isHovered ? "#ffffff" : pts[0].color} strokeWidth={isHovered ? 3 : 1.5} className="transition-all duration-200 z-10 relative"/>
                                            )}
                                            
                                            {/* Etiqueta solo si hace Hover o es muy grande */}
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

                        {hoveredPoint && (
                            <div className="mt-4 p-4 bg-slate-800/90 rounded-2xl border border-indigo-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in duration-200">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-base text-white">{hoveredPoint.nombre}</span>
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{hoveredPoint.categoria_nombre}</span>
                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{hoveredPoint.cuadrante}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-xs flex-wrap">
                                    <div><span className="text-gray-400 text-[10px] uppercase font-bold block">Ventas (Bs)</span><span className="font-black text-white text-sm">Bs. {hoveredPoint.ingresos_actuales.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                                    <div><span className="text-gray-400 text-[10px] uppercase font-bold block">Margen de Ganancia</span><span className="font-black text-emerald-400 text-sm">Bs. {hoveredPoint.margen_ganancia.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                                    <div><span className="text-gray-400 text-[10px] uppercase font-bold block">Volumen</span><span className="font-black text-white text-sm">{hoveredPoint.cantidad_vendida.toLocaleString('en-US')} u.</span></div>
                                </div>
                            </div>
                        )}
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
                                                    const varPct = prod.crecimiento * 100;
                                                    return (
                                                        <div key={prod.nombre || Math.random()} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2">
                                                            <div className="flex justify-between items-start"><span className="text-[11px] font-bold text-gray-800 uppercase leading-tight line-clamp-2">{prod.nombre}</span><span className="text-[9px] font-semibold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{prod.categoria_nombre}</span></div>
                                                            <div className="flex justify-between items-center"><span className="text-xs font-black text-gray-900">Ventas: Bs. {prod.ingresos_actuales.toLocaleString('en-US', {minimumFractionDigits: 2})}</span><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shrink-0 ${varPct > 0 ? 'bg-emerald-100 text-emerald-700' : varPct < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{varPct > 0 ? '↑' : varPct < 0 ? '↓' : ''} {varPct > 0 ? '+' : ''}{varPct.toFixed(1)}%</span></div>
                                                            <div className="mt-1"><div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>Ganancia (Margen):</span><span className="font-bold text-emerald-600">Bs. {prod.margen_ganancia.toLocaleString('en-US')}</span></div><div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>Volumen vendido:</span><span className="font-bold text-indigo-600">{prod.cantidad_vendida.toLocaleString('en-US')} unidades</span></div></div>
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
