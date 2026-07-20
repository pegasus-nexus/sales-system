import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAnalyticsDashboard, getRentabilidadReal, getProducts } from '../api/api';
import {
    AlertTriangle, Loader2, Activity,
    TrendingUp, Package, Calendar, DollarSign,
    Search, FileSpreadsheet, Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BcgMatrix from '../components/BcgMatrix';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CatalogRentability() {
    const { role } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [data, setData] = useState<any>(null);
    const [timeRange, setTimeRange] = useState('30days');
    const [searchTerm, setSearchTerm] = useState('');

    // Custom date range state
    const [isCustom, setIsCustom] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('2024-01-01T00:00:00.000Z');
    const [customEndDate, setCustomEndDate] = useState('2026-12-31T23:59:59.000Z');

    // Estado de filtro LOCAL para la tabla de Rentabilidad (independiente del filtro global)
    const [rentRange, setRentRange] = useState('30days');
    const [rentSucursal, setRentSucursal] = useState('');
    const [selectedCategoria, setSelectedCategoria] = useState('');
    const [selectedProveedor, setSelectedProveedor] = useState('');
    const [rentData, setRentData] = useState<any[]>([]);
    const [isRentLoading, setIsRentLoading] = useState(false);
    const [trendDataRaw, setTrendDataRaw] = useState<any[]>([]);
    const [rendMonth, setRendMonth] = useState('2026-07');
    const [rendSucursal, setRendSucursal] = useState('');

    const [catalogo, setCatalogo] = useState<any[]>([]);

    useEffect(() => {
        getProducts(1, 2000).then(res => {
            setCatalogo(res.items || []);
        }).catch(err => {
            console.error("Error cargando catalogo en CatalogRentability:", err);
        });
    }, []);
    
    const SUCS = [
        { value: '', label: 'Todas las Sucursales' },
        { value: 'Heroinas', label: 'Heroínas' },
        { value: 'Recoleta', label: 'Recoleta' },
        { value: 'Calacoto', label: 'Calacoto' },
    ];

    const rentRangeLabels: Record<string, string> = {
        'today': 'Hoy',
        '7days': '7 Días',
        '30days': '30 Días',
        'this_month': 'Mes Actual',
        'this_year': 'Año Actual',
        'historico': 'Histórico'
    };

    useEffect(() => {
        let isMounted = true;
        const fetchRent = async () => {
            setIsRentLoading(true);
            try {
                // Convertir rentRange a fechas reales
                const now = new Date();
                let start = new Date('2024-01-01T00:00:00.000Z');
                let end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                if (rentRange === 'today') {
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    const endOfToday = new Date();
                    endOfToday.setHours(23, 59, 59, 999);
                    start = startOfToday;
                    end = endOfToday;
                } else if (rentRange === '7days') {
                    start = new Date(now); start.setDate(now.getDate() - 7);
                    end   = now;
                } else if (rentRange === '30days') {
                    start = new Date(now); start.setDate(now.getDate() - 30);
                    end   = now;
                } else if (rentRange === 'this_month') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                } else if (rentRange === 'this_year') {
                    start = new Date(now.getFullYear(), 0, 1);
                    end   = now;
                }
                const res = await getRentabilidadReal(
                    start.toISOString(),
                    end.toISOString(),
                    rentSucursal || undefined,
                    50
                );
                if (isMounted) setRentData(Array.isArray(res) ? res : []);
            } catch {
                if (isMounted) setRentData([]);
            } finally {
                if (isMounted) setIsRentLoading(false);
            }
        };
        fetchRent();
        return () => { isMounted = false; };
    }, [rentRange, rentSucursal]);

    const rangeLabels: Record<string, string> = {
        'today': 'Hoy',
        '7days': 'Últimos 7 Días',
        '30days': 'Últimos 30 Días',
        'this_month': 'Mes Actual',
        'this_year': 'Año Actual',
        'historico': 'Histórico Total'
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            setIsError(false);
            try {
                const res = await getAnalyticsDashboard(
                    customStartDate,
                    customEndDate,
                    undefined,
                    isCustom ? undefined : timeRange,
                    ''
                );
                if (isMounted) setData(res);
            } catch (err) {
                console.error("Error cargando Catalogo:", err);
                if (isMounted) setIsError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [timeRange, customStartDate, customEndDate, isCustom]);


    const handlePresetClick = (key: string) => {
        setIsCustom(false);
        setCustomStartDate('2024-01-01T00:00:00.000Z');
        setCustomEndDate('2026-12-31T23:59:59.000Z');
        setTimeRange(key);
    };

    const esAdmin = ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN'].includes(role || '');

    
    useEffect(() => {
        let isMounted = true;
        const fetchTrend = async () => {
            const [yStr, mStr] = rendMonth.split('-');
            const year = parseInt(yStr);
            const month = parseInt(mStr);
            const lastDay = new Date(year, month, 0).getDate();
            const start_date = `${rendMonth}-01T00:00:00-04:00`;
            const end_date = `${rendMonth}-${String(lastDay).padStart(2, '0')}T23:59:59-04:00`;
            try {
                const res = await getAnalyticsDashboard(start_date, end_date, rendSucursal || undefined, "custom") as any;
                if (isMounted && res?.revenue_trend) {
                    setTrendDataRaw(res.revenue_trend);
                }
            } catch (e) {
                console.error("Error fetching trend data:", e);
            }
        };
        fetchTrend();
        return () => { isMounted = false; };
    }, [rendMonth, rendSucursal]);

    const trendData = (trendDataRaw || []).map((t: any) => ({
        name: t.name,
        ingresos: t.ingresos,
        costo: t.costo || t.ingresos * 0.85,
        margen: t.margen || t.ingresos * 0.15,
        tickets: t.tickets || 0,
        ticket_promedio: t.ticket_promedio || 0
    }));

    // ── Agrupación y Lógica de Períodos ──
    const aggregateByPeriod = (data: any[], mode: 'day' | 'week' | 'month') => {
        const buckets: Record<string, { label: string; ingresos: number; costo: number; margen: number; tickets: number; dateKey: string; esCurso: boolean }> = {};
        
        const hoy = new Date();
        const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        const dow = hoy.getDay();
        const diff = (dow === 0 ? -6 : 1) - dow;
        const monHoy = new Date(hoy);
        monHoy.setDate(hoy.getDate() + diff);
        const semHoyStr = `${monHoy.getFullYear()}-${String(monHoy.getMonth() + 1).padStart(2, '0')}-${String(monHoy.getDate()).padStart(2, '0')}`;
        const mesHoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

        data.forEach(d => {
            const [y, m, dayVal] = d.name.split('-').map(Number);
            const date = new Date(y, m - 1, dayVal);
            let key: string;
            let esCurso = false;

            if (mode === 'day') {
                key = d.name.slice(0, 10);
                esCurso = key === hoyStr;
            } else if (mode === 'week') {
                const dow = date.getDay();
                const diff = (dow === 0 ? -6 : 1) - dow;
                const mon = new Date(date);
                mon.setDate(date.getDate() + diff);
                key = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
                esCurso = key === semHoyStr;
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                esCurso = key === mesHoyStr;
            }
            
            if (!buckets[key]) {
                let label: string;
                if (mode === 'day') {
                    label = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                } else if (mode === 'week') {
                    const [y, m, d_val] = key.split('-').map(Number);
                    const monDate = new Date(y, m - 1, d_val);
                    const sunDate = new Date(monDate);
                    sunDate.setDate(monDate.getDate() + 6);
                    const startStr = monDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    const endStr = sunDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    label = `${startStr} al ${endStr}`;
                } else {
                    label = new Date(key + '-01').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
                }
                buckets[key] = { label, dateKey: key, esCurso, ingresos: 0, costo: 0, margen: 0, tickets: 0 };
            }
            buckets[key].ingresos += d.ingresos;
            buckets[key].costo    += d.costo;
            buckets[key].margen   += d.margen;
            buckets[key].tickets  += d.tickets;
        });
        return Object.entries(buckets)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => ({
                name:     v.label,
                dateKey:  v.dateKey,
                esCurso:  v.esCurso,
                ingresos: Math.round(v.ingresos),
                costo:    Math.round(v.costo),
                margen:   Math.round(v.margen),
                tickets:  v.tickets,
                ticket_promedio: v.tickets > 0 ? v.ingresos / v.tickets : 0
            }));
    };



    const processedRentData = useMemo(() => {
        // 1. Filtro estricto de Zona Horaria para "today"
        const isTodayFilter = rentRange === 'today';
        const hoyStrBO = new Date().toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });

        const ventasValidas = rentData.filter((venta: any) => {
            if (venta.estado === 'Cancelado' || venta.estado === 'Borrador' || venta.estado === 'En proceso' || venta.anulada === true) {
                return false;
            }
            if (isTodayFilter && venta.fecha) {
                const ventaDateStrBO = new Date(venta.fecha).toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
                if (ventaDateStrBO !== hoyStrBO) {
                    return false;
                }
            }
            return true;
        });

        // 2. Normalización de Clave (La Clave Única)
        const claveUnica = (nombre: string) => String(nombre || '').toLowerCase().replace(/\s+/g, ' ').trim();

        // 3. Agrupación Consolidada
        const mapaProductos = new Map<string, {
            nombreLimpio: string;
            unidades: number;
            ingreso_bruto: number;
        }>();

        ventasValidas.forEach((venta: any) => {
            if (!venta.nombre) return;
            const key = claveUnica(venta.nombre);
            
            if (mapaProductos.has(key)) {
                const existente = mapaProductos.get(key)!;
                existente.unidades += Number(venta.unidades || venta.cantidad || 0);
                existente.ingreso_bruto += Number(venta.ingreso_bruto || venta.ingresos || 0);
            } else {
                mapaProductos.set(key, {
                    nombreLimpio: String(venta.nombre).toUpperCase().trim(),
                    unidades: Number(venta.unidades || venta.cantidad || 0),
                    ingreso_bruto: Number(venta.ingreso_bruto || venta.ingresos || 0)
                });
            }
        });

        const productosFinales = Array.from(mapaProductos.values());

        // 4. Motor de Cálculo Financiero
        return productosFinales.map((group) => {
            const cleanName = group.nombreLimpio;
            const unidades = group.unidades;
            const ingreso_bruto = group.ingreso_bruto;

            // Buscar en el catálogo
            const prodCat = catalogo.find((c: any) => {
                const desc = (c.descripcion || c.nombre || '').toUpperCase().trim();
                return desc === cleanName;
            });

            const proveedorNombre = prodCat?.proveedor || 'Sin Proveedor';
            const categoriaNombre = prodCat?.categoria_nombre || prodCat?.categoria_id || 'Sin Categoría';
            const costoBase = Number(prodCat?.costo_producto || prodCat?.costo_base || 0);
            const esTaboada = String(proveedorNombre).toLowerCase().includes('taboada');

            let ganancia_matriz = 0;
            let ganancia_sucursal = 0;

            if (esTaboada) {
                const precioMatriz = costoBase * 1.15;
                ganancia_matriz = (precioMatriz - costoBase) * unidades;
                ganancia_sucursal = ingreso_bruto - (precioMatriz * unidades);
            } else {
                ganancia_matriz = 0;
                ganancia_sucursal = ingreso_bruto - (costoBase * unidades);
            }

            const costo_real = costoBase * unidades;
            const margen_pct = ingreso_bruto > 0 ? ((ingreso_bruto - costo_real) / ingreso_bruto) * 100 : 0;
            const precio_venta_retail = unidades > 0 ? (ingreso_bruto / unidades) : 0;

            return {
                nombreLimpio: cleanName,
                categoria: categoriaNombre,
                proveedor: proveedorNombre,
                unidades,
                ingreso_bruto,
                costo_real,
                ganancia_suc: ganancia_sucursal,
                ganancia_matriz,
                precio_prom: precio_venta_retail,
                costo_prom: costoBase,
                margen_pct
            };
        });
    }, [rentData, catalogo, rentRange]);

    const categoriasDisponibles = useMemo(() => {
        const set = new Set<string>();
        catalogo.forEach((p: any) => {
            const cat = p.categoria_nombre || p.categoria_id;
            if (cat) set.add(cat);
        });
        return Array.from(set).sort();
    }, [catalogo]);

    const proveedoresDisponibles = useMemo(() => {
        const set = new Set<string>();
        catalogo.forEach((p: any) => {
            if (p.proveedor) set.add(p.proveedor);
        });
        return Array.from(set).sort();
    }, [catalogo]);

    const filteredRentData = useMemo(() => {
        return processedRentData.filter((p: any) => {
            const matchesSearch = p.nombreLimpio.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = !selectedCategoria || p.categoria === selectedCategoria;
            const matchesProv = !selectedProveedor || p.proveedor === selectedProveedor;
            return matchesSearch && matchesCat && matchesProv;
        });
    }, [processedRentData, searchTerm, selectedCategoria, selectedProveedor]);

    const handleExportCSV = () => {
        if (!filteredRentData.length) return;
        const header = ["Producto", "Categoría", "Proveedor", "Unidades Vendidas", "Ingreso Bruto (Bs)", "Costo Real (Bs)", "Ganancia Sucursal (Bs)", "Ganancia Matriz (Bs)", "Precio Prom. Venta (Bs)", "Costo Unit. Base (Bs)", "% Margen"];
        const csvRows = filteredRentData.map((p: any) =>
            `"${p.nombreLimpio.replace(/"/g, '""')}","${String(p.categoria).replace(/"/g, '""')}","${String(p.proveedor).replace(/"/g, '""')}",${p.unidades},${p.ingreso_bruto.toFixed(2)},${p.costo_real.toFixed(2)},${p.ganancia_suc.toFixed(2)},${p.ganancia_matriz.toFixed(2)},${p.precio_prom.toFixed(2)},${p.costo_prom.toFixed(2)},${p.margen_pct.toFixed(1)}%`
        );
        const csvContent = "\uFEFF" + [header.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `Reporte_Rentabilidad_${rentRange}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
        window.URL.revokeObjectURL(url);
    };

    if (!esAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <AlertTriangle className="text-amber-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-24">

            {/* Header Premium (Executive Dashboard) */}
            <div className="flex flex-col gap-2 w-full mb-4">
                
                {/* 1. Cabecera y Títulos */}
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">Catálogo y Rentabilidad</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">Análisis de Rentabilidad, Matriz BCG y evolución de costos por producto.</p>
                </div>

                {/* 2. Filtros de Fecha (Segmented Control / Pills) */}
                <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-2xl gap-1 mt-6 w-fit">
                    {Object.entries(rangeLabels).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => handlePresetClick(key)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs transition-all",
                                timeRange === key
                                ? 'font-bold bg-white text-indigo-700 shadow-sm border border-gray-200'
                                : 'font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* 3. Tarjetas KPI "Glassmorphism" */}
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-32 space-y-4">
                        <Loader2 size={48} className="animate-spin text-amber-500 mb-2" />
                        <p className="text-amber-900 font-bold tracking-widest text-sm uppercase animate-pulse">
                            Analizando Catálogo y Márgenes...
                        </p>
                    </div>
                ) : isError || !data ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100 mt-6">
                        <AlertTriangle size={32} className="mx-auto mb-2" />
                        <h3 className="font-bold">Error cargando datos de catálogo</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Tarjeta Producto Estrella */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-400 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-amber-100 text-amber-600 p-1.5 rounded-lg">⭐</span>
                                <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Producto Estrella ({rangeLabels[timeRange as keyof typeof rangeLabels] || 'Periodo'})</span>
                            </div>
                            <h3 className="text-base font-black text-gray-800 mt-2 truncate">{data.top_productos_rentabilidad?.[0]?.nombre || 'Sin estrella'}</h3>
                            <p className="text-lg font-bold text-gray-900">
                                {data.top_productos_rentabilidad?.[0] ? formatBs(data.top_productos_rentabilidad[0].ingresos) : 'Bs. 0.00'} 
                                <span className="text-xs font-normal text-gray-500"> en ingresos</span>
                            </p>
                            <p className="text-[11px] font-semibold text-amber-600 mt-1">#1 en rentabilidad del periodo seleccionado</p>
                        </div>

                        {/* Tarjeta Sucursal Top */}
                        {data.sucursal_top && (
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg">🏢</span>
                                    <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Sucursal Top Contribuidora</span>
                                </div>
                                <h3 className="text-base font-black text-gray-800 mt-2 truncate">{data.sucursal_top.nombre}</h3>
                                <p className="text-lg font-bold text-gray-900">{formatBs(data.sucursal_top.ingresos)}</p>
                                <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                    <TrendingUp size={12} className="text-emerald-600"/>
                                    {data.sucursal_top.pct}% del total global
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

                    {/* CAPA 2: Matriz BCG Evolucionada con su propio estado de tiempo */}
                    <div className="min-h-[300px] w-full">
                        <BcgMatrix />
                    </div>

                    {/* CAPA 3: Tabla de Rentabilidad por Producto — DATOS REALES */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        {/* Header de la tarjeta con filtros propios */}
                        <div className="mb-6 pb-4 border-b border-gray-50">
                            <div className="flex flex-col gap-4">
                                {/* Título + búsqueda + exportar */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} /></div>
                                            Rentabilidad por Producto
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Costos y márgenes <strong className="text-emerald-600">reales</strong> desde cada venta POS e historial importado.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="relative w-full sm:w-64">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar producto..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                                            />
                                        </div>
                                        <button
                                            onClick={handleExportCSV}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                        >
                                            <FileSpreadsheet size={18} />
                                            Exportar CSV
                                        </button>
                                    </div>
                                </div>

                                {/* Filtros de fecha + sucursal */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                                    <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                        <Calendar size={14} className="text-gray-400 ml-1" />
                                        {Object.keys(rentRangeLabels).map(key => (
                                            <button
                                                key={key}
                                                onClick={() => setRentRange(key)}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300",
                                                    rentRange === key
                                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 scale-105'
                                                    : 'bg-transparent text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                                                )}
                                            >
                                                {rentRangeLabels[key]}
                                            </button>
                                        ))}
                                        {isRentLoading && <Loader2 size={14} className="animate-spin text-emerald-500 ml-2" />}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                        <div className="relative min-w-[150px]">
                                            <select
                                                value={selectedCategoria}
                                                onChange={(e) => setSelectedCategoria(e.target.value)}
                                                className="w-full pl-3 pr-8 py-2 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white appearance-none cursor-pointer transition-all"
                                            >
                                                <option value="">Todas las Categorías</option>
                                                {categoriasDisponibles.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="relative min-w-[150px]">
                                            <select
                                                value={selectedProveedor}
                                                onChange={(e) => setSelectedProveedor(e.target.value)}
                                                className="w-full pl-3 pr-8 py-2 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white appearance-none cursor-pointer transition-all"
                                            >
                                                <option value="">Todos los Proveedores</option>
                                                {proveedoresDisponibles.map(prov => (
                                                    <option key={prov} value={prov}>{prov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="relative min-w-[150px]">
                                            <select
                                                value={rentSucursal}
                                                onChange={(e) => setRentSucursal(e.target.value)}
                                                className="w-full pl-3 pr-8 py-2 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white appearance-none cursor-pointer transition-all"
                                            >
                                                {SUCS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const rows = filteredRentData;
                            const totIngreso   = rows.reduce((s: number, p: any) => s + (p.ingreso_bruto  || 0), 0);
                            const totCosto     = rows.reduce((s: number, p: any) => s + (p.costo_real     || 0), 0);
                            const totGanSuc    = rows.reduce((s: number, p: any) => s + (p.ganancia_suc   || 0), 0);
                            const totGanMat    = rows.reduce((s: number, p: any) => s + (p.ganancia_matriz || 0), 0);
                            const margenTotal  = totIngreso > 0 ? ((totIngreso - totCosto) / totIngreso * 100) : 0;
                            return rows.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3 text-right">Unidades Vendidas</th>
                                            <th className="px-4 py-3 text-right">Ingreso Bruto</th>
                                            <th className="px-4 py-3 text-right">Costo Real</th>
                                            <th className="px-4 py-3 text-right">Ganancia Sucursal</th>
                                            <th className="px-4 py-3 text-right">Ganancia Matriz</th>
                                            <th className="px-4 py-3 text-right">Precio Venta (Retail)</th>
                                            <th className="px-4 py-3 text-right">Costo Unitario</th>
                                            <th className="px-4 py-3 text-right">Margen %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((prod: any, i: number) => {
                                            const margenColor = prod.margen_pct > 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : prod.margen_pct > 5 ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                : 'bg-red-50 text-red-600 border-red-100';
                                            return (
                                            <tr
                                                key={i}
                                                className={cn(
                                                    "border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group",
                                                    i === 0 ? "bg-amber-50/20" : ""
                                                )}
                                            >
                                                <td className="px-4 py-3 max-w-[220px]">
                                                    <span className="font-bold text-gray-800">{prod.nombreLimpio}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-semibold text-gray-600">{(prod.unidades||0).toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                    Bs. {(prod.ingreso_bruto || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">
                                                    Bs. {(prod.costo_real || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-emerald-600 text-base">
                                                    Bs. {(prod.ganancia_suc || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-violet-600">
                                                    Bs. {(prod.ganancia_matriz || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-xs">
                                                        Bs. {(prod.precio_prom || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg text-xs">
                                                        Bs. {(prod.costo_prom || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${margenColor}`}>
                                                        {(prod.margen_pct||0).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50">
                                            <td colSpan={2} className="px-4 py-4 font-black text-gray-700 text-sm uppercase tracking-wider">
                                                TOTAL ({rows.length} productos)
                                            </td>
                                            <td className="px-4 py-4 text-right font-black text-gray-900">Bs. {totIngreso.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-4 text-right font-black text-red-500">Bs. {totCosto.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-4 text-right font-black text-emerald-600 text-base">Bs. {totGanSuc.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-4 text-right font-semibold text-violet-600">Bs. {totGanMat.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-4 text-center text-gray-400">-</td>
                                            <td className="px-4 py-4 text-center text-gray-400">-</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${
                                                    margenTotal > 15 ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                    : margenTotal > 5 ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                    : 'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                    {margenTotal.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Package size={40} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-semibold">Sin datos de productos disponibles en este periodo.</p>
                                </div>
                            );
                        })()}
                    </div>

                    {/* CAPA 4: Rendimiento por período vs Media Histórica */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">

                        {/* ── Header Rediseñado con Filtros Locales de Alto Contraste ── */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-gray-150 pb-6">
                            <div>
                                <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">Business Intelligence</span>
                                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 mt-1">
                                    <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl"><Activity size={24} /></div>
                                    Rendimiento Semanal del Mes vs Promedio
                                </h2>
                                <p className="text-gray-400 text-sm mt-2 max-w-2xl">
                                    Compara las semanas del mes seleccionado. Identifica rápidamente cuáles superaron la media histórica y cuáles estuvieron por debajo.
                                </p>
                            </div>

                            {/* Controles de Filtros Locales con Letras y Bordes de Alto Contraste */}
                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                {/* Filtro de Sucursal */}
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Sucursal</span>
                                    <select
                                        value={rendSucursal}
                                        onChange={(e) => setRendSucursal(e.target.value)}
                                        className="bg-white border-2 border-slate-300 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 font-black outline-none focus:border-indigo-500 hover:border-slate-450 transition-all cursor-pointer"
                                    >
                                        <option value="" className="text-slate-900">Todas las Sucursales</option>
                                        <option value="Heroinas" className="text-slate-900">Suc. Heroínas</option>
                                        <option value="Recoleta" className="text-slate-900">Suc. Recoleta</option>
                                        <option value="Calacoto" className="text-slate-900">Suc. Calacoto</option>
                                    </select>
                                </div>

                                {/* Selector de Mes */}
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Mes a Evaluar</span>
                                    <select
                                        value={rendMonth}
                                        onChange={(e) => setRendMonth(e.target.value)}
                                        className="bg-white border-2 border-slate-300 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 font-black outline-none focus:border-indigo-500 hover:border-slate-450 transition-all cursor-pointer"
                                    >
                                        <option value="2026-07" className="text-slate-900">Julio 2026</option>
                                        <option value="2026-06" className="text-slate-900">Junio 2026</option>
                                        <option value="2026-05" className="text-slate-900">Mayo 2026</option>
                                        <option value="2026-04" className="text-slate-900">Abril 2026</option>
                                        <option value="2026-03" className="text-slate-900">Marzo 2026</option>
                                        <option value="2026-02" className="text-slate-900">Febrero 2026</option>
                                        <option value="2026-01" className="text-slate-900">Enero 2026</option>
                                        <option value="2025-12" className="text-slate-900">Diciembre 2025</option>
                                        <option value="2025-11" className="text-slate-900">Noviembre 2025</option>
                                        <option value="2025-10" className="text-slate-900">Octubre 2025</option>
                                        <option value="2025-09" className="text-slate-900">Septiembre 2025</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── Lógica de Agrupación por Semana ── */}
                        {(() => {
                            const weeklyData = aggregateByPeriod(trendData, 'week');
                            const dataCompletadaComp = weeklyData.filter(d => !d.esCurso);
                            const mediaIngresoComp = dataCompletadaComp.length
                                ? Math.round(dataCompletadaComp.reduce((s, d) => s + d.ingresos, 0) / dataCompletadaComp.length)
                                : (weeklyData.length ? Math.round(weeklyData.reduce((s, d) => s + d.ingresos, 0) / weeklyData.length) : 0);

                            if (weeklyData.length === 0) {
                                return <div className="py-12 text-center text-gray-400 text-sm font-semibold">Sin transacciones registradas en este mes.</div>;
                            }

                            const sobre = weeklyData.filter(d => d.ingresos >= mediaIngresoComp).length;
                            const best  = [...weeklyData].sort((a, b) => b.ingresos - a.ingresos)[0];
                            const worst = [...weeklyData].sort((a, b) => a.ingresos - b.ingresos)[0];

                            // Paleta de Colores Pasteles Fijos para Comparación

                            return (
                                <>
                                    {/* ── KPIs Locales Rediseñados SIN Recuadros (Texto Limpio de Alto Contraste) ── */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 border-b border-gray-150 pb-6">
                                        {[
                                            { label: 'Semana Promedio', val: formatBs(mediaIngresoComp), sub: 'Referencia base del mes', color: 'text-indigo-700' },
                                            { label: 'Mejor Semana', val: best?.name ?? '-', sub: formatBs(best?.ingresos ?? 0), color: 'text-emerald-700' },
                                            { label: 'Peor Semana', val: worst?.name ?? '-', sub: formatBs(worst?.ingresos ?? 0), color: 'text-rose-700' },
                                            { label: 'Semanas Sobre Meta', val: `${sobre} de ${weeklyData.length}`, sub: `${Math.round(sobre/weeklyData.length*100)}% de efectividad`, color: 'text-violet-700' },
                                        ].map(k => (
                                            <div key={k.label} className="p-1.5 transition-all">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{k.label}</p>
                                                <p className={cn('text-xl font-black', k.color)}>{k.val}</p>
                                                <p className="text-[11px] text-slate-600 font-bold mt-1">{k.sub}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── Tarjetas Pasteles de Comparación ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {weeklyData.map((d, idx) => {
                                            const pctMedia = mediaIngresoComp > 0 ? ((d.ingresos - mediaIngresoComp) / mediaIngresoComp) * 100 : 0;
                                            const pctProgreso = mediaIngresoComp > 0 ? Math.min((d.ingresos / mediaIngresoComp) * 100, 100) : 0;
                                            const aboveMedia = d.ingresos >= mediaIngresoComp;

                                            const prevWeek = idx > 0 ? weeklyData[idx - 1] : null;
                                            const pctPrev = prevWeek && prevWeek.ingresos > 0 ? ((d.ingresos - prevWeek.ingresos) / prevWeek.ingresos) * 100 : 0;

                                            // Selección dinámica de color pastel semántica según rendimiento
                                            const palette = d.esCurso
                                                ? { card: 'bg-gradient-to-br from-slate-50/90 to-slate-100/40 border-slate-350 hover:shadow-slate-100/50', bar: 'bg-slate-500' }
                                                : aboveMedia
                                                ? { card: 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border-emerald-300 hover:shadow-emerald-100/50', bar: 'bg-emerald-500' }
                                                : { card: 'bg-gradient-to-br from-rose-50/90 to-rose-100/40 border-rose-300 hover:shadow-rose-100/50', bar: 'bg-rose-500' };

                                            return (
                                                <div key={idx} className={cn('p-6 rounded-[2rem] border shadow-sm transition-all duration-300 flex flex-col justify-between', palette.card)}>
                                                    {/* Cabecera de la Tarjeta */}
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2 mb-4">
                                                            <div>
                                                                <span className="text-[9px] uppercase font-black text-black tracking-wider">Período</span>
                                                                <h3 className="text-base font-black text-black flex items-center gap-2">
                                                                    Semana del {d.name}
                                                                </h3>
                                                            </div>

                                                            {/* Badge de Estado Semántico */}
                                                            <div>
                                                                {d.esCurso ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-black border border-slate-350 animate-pulse">
                                                                        <Clock size={10} /> En curso
                                                                    </span>
                                                                ) : aboveMedia ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                                                                        📈 +{pctMedia.toFixed(0)}% vs prom.
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-950 border border-rose-300">
                                                                        📉 {pctMedia.toFixed(0)}% vs prom.
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Comparación vs Semana Anterior */}
                                                        <div className="mb-4 p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-black/10 flex items-center justify-between text-[10px] text-black">
                                                            <span className="font-black">Vs. Semana anterior:</span>
                                                            {prevWeek ? (
                                                                <span className="font-black flex items-center gap-1">
                                                                    <span className={pctPrev >= 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                                                                        {pctPrev >= 0 ? '📈 +' : '📉 '}{pctPrev.toFixed(0)}%
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-600 font-bold">(era {formatBs(prevWeek.ingresos)})</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-655 font-bold italic">Primer período (base)</span>
                                                            )}
                                                        </div>

                                                        {/* Barra de Progreso hacia la Meta */}
                                                        <div className="mb-6">
                                                            <div className="flex justify-between items-center text-[10px] font-black text-black mb-1.5">
                                                                <span>Promedio mensual: {formatBs(mediaIngresoComp)}</span>
                                                                <span className="font-black text-black">
                                                                    {d.esCurso ? 'Acumulando...' : `${((d.ingresos / (mediaIngresoComp || 1)) * 100).toFixed(0)}% logrado`}
                                                                </span>
                                                            </div>
                                                            <div className="h-3.5 w-full bg-white/70 rounded-full overflow-hidden relative border border-gray-300/10">
                                                                <div
                                                                    className={cn('h-full rounded-full transition-all duration-1000', palette.bar)}
                                                                    style={{ width: `${pctProgreso}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Grilla de Métricas Detalladas con Letras Negras de Alto Contraste */}
                                                    <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                                                        <div className="text-center">
                                                            <span className="block text-[8px] uppercase font-black text-black tracking-wider">Ingresos</span>
                                                            <span className="text-xs font-black text-black">{formatBs(d.ingresos)}</span>
                                                        </div>
                                                        <div className="text-center border-x border-slate-200">
                                                            <span className="block text-[8px] uppercase font-black text-black tracking-wider">Ventas</span>
                                                            <span className="text-xs font-black text-black">{d.tickets} tkt</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="block text-[8px] uppercase font-black text-black tracking-wider">Tkt Prom.</span>
                                                            <span className="text-xs font-black text-black">{formatBs(d.ticket_promedio)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ── Subtexto Explicativo de Porcentajes ── */}
                                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-700 flex items-start gap-2.5">
                                        <span className="text-base leading-none">💡</span>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 mb-0.5">¿Cómo se calculan los porcentajes comparativos?</p>
                                            <p className="leading-relaxed text-slate-600">
                                                Los valores (ej. <span className="text-emerald-700 font-extrabold">+33% vs prom.</span> o <span className="text-rose-700 font-extrabold">14% logrado</span>) se calculan teniendo como base el <strong>Promedio Mensual (Semana Promedio)</strong> de tu mes seleccionado ({formatBs(mediaIngresoComp)}):
                                            </p>
                                            <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600">
                                                <li>El porcentaje de variación (ej. <span className="text-emerald-700 font-bold">+33% vs prom.</span>) indica cuánto superó o bajó la semana en comparación con ese promedio mensual base.</li>
                                                <li>El porcentaje logrado (ej. <span className="text-indigo-700 font-bold">133% logrado</span>) indica qué porcentaje de ese promedio mensual semanal se alcanzó en la semana correspondiente.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
        </div>
    );
}
