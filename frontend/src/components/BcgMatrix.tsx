import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getBcgMatrix, getProducts, getCategories } from '../api/api';
import {
    Target, Star, Package, HelpCircle, ArrowDownCircle,
    AlertTriangle, Search, Store, Filter, Layers, BarChart2, LayoutGrid
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

/* ─── Configuración de cuadrantes ────────────────────────── */
const QUADRANTS_CONFIG = [
    {
        key: 'estrellas', label: '⭐ Estrellas',
        desc: 'Alta cuota · Alto crecimiento',
        bg: 'bg-emerald-50/50', border: 'border-emerald-200/50', hdr: 'text-emerald-800',
        icon: <Star fill="currentColor" size={16}/>, iconBg: 'bg-emerald-100 text-emerald-600',
        empty: 'Sin estrellas este período.',
        card: { border: 'border-emerald-200', text: 'text-emerald-700', pill: 'bg-emerald-400', pillText: 'text-emerald-600' }
    },
    {
        key: 'interrogantes', label: '❓ Interrogantes',
        desc: 'Baja cuota · Alto crecimiento',
        bg: 'bg-purple-50/50', border: 'border-purple-200/50', hdr: 'text-purple-800',
        icon: <HelpCircle size={16}/>, iconBg: 'bg-purple-100 text-purple-600',
        empty: 'Sin interrogantes este período.',
        card: { border: 'border-purple-200', text: 'text-purple-700', pill: 'bg-purple-400', pillText: 'text-purple-600' }
    },
    {
        key: 'vacas', label: '🐄 Vacas',
        desc: 'Alta cuota · Bajo crecimiento',
        bg: 'bg-blue-50/50', border: 'border-blue-200/50', hdr: 'text-blue-800',
        icon: <Package size={16}/>, iconBg: 'bg-blue-100 text-blue-600',
        empty: 'Sin vacas este período.',
        card: { border: 'border-blue-200', text: 'text-blue-700', pill: 'bg-blue-400', pillText: 'text-blue-600' }
    },
    {
        key: 'perros', label: '🐕 Perros',
        desc: 'Baja cuota · Bajo crecimiento',
        bg: 'bg-gray-100/50', border: 'border-gray-200/80', hdr: 'text-gray-700',
        icon: <ArrowDownCircle size={16}/>, iconBg: 'bg-gray-200 text-gray-600',
        empty: 'Sin elementos en perro.',
        card: { border: 'border-gray-200', text: 'text-gray-600', pill: 'bg-gray-400', pillText: 'text-red-500' }
    },
];

const SUCS = [
    { value: '', label: 'Todas las Sucursales' },
    { value: 'Heroinas', label: 'Heroínas' },
    { value: 'Recoleta', label: 'Recoleta' },
    { value: 'Calacoto', label: 'Calacoto' },
];

export interface BcgItem {
    nombre: string;
    categoria_nombre: string;
    actual: number;
    anterior: number;
    variacion: number;
    cuota: number;
    shareTotal: number;
    cuadrante: 'ESTRELLA' | 'VACA' | 'INTERROGANTE' | 'PERRO';
    totalItemsCount?: number;
}

export default function BcgMatrix() {
    const [mode] = useState<'today' | 'week' | 'month' | 'year'>('month');
    const [selectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [selectedYear]   = useState(() => String(new Date().getFullYear()));
    const [sucursal, setSucursal] = useState('');
    const [search,   setSearch]   = useState('');
    const [dates, setDates] = useState({ start: '', end: '', startPrev: '', endPrev: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isError,   setIsError]   = useState(false);
    const [rawProducts, setRawProducts] = useState<any[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);

    // Grouping & View options: 'product' vs 'category', and 'chart' vs 'cards'
    const [groupBy, setGroupBy] = useState<'product' | 'category'>('product');
    const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
    const [hoveredPoint, setHoveredPoint] = useState<BcgItem | null>(null);

    // Catalog states for Advanced Filters
    const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [catalogo, setCatalogo] = useState<any[]>([]);

    // Cargar Catálogo
    useEffect(() => {
        getCategories().then(cats => setCategories(cats)).catch(console.error);
        getProducts(1, 2000).then(res => {
            setCatalogo(res.items || []);
        }).catch(console.error);
    }, []);

    /* Calcular fechas */
    useEffect(() => {
        let s = new Date(), e = new Date();
        s.setHours(0,0,0,0); e.setHours(23,59,59,999);
        if (mode === 'week') {
            s.setDate(e.getDate() - 6);
        } else if (mode === 'month') {
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

    /* Fetch de Datos Crudos de la Matriz */
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
            console.error("Error fetching BCG Matrix:", e);
            setIsError(true);
        }
        finally { setIsLoading(false); }
    }, [dates.start, dates.end, sucursal]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (iso: string) =>
        iso ? new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' }) : '';

    /* Lógica Estricta de Matriz BCG (Productos o Categorías) */
    const bcgData = useMemo(() => {
        const salesDict: Record<string, { actual: number, anterior: number }> = {};
        rawProducts.forEach((p: any) => {
            if (!p.nombre) return;
            const norm = p.nombre.toLowerCase().trim();
            if (!salesDict[norm]) {
                salesDict[norm] = { actual: 0, anterior: 0 };
            }
            salesDict[norm].actual += (p.ingresos_actuales || 0);
            salesDict[norm].anterior += (p.ingresos_anteriores || 0);
        });

        const baseCatalogo = (catalogo && catalogo.length > 0) 
            ? catalogo 
            : Array.from(new Map(rawProducts.map((item: any) => [
                (item.nombre || '').toLowerCase().trim(), 
                { nombre: item.nombre, categoria_nombre: item.categoria || item.categoria_nombre || 'otros' }
              ])).values());

        const productosMapeados = baseCatalogo.map((prodCat: any) => {
            const nombreCat = prodCat.descripcion || prodCat.nombre || 'Sin nombre';
            const norm = nombreCat.toLowerCase().trim();
            const venta = salesDict[norm];
            
            const actual = venta ? venta.actual : 0;
            const anterior = venta ? venta.anterior : 0;
            
            let variacion = 0;
            if (anterior > 0) {
                variacion = ((actual - anterior) / anterior) * 100;
            } else if (actual > 0 && anterior === 0) {
                variacion = 100;
            }

            return {
                nombre: nombreCat,
                categoria_nombre: (prodCat.categoria || prodCat.categoria_nombre || prodCat.name || 'otros').toLowerCase().trim(),
                actual,
                anterior,
                variacion
            };
        });

        // Agrupación opcional por Categoría
        let universoAnalisis: { nombre: string, categoria_nombre: string, actual: number, anterior: number, variacion: number, totalItemsCount?: number }[] = [];

        if (groupBy === 'category') {
            const catMap: Record<string, { actual: number, anterior: number, count: number }> = {};
            productosMapeados.forEach(p => {
                const cat = p.categoria_nombre || 'otros';
                if (!catMap[cat]) {
                    catMap[cat] = { actual: 0, anterior: 0, count: 0 };
                }
                catMap[cat].actual += p.actual;
                catMap[cat].anterior += p.anterior;
                catMap[cat].count += 1;
            });

            universoAnalisis = Object.entries(catMap).map(([catName, stats]) => {
                let variacion = 0;
                if (stats.anterior > 0) {
                    variacion = ((stats.actual - stats.anterior) / stats.anterior) * 100;
                } else if (stats.actual > 0 && stats.anterior === 0) {
                    variacion = 100;
                }
                const formattedName = catName.charAt(0).toUpperCase() + catName.slice(1);
                return {
                    nombre: formattedName,
                    categoria_nombre: catName,
                    actual: stats.actual,
                    anterior: stats.anterior,
                    variacion,
                    totalItemsCount: stats.count
                };
            });
        } else {
            universoAnalisis = productosMapeados;
        }

        // Filtrado por búsqueda y categoría seleccionada
        const filtered = universoAnalisis.filter((p: any) => {
            if (groupBy === 'product') {
                const catSeleccionada = selectedCategory || 'all';
                const catReal = String(p.categoria_nombre || 'otros').toLowerCase().trim();
                const filtroNormalizado = String(catSeleccionada).toLowerCase().trim();

                const matchCat = filtroNormalizado === 'all' || 
                                 filtroNormalizado === 'todas las categorías' || 
                                 filtroNormalizado === '' || 
                                 catReal === filtroNormalizado || 
                                 catReal.includes(filtroNormalizado) || 
                                 filtroNormalizado.includes(catReal);
                
                if (!matchCat) return false;
            }

            if (search.trim().length >= 2) {
                if (!p.nombre.toLowerCase().includes(search.trim().toLowerCase())) return false;
            }
            return true;
        });

        // Totales globales para cuota y % sobre total
        const granTotalVentas = filtered.reduce((acc, p) => acc + p.actual, 0);
        const maxRevenue = filtered.length > 0 ? Math.max(...filtered.map((p: any) => p.actual), 0) : 0;

        const estrellas: BcgItem[] = [];
        const vacas: BcgItem[] = [];
        const interrogantes: BcgItem[] = [];
        const perros: BcgItem[] = [];
        const itemsList: BcgItem[] = [];

        filtered.forEach((item: any) => {
            const curr = item.actual;
            const prev = item.anterior;

            const cuota = maxRevenue > 0 ? (curr / maxRevenue) * 100 : 0.0;
            const shareTotal = granTotalVentas > 0 ? (curr / granTotalVentas) * 100 : 0.0;

            const es_alto_crecimiento = item.variacion >= 5.0; // UMBRAL Y: 5%
            const es_alta_cuota = cuota >= 50.0;             // UMBRAL X: 50% cuota relativa

            let cuadrante: 'ESTRELLA' | 'VACA' | 'INTERROGANTE' | 'PERRO' = 'PERRO';

            if (curr === 0 && prev === 0) {
                cuadrante = "PERRO";
            } else if (es_alto_crecimiento && es_alta_cuota) {
                cuadrante = "ESTRELLA";
            } else if (!es_alto_crecimiento && es_alta_cuota) {
                cuadrante = "VACA";
            } else if (es_alto_crecimiento && !es_alta_cuota) {
                cuadrante = "INTERROGANTE";
            } else {
                cuadrante = "PERRO";
            }

            const itemObj: BcgItem = {
                ...item,
                cuota,
                shareTotal,
                cuadrante
            };

            itemsList.push(itemObj);

            if (cuadrante === 'ESTRELLA') estrellas.push(itemObj);
            else if (cuadrante === 'VACA') vacas.push(itemObj);
            else if (cuadrante === 'INTERROGANTE') interrogantes.push(itemObj);
            else perros.push(itemObj);
        });

        estrellas.sort((a, b) => b.cuota - a.cuota);
        vacas.sort((a, b) => b.cuota - a.cuota);
        interrogantes.sort((a, b) => b.variacion - a.variacion);
        perros.sort((a, b) => b.actual - a.actual);

        return { estrellas, vacas, interrogantes, perros, totalCount: filtered.length, itemsList, granTotalVentas, maxRevenue };
    }, [rawProducts, selectedCategory, search, catalogo, groupBy]);

    return (
        <div className="bg-[#f0f4f8] rounded-2xl shadow-sm border border-slate-200 p-5 overflow-hidden flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Target size={20}/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none">Matriz BCG Evolucionada (X, Y)</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {groupBy === 'product' ? 'Análisis interactivo por Productos' : 'Análisis agrupado por Categorías'} • Eje Y: Crecimiento (%) | Eje X: Participación (%)
                        </p>
                    </div>
                </div>

                <div className="text-right flex flex-col sm:flex-row gap-3 text-[11px] bg-gray-50 border border-gray-100 p-2 rounded-xl">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"/>
                        <div className="text-left">
                            <span className="text-gray-400 font-bold uppercase tracking-wider mr-1 text-[9px]">Período analizado:</span>
                            <span className="font-semibold text-gray-700">{fmt(dates.start)} → {fmt(dates.end)}</span>
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-gray-200"></div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"/>
                        <div className="text-left">
                            <span className="text-gray-400 font-bold uppercase tracking-wider mr-1 text-[9px]">Comparado con:</span>
                            <span className="font-semibold text-gray-700">{fmt(dates.startPrev)} → {fmt(dates.endPrev)}</span>
                        </div>
                    </div>
                </div>

            </div>

            <hr className="border-gray-100" />

            {/* ── Fila de Controles & Agrupación ─────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100">

                {/* Switcher de Agrupación (Productos vs Categorías) */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setGroupBy('product')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            groupBy === 'product'
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <Package size={14} /> Productos
                    </button>
                    <button
                        onClick={() => setGroupBy('category')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            groupBy === 'category'
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <Layers size={14} /> Categorías
                    </button>
                </div>

                {/* Switcher de Modos de Vista (Matriz 2D vs Cuadrantes) */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('chart')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            viewMode === 'chart'
                                ? "bg-gray-900 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <BarChart2 size={14} /> Gráfica (X, Y)
                    </button>
                    <button
                        onClick={() => setViewMode('cards')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            viewMode === 'cards'
                                ? "bg-gray-900 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <LayoutGrid size={14} /> Cuadrantes
                    </button>
                </div>

                {/* Buscador & Filtros */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={groupBy === 'product' ? "Buscar producto..." : "Buscar categoría..."}
                            className="w-48 pl-9 pr-7 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs transition-all shadow-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 font-black text-xs">✕</button>
                        )}
                    </div>

                    {groupBy === 'product' && (
                        <div className="relative min-w-[140px]">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value.toLowerCase().trim())}
                                className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-sm">
                                <option value="all">Todas las Categorías</option>
                                {categories.map(c => <option key={c._id} value={c.name.toLowerCase().trim()}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="relative min-w-[140px]">
                        <Store size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none"/>
                        <select
                            value={sucursal}
                            onChange={e => setSucursal(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer shadow-sm">
                            {SUCS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

            </div>

            {/* ── Cuerpo Principal ─────────────────────────────────────────── */}
            <div className="mt-1">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-20 text-center animate-pulse">
                        <Target size={40} className="text-indigo-400 mb-3 animate-spin"/>
                        <p className="font-bold text-gray-600 text-sm">Construyendo Matriz BCG (X, Y)...</p>
                    </div>
                ) : isError ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
                        <AlertTriangle size={32} className="mx-auto mb-2"/>
                        <h3 className="font-bold">Error cargando Matriz BCG</h3>
                    </div>
                ) : viewMode === 'chart' ? (
                    /* ── VISTA DE GRÁFICA SCATTER 2D (X, Y) ───────────────── */
                    <div className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 rounded-3xl p-6 shadow-2xl border border-gray-800 text-white overflow-hidden">
                        
                        {/* Ejes & Fondo de Cuadrantes */}
                        <div className="relative w-full h-[520px] bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden select-none">
                            
                            {/* Cuadrante Top-Left: INTERROGANTES */}
                            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-purple-950/20 border-r border-b border-purple-500/20 p-4 flex flex-col justify-start items-start pointer-events-none">
                                <div className="flex items-center gap-2 text-purple-400 font-black text-xs tracking-wider uppercase bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-500/30">
                                    <HelpCircle size={14}/> ❓ Interrogantes ({bcgData.interrogantes.length})
                                </div>
                                <span className="text-[10px] text-purple-300/60 mt-1">Baja cuota · Alto crecimiento (&ge;5%)</span>
                            </div>

                            {/* Cuadrante Top-Right: ESTRELLAS */}
                            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-950/20 border-b border-emerald-500/20 p-4 flex flex-col justify-start items-end pointer-events-none">
                                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs tracking-wider uppercase bg-emerald-900/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                                    <Star fill="currentColor" size={14}/> ⭐ Estrellas ({bcgData.estrellas.length})
                                </div>
                                <span className="text-[10px] text-emerald-300/60 mt-1">Alta cuota (&ge;50%) · Alto crecimiento (&ge;5%)</span>
                            </div>

                            {/* Cuadrante Bottom-Left: PERROS */}
                            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-slate-900/40 border-r border-slate-700/30 p-4 flex flex-col justify-end items-start pointer-events-none">
                                <div className="flex items-center gap-2 text-slate-400 font-black text-xs tracking-wider uppercase bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
                                    <ArrowDownCircle size={14}/> 🐕 Perros ({bcgData.perros.length})
                                </div>
                                <span className="text-[10px] text-slate-400/60 mt-1">Baja cuota · Bajo crecimiento (&lt;5%)</span>
                            </div>

                            {/* Cuadrante Bottom-Right: VACAS */}
                            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-950/20 p-4 flex flex-col justify-end items-end pointer-events-none">
                                <div className="flex items-center gap-2 text-blue-400 font-black text-xs tracking-wider uppercase bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-500/30">
                                    <Package size={14}/> 🐄 Vacas ({bcgData.vacas.length})
                                </div>
                                <span className="text-[10px] text-blue-300/60 mt-1">Alta cuota (&ge;50%) · Bajo crecimiento (&lt;5%)</span>
                            </div>

                            {/* Eje X y Eje Y Líneas Centrales Guía */}
                            <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-indigo-500/40 pointer-events-none"/>
                            <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-indigo-500/40 pointer-events-none"/>

                            {/* Puntos / Burbujas dibujadas en SVG */}
                            <svg className="w-full h-full absolute inset-0 overflow-visible">
                                {bcgData.itemsList.map((item, idx) => {
                                    // Mapeo X: cuota relativa 0% a 100% -> 5% a 95% del canvas width
                                    const posX = 5 + (Math.min(Math.max(item.cuota, 0), 100) / 100) * 90;
                                    
                                    // Mapeo Y: crecimiento -50% a +150% -> 95% a 5% del canvas height (invertido)
                                    const minG = -20;
                                    const maxG = 100;
                                    const clampedG = Math.min(Math.max(item.variacion, minG), maxG);
                                    const posY = 95 - ((clampedG - minG) / (maxG - minG)) * 90;

                                    // Tamaño de la burbuja proporcional a las ventas Bs. (radio 6px a 24px)
                                    const maxRev = bcgData.maxRevenue || 1;
                                    const radius = 6 + (Math.sqrt(Math.max(item.actual, 0) / maxRev) * 18);

                                    const isHovered = hoveredPoint?.nombre === item.nombre;

                                    let colorCircle = "#94a3b8"; // Perro
                                    if (item.cuadrante === 'ESTRELLA') colorCircle = "#10b981";
                                    else if (item.cuadrante === 'VACA') colorCircle = "#3b82f6";
                                    else if (item.cuadrante === 'INTERROGANTE') colorCircle = "#a855f7";

                                    return (
                                        <g 
                                            key={item.nombre + idx} 
                                            className="cursor-pointer transition-all duration-300"
                                            onMouseEnter={() => setHoveredPoint(item)}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        >
                                            <circle
                                                cx={`${posX}%`}
                                                cy={`${posY}%`}
                                                r={radius}
                                                fill={colorCircle}
                                                fillOpacity={isHovered ? 0.9 : 0.65}
                                                stroke={isHovered ? "#ffffff" : colorCircle}
                                                strokeWidth={isHovered ? 3 : 1.5}
                                                className="transition-all duration-200"
                                            />
                                            {/* Etiqueta visible si el punto es grande o está sobrevolado */}
                                            {(isHovered || radius > 14 || bcgData.itemsList.length <= 15) && (
                                                <text
                                                    x={`${posX}%`}
                                                    y={`${posY - radius / 8}%`}
                                                    dy="-10"
                                                    textAnchor="middle"
                                                    fill="#ffffff"
                                                    fontSize="10"
                                                    fontWeight="bold"
                                                    className="pointer-events-none drop-shadow-md tracking-tight"
                                                >
                                                    {item.nombre.length > 15 ? item.nombre.slice(0, 15) + '...' : item.nombre}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Leyendas de los Ejes */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                                &larr; Cuota Relativa / Participación en Ventas (Eje X) &rarr;
                            </div>
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 origin-center whitespace-nowrap">
                                &larr; Crecimiento Histórico % (Eje Y) &rarr;
                            </div>

                        </div>

                        {/* Card Hover Tooltip Info */}
                        {hoveredPoint ? (
                            <div className="mt-4 p-4 bg-slate-800/90 rounded-2xl border border-indigo-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in duration-200">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-base text-white">{hoveredPoint.nombre}</span>
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                            {hoveredPoint.categoria_nombre}
                                        </span>
                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            {hoveredPoint.cuadrante}
                                        </span>
                                    </div>
                                    {hoveredPoint.totalItemsCount && (
                                        <p className="text-xs text-gray-400 mt-0.5">{hoveredPoint.totalItemsCount} productos agrupados en esta categoría</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-6 text-xs">
                                    <div>
                                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Ventas Actuales</span>
                                        <span className="font-black text-white text-sm">Bs. {hoveredPoint.actual.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Crecimiento MoM</span>
                                        <span className={`font-black text-sm ${hoveredPoint.variacion >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {hoveredPoint.variacion >= 0 ? '+' : ''}{hoveredPoint.variacion.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Cuota frente al Líder</span>
                                        <span className="font-black text-indigo-300 text-sm">{hoveredPoint.cuota.toFixed(1)}%</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-[10px] uppercase font-bold block">% del Total Ventas</span>
                                        <span className="font-black text-emerald-300 text-sm">{hoveredPoint.shareTotal.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                                💡 Coloca el cursor sobre cualquier burbuja para inspeccionar los datos detallados de ventas y tasa de crecimiento.
                            </div>
                        )}

                    </div>
                ) : (
                    /* ── VISTA DE CUADRANTES (4 COLUMNAS DE TARJETAS) ────── */
                    <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border border-gray-200 rounded-xl bg-white overflow-hidden mt-4 shadow-sm">
                        {QUADRANTS_CONFIG.map(cat => {
                            const items = bcgData[cat.key as keyof typeof bcgData] as BcgItem[] ?? [];

                            return (
                                <div key={cat.key} className="flex flex-col">
                                    <div className={cn('p-4 shrink-0 flex items-start justify-between gap-2 border-b border-gray-100', cat.bg)}>
                                        <div className="flex gap-2.5">
                                            <div className={cn('p-2 rounded-xl shrink-0 shadow-sm border border-white/40', cat.iconBg)}>{cat.icon}</div>
                                            <div>
                                                <h3 className={cn('font-black uppercase text-xs tracking-wide', cat.hdr)}>{cat.label}</h3>
                                                <p className="text-[9px] text-gray-500 font-semibold mt-0.5">{cat.desc}</p>
                                            </div>
                                        </div>
                                        <div className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0 border border-white/50 shadow-sm', cat.iconBg)}>
                                            {items.length}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 max-h-[500px] overflow-y-auto custom-scrollbar bg-white">
                                        {items.length === 0 ? (
                                            <p className={cn('text-xs text-center py-10 font-medium opacity-50', cat.hdr)}>{cat.empty}</p>
                                        ) : (
                                            <div className="p-2 flex flex-col gap-2.5 bg-gray-50/50">
                                                {items.map((prod: BcgItem) => {
                                                    const diferenciaBs = prod.actual - prod.anterior;
                                                    const diffSign = diferenciaBs > 0 ? '+' : '';
                                                    return (
                                                        <div key={prod.nombre || Math.random()} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-[11px] font-bold text-gray-800 uppercase leading-tight line-clamp-2" title={prod.nombre}>{prod.nombre}</span>
                                                                <span className="text-[9px] font-semibold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{prod.categoria_nombre}</span>
                                                            </div>
                                                            
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-black text-gray-900">Ventas: Bs. {prod.actual.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shrink-0 ${prod.variacion > 0 ? 'bg-emerald-100 text-emerald-700' : prod.variacion < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {prod.variacion > 0 ? '↑' : prod.variacion < 0 ? '↓' : ''} {prod.variacion > 0 ? '+' : ''}{prod.variacion.toFixed(1)}% ({diffSign}Bs. {diferenciaBs.toLocaleString('en-US', {minimumFractionDigits: 2})})
                                                                </span>
                                                            </div>
                                                            
                                                            <span className="text-[10px] text-gray-500">Período anterior: Bs. {prod.anterior.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                                            
                                                            <div className="mt-1">
                                                                <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                                                                    <span>Peso frente al líder:</span>
                                                                    <span className="font-bold text-indigo-600">{prod.cuota.toFixed(1)}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(prod.cuota, 100)}%` }}></div>
                                                                </div>
                                                            </div>
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
