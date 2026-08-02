import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAnalyticsDashboard, getRentabilidadReal, getProducts, getProveedores } from '../api/api';
import { 
    Calendar, 
    Search,
    TrendingUp,
    DollarSign,
    Package,
    AlertTriangle, 
    Loader2, 
    Activity,
    FileSpreadsheet, 
    FileText,
    Info,
    Clock,
    Award,
    Lightbulb,
    TrendingDown,
    ChevronDown,
    BarChart3,
    Store
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AnaliticaAvanzada from './AnaliticaAvanzada';

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

    // Per-branch data for comparison section
    const [branchData, setBranchData] = useState<Record<string, any[]>>({});
    const [isBranchLoading, setIsBranchLoading] = useState(false);
    const [activeBranchTab] = useState('Total');
    // Previous period data for suggestions
    const [prevRentData, setPrevRentData] = useState<any[]>([]);

    const [catalogo, setCatalogo] = useState<any[]>([]);
    const [proveedoresBD, setProveedoresBD] = useState<any[]>([]);

    useEffect(() => {
        getProducts(1, 2000).then(res => {
            setCatalogo(res.items || []);
        }).catch(err => {
            console.error("Error cargando catalogo en CatalogRentability:", err);
        });
        getProveedores(1, 1000).then(res => {
            setProveedoresBD(res || []);
        }).catch(err => {
            console.error("Error cargando proveedores en CatalogRentability:", err);
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

    // Fetch per-branch data in parallel for the Top por Sucursal section
    useEffect(() => {
        let isMounted = true;
        const fetchBranches = async () => {
            setIsBranchLoading(true);
            try {
                const now = new Date();
                let start = new Date('2024-01-01T00:00:00.000Z');
                let end   = new Date();
                if (rentRange === 'today') {
                    start = new Date(); start.setHours(0,0,0,0);
                    end   = new Date(); end.setHours(23,59,59,999);
                } else if (rentRange === '7days') {
                    start = new Date(now); start.setDate(now.getDate() - 7);
                } else if (rentRange === '30days') {
                    start = new Date(now); start.setDate(now.getDate() - 30);
                } else if (rentRange === 'this_month') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59);
                } else if (rentRange === 'this_year') {
                    start = new Date(now.getFullYear(), 0, 1);
                }

                // Previous period for suggestions
                const periodMs = end.getTime() - start.getTime();
                const prevEnd = new Date(start.getTime() - 1);
                const prevStart = new Date(prevEnd.getTime() - periodMs);

                const branches = ['Heroinas', 'Recoleta', 'Calacoto'];
                const [allRes, prevRes, ...branchRes] = await Promise.all([
                    getRentabilidadReal(start.toISOString(), end.toISOString(), undefined, 200),
                    getRentabilidadReal(prevStart.toISOString(), prevEnd.toISOString(), undefined, 200),
                    ...branches.map(b => getRentabilidadReal(start.toISOString(), end.toISOString(), b, 50))
                ]);

                if (isMounted) {
                    const map: Record<string, any[]> = { 'Total': Array.isArray(allRes) ? allRes : [] };
                    branches.forEach((b, i) => { map[b] = Array.isArray(branchRes[i]) ? branchRes[i] : []; });
                    setBranchData(map);
                    setPrevRentData(Array.isArray(prevRes) ? prevRes : []);
                }
            } catch {
                // silent
            } finally {
                if (isMounted) setIsBranchLoading(false);
            }
        };
        fetchBranches();
        return () => { isMounted = false; };
    }, [rentRange]);

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
        if (!Array.isArray(rentData)) return [];

        return rentData.map((item: any) => {
            const nombreLimpio = String(item.nombre || '').toUpperCase().trim();
            const unidades = Number(item.unidades || 0);
            const tickets = Number(item.tickets || 1);
            const ingreso_bruto = Number(item.ingreso_bruto || 0);
            const costo_base = Number(item.costo_base ?? item.costo_prom ?? 0);
            const precio_distribucion = Number(item.precio_distribucion || 0);
            const precio_prom = Number(item.precio_prom ?? (unidades > 0 ? ingreso_bruto / unidades : 0));
            
            const ganancia_matriz = Number(item.ganancia_matriz || 0);
            const ganancia_suc = Number(item.ganancia_suc ?? (ingreso_bruto - (precio_distribucion > 0 ? precio_distribucion : costo_base) * unidades));
            const ganancia_total = Number(item.ganancia_total ?? (ganancia_suc + ganancia_matriz));
            
            const margen_suc_pct = Number(item.margen_suc_pct ?? (ingreso_bruto > 0 ? (ganancia_suc / ingreso_bruto * 100) : 0));
            const margen_empresa_pct = Number(item.margen_empresa_pct ?? (ingreso_bruto > 0 ? (ganancia_total / ingreso_bruto * 100) : 0));

            return {
                nombreLimpio,
                unidades,
                tickets,
                precio_prom,
                ingreso_bruto,
                costo_base,
                precio_distribucion,
                ganancia_suc,
                ganancia_matriz,
                ganancia_total,
                margen_suc_pct,
                margen_empresa_pct,
                categoria: String(item.categoria || 'Sin Categoría'),
                proveedor: String(item.proveedor || 'Sin Proveedor'),
            };
        });
    }, [rentData]);

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
        if (Array.isArray(proveedoresBD)) {
            proveedoresBD.forEach((p: any) => {
                if (p.nombre) set.add(p.nombre);
            });
        }
        catalogo.forEach((p: any) => {
            if (p.proveedor) set.add(p.proveedor);
            if (Array.isArray(p.proveedores)) {
                p.proveedores.forEach((pr: string) => {
                    if (pr) set.add(pr);
                });
            }
        });
        return Array.from(set).sort();
    }, [proveedoresBD, catalogo]);

    const filteredRentData = useMemo(() => {
        const filtered = processedRentData.filter((p: any) => {
            const matchesSearch = p.nombreLimpio.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = !selectedCategoria || p.categoria === selectedCategoria;
            const matchesProv = !selectedProveedor || 
                p.proveedor === selectedProveedor ||
                (Array.isArray(p.proveedores) && p.proveedores.includes(selectedProveedor)) ||
                (String(p.proveedor || '').includes(selectedProveedor));
            return matchesSearch && matchesCat && matchesProv;
        });

        // REGLA: Consolidado -> Top 20. Sucursal seleccionada (Heroínas, Recoleta, Calacoto) -> Top 15.
        const limitToApply = rentSucursal ? 15 : 20;
        return filtered.slice(0, limitToApply);
    }, [processedRentData, searchTerm, selectedCategoria, selectedProveedor, rentSucursal]);

    const handleExportCSV = () => {
        if (!filteredRentData.length) return;
        const header = ["Producto", "Unidades", "Tickets", "Precio Promedio (Bs)", "Ingreso (Bs)", "Ganancia Sucursal (Bs)", "Ganancia Matriz (Bs)", "Ganancia Total (Bs)", "Margen Sucursal %", "Margen Empresa %", "Categoría", "Proveedor"];
        const csvRows = filteredRentData.map((p: any) =>
            `"${p.nombreLimpio.replace(/"/g, '""')}",${p.unidades},${p.tickets},${p.precio_prom.toFixed(2)},${p.ingreso_bruto.toFixed(2)},${p.ganancia_suc.toFixed(2)},${p.ganancia_matriz.toFixed(2)},${p.ganancia_total.toFixed(2)},${p.margen_suc_pct.toFixed(1)}%,${p.margen_empresa_pct.toFixed(1)}%,"${String(p.categoria).replace(/"/g, '""')}","${String(p.proveedor).replace(/"/g, '""')}"`
        );
        const csvContent = "\uFEFF" + [header.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `Reporte_Rentabilidad_${rentRange}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        if (!filteredRentData.length) return;
        const excelRows = filteredRentData.map((p: any) => ({
            "Producto": p.nombreLimpio,
            "Unidades": p.unidades,
            "Tickets": p.tickets,
            "Precio Promedio (Bs)": Number(p.precio_prom.toFixed(2)),
            "Ingreso (Bs)": Number(p.ingreso_bruto.toFixed(2)),
            "Ganancia Sucursal (Bs)": Number(p.ganancia_suc.toFixed(2)),
            "Ganancia Matriz (Bs)": Number(p.ganancia_matriz.toFixed(2)),
            "Ganancia Total (Bs)": Number(p.ganancia_total.toFixed(2)),
            "Margen Sucursal (%)": Number(p.margen_suc_pct.toFixed(1)),
            "Margen Empresa (%)": Number(p.margen_empresa_pct.toFixed(1)),
            "Categoría": p.categoria,
            "Proveedor": p.proveedor,
        }));
        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rentabilidad");
        XLSX.writeFile(workbook, `Reporte_Rentabilidad_${rentRange}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!filteredRentData.length) return;
        const doc = new jsPDF('landscape', 'pt', 'a4');
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text("Reporte Ejecutivo de Rentabilidad por Producto", 40, 40);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Período: ${rentRangeLabels[rentRange] || rentRange} | Sucursal: ${rentSucursal || 'Consolidado'} | Generado: ${new Date().toLocaleDateString('es-BO')}`, 40, 58);
        
        const tableColumn = ["Producto", "Unidades", "Tickets", "P. Prom (Bs)", "Ingreso (Bs)", "Gan. Sucursal", "Gan. Matriz", "Gan. Total", "Margen Suc.", "Margen Emp."];
        const tableRows = filteredRentData.map((p: any) => [
            p.nombreLimpio,
            p.unidades.toLocaleString(),
            p.tickets.toLocaleString(),
            `Bs. ${p.precio_prom.toFixed(2)}`,
            `Bs. ${p.ingreso_bruto.toFixed(2)}`,
            `Bs. ${p.ganancia_suc.toFixed(2)}`,
            `Bs. ${p.ganancia_matriz.toFixed(2)}`,
            `Bs. ${p.ganancia_total.toFixed(2)}`,
            `${p.margen_suc_pct.toFixed(1)}%`,
            `${p.margen_empresa_pct.toFixed(1)}%`,
        ]);
        
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            styles: { fontSize: 8, cellPadding: 5 },
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });
        
        doc.save(`Reporte_Ejecutivo_Rentabilidad_${rentRange}_${new Date().toISOString().slice(0,10)}.pdf`);
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
                    <p className="text-sm font-medium text-gray-500 mt-1">Análisis de Rentabilidad, Cartera de Productos y evolución de costos por producto.</p>
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
                                        {/* Rango de fechas analizado */}
                                        {(() => {
                                            const now = new Date();
                                            let start = new Date('2024-01-01');
                                            let end = new Date();
                                            if (rentRange === 'today') {
                                                start = new Date(); start.setHours(0,0,0,0);
                                                end = new Date(); end.setHours(23,59,59,999);
                                            } else if (rentRange === '7days') {
                                                start = new Date(now); start.setDate(now.getDate() - 7);
                                            } else if (rentRange === '30days') {
                                                start = new Date(now); start.setDate(now.getDate() - 30);
                                            } else if (rentRange === 'this_month') {
                                                start = new Date(now.getFullYear(), now.getMonth(), 1);
                                                end   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59);
                                            } else if (rentRange === 'this_year') {
                                                start = new Date(now.getFullYear(), 0, 1);
                                            }
                                            const fmt = (d: Date) => d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/La_Paz' });
                                            return (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-black text-emerald-700">
                                                        <Calendar size={11} />
                                                        {rentRange === 'historico'
                                                            ? 'Analizando: Histórico completo'
                                                            : `Analizando: ${fmt(start)} — ${fmt(end)}`}
                                                    </span>
                                                    {rentSucursal && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-black text-indigo-700">
                                                            🏪 {SUCS.find(s => s.value === rentSucursal)?.label}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
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
                                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all flex items-center gap-1.5 shadow-sm"
                                            title="Exportar como CSV"
                                        >
                                            <FileSpreadsheet size={16} className="text-emerald-600" />
                                            CSV
                                        </button>
                                        <button
                                            onClick={handleExportExcel}
                                            className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shadow-sm"
                                            title="Exportar Excel (.xlsx)"
                                        >
                                            <FileSpreadsheet size={16} />
                                            Excel
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shadow-sm"
                                            title="Exportar PDF Ejecutivo"
                                        >
                                            <FileText size={16} />
                                            PDF Ejecutivo
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
                            return rows.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase font-bold">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Producto</th>
                                            <th className="px-4 py-3 text-right">Unidades</th>
                                            <th className="px-4 py-3 text-right">Tickets</th>
                                            <th className="px-4 py-3 text-right">Precio Promedio</th>
                                            <th className="px-4 py-3 text-right">Ingreso</th>
                                            <th className="px-4 py-3 text-right">Ganancia Sucursal</th>
                                            <th className="px-4 py-3 text-right">Ganancia Matriz</th>
                                            <th className="px-4 py-3 text-right">Ganancia Total</th>
                                            <th className="px-4 py-3 text-center">Margen Sucursal</th>
                                            <th className="px-4 py-3 text-center">Margen Empresa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((prod: any, i: number) => {
                                            const margenSucColor = prod.margen_suc_pct > 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : prod.margen_suc_pct > 5 ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                : 'bg-red-50 text-red-600 border-red-100';
                                            const margenEmpColor = prod.margen_empresa_pct > 15 ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : prod.margen_empresa_pct > 5 ? 'bg-amber-50 text-amber-700 border-amber-100'
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
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-gray-800">{prod.nombreLimpio}</span>
                                                        <div className="relative group/tooltip inline-block cursor-pointer shrink-0">
                                                            <Info size={14} className="text-gray-400 hover:text-emerald-600 transition-colors" />
                                                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-72 p-3.5 bg-gray-900 text-white text-xs rounded-xl shadow-2xl z-50 pointer-events-none backdrop-blur-md bg-opacity-95 border border-gray-700">
                                                                <p className="font-black text-emerald-400 border-b border-gray-700 pb-1 mb-2 leading-tight">{prod.nombreLimpio}</p>
                                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                                                    <span className="text-gray-400">Precio prom. vendido:</span>
                                                                    <span className="font-bold text-right text-indigo-300">{formatBs(prod.precio_prom)}</span>
                                                                    <span className="text-gray-400">Costo base:</span>
                                                                    <span className="font-bold text-right">{formatBs(prod.costo_base)}</span>
                                                                    <span className="text-gray-400">Precio distribución:</span>
                                                                    <span className="font-bold text-right">{formatBs(prod.precio_distribucion)}</span>
                                                                    <span className="text-gray-400">Ganancia matriz:</span>
                                                                    <span className="font-bold text-violet-400 text-right">{formatBs(prod.ganancia_matriz)}</span>
                                                                    <span className="text-gray-400">Ganancia sucursal:</span>
                                                                    <span className="font-bold text-emerald-400 text-right">{formatBs(prod.ganancia_suc)}</span>
                                                                    <span className="text-gray-400">Ganancia empresa:</span>
                                                                    <span className="font-bold text-amber-400 text-right">{formatBs(prod.ganancia_total)}</span>
                                                                    <span className="text-gray-400">Margen sucursal:</span>
                                                                    <span className="font-bold text-right">{prod.margen_suc_pct.toFixed(1)}%</span>
                                                                    <span className="text-gray-400">Margen empresa:</span>
                                                                    <span className="font-bold text-right">{prod.margen_empresa_pct.toFixed(1)}%</span>
                                                                    <span className="text-gray-400">Tickets:</span>
                                                                    <span className="font-bold text-right">{prod.tickets}</span>
                                                                    <span className="text-gray-400">Categoría:</span>
                                                                    <span className="font-semibold text-right truncate">{prod.categoria}</span>
                                                                    <span className="text-gray-400">Proveedor:</span>
                                                                    <span className="font-semibold text-right truncate">{prod.proveedor}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-semibold text-gray-600">{(prod.unidades||0).toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-semibold text-gray-600">{(prod.tickets||1).toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-xs">
                                                        Bs. {(prod.precio_prom || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                    Bs. {(prod.ingreso_bruto || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-emerald-600 text-base">
                                                    Bs. {(prod.ganancia_suc || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-violet-600">
                                                    Bs. {(prod.ganancia_matriz || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-amber-600 text-base">
                                                    Bs. {(prod.ganancia_total || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${margenSucColor}`}>
                                                        {(prod.margen_suc_pct||0).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${margenEmpColor}`}>
                                                        {(prod.margen_empresa_pct||0).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>

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

                    {/* ─── SECCIÓN: TOP POR SUCURSAL ─── */}
                    {(() => {
                        const BRANCH_CONFIG = [
                            { key: 'Total',     label: 'Total Consolidado', icon: BarChart3,  color: 'indigo',  bg: 'bg-indigo-50',   text: 'text-indigo-700',  border: 'border-indigo-200',  bar: 'bg-indigo-500' },
                            { key: 'Heroinas',  label: 'Suc. Heroínas',    icon: Store,      color: 'emerald', bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
                            { key: 'Recoleta',  label: 'Suc. Recoleta',    icon: Store,      color: 'violet',  bg: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200',  bar: 'bg-violet-500' },
                            { key: 'Calacoto',  label: 'Suc. Calacoto',    icon: Store,      color: 'amber',   bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   bar: 'bg-amber-500' },
                        ];

                        // Build top-5 per branch from branchData (raw sale rows) using same aggregation logic
                        const claveUnica = (nombre: string) => String(nombre || '').toLowerCase().replace(/\s+/g, ' ').trim();

                        const buildTop = (rawRows: any[], limit = 5) => {
                            const map = new Map<string, { nombre: string; unidades: number; ingreso: number }>();
                            rawRows.forEach((v: any) => {
                                if (!v.nombre || v.estado === 'Cancelado' || v.anulada === true) return;
                                const k = claveUnica(v.nombre);
                                if (map.has(k)) {
                                    const e = map.get(k)!;
                                    e.unidades += Number(v.unidades || v.cantidad || 0);
                                    e.ingreso   += Number(v.ingreso_bruto || v.ingresos || 0);
                                } else {
                                    map.set(k, { nombre: String(v.nombre).toUpperCase().trim(), unidades: Number(v.unidades||v.cantidad||0), ingreso: Number(v.ingreso_bruto||v.ingresos||0) });
                                }
                            });
                            return Array.from(map.values()).sort((a,b) => b.unidades - a.unidades).slice(0, limit);
                        };

                        void activeBranchTab; // used for future tab switching

                        return (
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                                <div className="flex flex-col gap-2 mb-7">
                                    <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">Ranking Comercial</span>
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Award size={22} /></div>
                                        Top Más Vendidos por Sucursal
                                    </h2>
                                    <p className="text-gray-400 text-sm">Los 5 productos con mayor volumen de unidades vendidas en cada punto de venta para el período seleccionado.</p>
                                </div>

                                {isBranchLoading ? (
                                    <div className="flex justify-center items-center py-16">
                                        <Loader2 size={36} className="animate-spin text-indigo-400" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                        {BRANCH_CONFIG.map(cfg => {
                                            const Icon = cfg.icon;
                                            const rows = buildTop(branchData[cfg.key] || [], 5);
                                            const maxUnits = rows[0]?.unidades || 1;
                                            return (
                                                <div key={cfg.key} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-3`}>
                                                    <div className={`flex items-center gap-2 ${cfg.text} font-black text-sm`}>
                                                        <Icon size={16}/> {cfg.label}
                                                    </div>
                                                    {rows.length === 0 ? (
                                                        <p className="text-xs text-gray-400 italic py-4 text-center">Sin datos</p>
                                                    ) : (
                                                        <ol className="flex flex-col gap-2.5">
                                                            {rows.map((p, i) => (
                                                                <li key={i} className="flex flex-col gap-1">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="flex items-center gap-1.5 min-w-0">
                                                                            <span className={`shrink-0 w-5 h-5 rounded-full ${cfg.bar} text-white text-[10px] font-black flex items-center justify-center`}>{i+1}</span>
                                                                            <span className="text-[11px] font-bold text-gray-800 truncate leading-tight">{p.nombre}</span>
                                                                        </span>
                                                                        <span className="shrink-0 text-[11px] font-black text-gray-700">{p.unidades.toLocaleString()} uds.</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-white/70 rounded-full overflow-hidden">
                                                                        <div className={`h-full ${cfg.bar} rounded-full transition-all duration-700`} style={{width:`${Math.round((p.unidades/maxUnits)*100)}%`}}/>
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 font-semibold text-right">{formatBs(p.ingreso)}</span>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* ─── SECCIÓN: TOP 10 PRODUCTOS MÁS VENDIDOS GLOBAL ─── */}
                    {(() => {
                        const top10 = [...processedRentData]
                            .sort((a,b) => b.unidades - a.unidades)
                            .slice(0, 10);
                        const maxU = top10[0]?.unidades || 1;
                        const maxI = top10[0]?.ingreso_bruto || 1;

                        return (
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                                <div className="flex flex-col gap-2 mb-7">
                                    <span className="text-[10px] uppercase font-black text-amber-600 tracking-wider">Estrellas del Período</span>
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={22} /></div>
                                        10 Productos Más Vendidos
                                    </h2>
                                    <p className="text-gray-400 text-sm">Ranking global de los diez productos con mayor volumen de unidades en el período seleccionado, con sus márgenes reales.</p>
                                </div>

                                {top10.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Package size={40} className="mx-auto mb-3 opacity-40" />
                                        <p className="font-semibold">Sin datos disponibles en este período.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gradient-to-r from-amber-50 to-orange-50 text-xs text-gray-700 uppercase font-black">
                                                <tr>
                                                    <th className="px-4 py-3 text-left w-8">#</th>
                                                    <th className="px-4 py-3 text-left">Producto</th>
                                                    <th className="px-4 py-3 text-right">Unidades</th>
                                                    <th className="px-4 py-3 text-right">Ingreso Bruto</th>
                                                    <th className="px-4 py-3 text-right">Ganancia</th>
                                                    <th className="px-4 py-3 text-right">P. Retail Prom.</th>
                                                    <th className="px-4 py-3 text-right">Costo Unit.</th>
                                                    <th className="px-4 py-3 text-center">Margen %</th>
                                                    <th className="px-4 py-3 text-left">Vol. Relativo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {top10.map((prod: any, i: number) => {
                                                    const margenColor = prod.margen_pct > 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : prod.margen_pct > 5 ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                        : 'bg-red-50 text-red-600 border-red-100';
                                                    const medalColors = ['text-yellow-500','text-gray-400','text-amber-600'];
                                                    return (
                                                        <tr key={i} className={`border-b border-gray-50 hover:bg-amber-50/20 transition-colors ${i < 3 ? 'bg-amber-50/10' : ''}`}>
                                                            <td className="px-4 py-3">
                                                                <span className={`text-lg font-black ${medalColors[i] || 'text-gray-400'}`}>
                                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 max-w-[200px]">
                                                                <span className="font-bold text-gray-800 text-xs leading-tight block truncate">{prod.nombreLimpio}</span>
                                                                <span className="text-[10px] text-gray-400">{prod.categoria}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-black text-gray-900">{(prod.unidades||0).toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-gray-800">{formatBs(prod.ingreso_bruto)}</td>
                                                            <td className="px-4 py-3 text-right font-black text-emerald-600">{formatBs(prod.ganancia_suc)}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-xs">{formatBs(prod.precio_prom)}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg text-xs">{formatBs(prod.costo_prom)}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${margenColor}`}>
                                                                    {(prod.margen_pct||0).toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 min-w-[120px]">
                                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700"
                                                                        style={{width:`${Math.round((prod.unidades/maxU)*100)}%`}}
                                                                    />
                                                                </div>
                                                                <div className="text-[9px] text-gray-400 font-semibold mt-0.5 text-right">
                                                                    {Math.round((prod.ingreso_bruto/maxI)*100)}% del top
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* ─── SECCIÓN: SUGERENCIAS — Productos que bajaron o no salieron ─── */}
                    {(() => {
                        const claveUnica = (n: string) => String(n || '').toLowerCase().replace(/\s+/g, ' ').trim();

                        // Build name-set of current period
                        const currentNames = new Set(processedRentData.map(p => claveUnica(p.nombreLimpio)));

                        // Aggregate previous period
                        const prevMap = new Map<string, { nombre: string; unidades: number; ingreso: number }>();
                        prevRentData.forEach((v: any) => {
                            if (!v.nombre || v.estado === 'Cancelado' || v.anulada === true) return;
                            const k = claveUnica(v.nombre);
                            if (prevMap.has(k)) {
                                const e = prevMap.get(k)!;
                                e.unidades += Number(v.unidades||v.cantidad||0);
                                e.ingreso   += Number(v.ingreso_bruto||v.ingresos||0);
                            } else {
                                prevMap.set(k, { nombre: String(v.nombre).toUpperCase().trim(), unidades: Number(v.unidades||v.cantidad||0), ingreso: Number(v.ingreso_bruto||v.ingresos||0) });
                            }
                        });

                        // Products that disappeared (were in prev but not in current)
                        const disappeared = Array.from(prevMap.entries())
                            .filter(([k]) => !currentNames.has(k))
                            .map(([, v]) => ({ ...v, tipo: 'desaparecido' as const, dropPct: -100 }))
                            .sort((a,b) => b.unidades - a.unidades)
                            .slice(0, 8);

                        // Products that dropped significantly (in both but dropped >30%)
                        const dropped = processedRentData.map(p => {
                            const k = claveUnica(p.nombreLimpio);
                            const prev = prevMap.get(k);
                            if (!prev || prev.unidades === 0) return null;
                            const dropPct = ((p.unidades - prev.unidades) / prev.unidades) * 100;
                            if (dropPct >= -10) return null; // only significant drops
                            return { nombre: p.nombreLimpio, unidades: p.unidades, prevUnidades: prev.unidades, ingreso: p.ingreso_bruto, dropPct, margen_pct: p.margen_pct, tipo: 'caida' as const };
                        }).filter(Boolean).sort((a,b) => (a!.dropPct - b!.dropPct)).slice(0, 8) as any[];

                        const hasPrevData = prevRentData.length > 0;
                        const hasSuggestions = disappeared.length > 0 || dropped.length > 0;

                        return (
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                                <div className="flex flex-col gap-2 mb-7">
                                    <span className="text-[10px] uppercase font-black text-violet-700 tracking-wider">Inteligencia Comercial</span>
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <div className="p-2 bg-violet-50 text-violet-600 rounded-xl"><Lightbulb size={22} /></div>
                                        Sugerencias: Productos a Revisar
                                    </h2>
                                    <p className="text-gray-400 text-sm">Productos que no aparecieron en el período actual o que registraron una caída notable vs. el período anterior equivalente.</p>
                                </div>

                                {!hasPrevData ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <Lightbulb size={36} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-semibold text-sm">Selecciona un período con historial previo para ver sugerencias comparativas.</p>
                                    </div>
                                ) : !hasSuggestions ? (
                                    <div className="text-center py-10">
                                        <span className="text-4xl">🎉</span>
                                        <p className="font-bold text-gray-700 mt-3">¡Excelente! Todos los productos del período anterior siguen activos y sin caídas significativas.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-8">
                                        {/* Desaparecidos */}
                                        {disappeared.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black border border-red-200">
                                                        <Package size={12}/> {disappeared.length} producto{disappeared.length > 1 ? 's' : ''} sin ventas este período
                                                    </span>
                                                    <span className="text-xs text-gray-400">Vendidos en el período anterior, ausentes en el actual</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {disappeared.map((p: any, i: number) => (
                                                        <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                                                            <div className="flex items-start justify-between gap-1">
                                                                <span className="text-xs font-black text-gray-800 leading-tight line-clamp-2">{p.nombre}</span>
                                                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                                                                    <TrendingDown size={9}/> Sin ventas
                                                                </span>
                                                            </div>
                                                            <div className="mt-auto pt-2 border-t border-red-100">
                                                                <p className="text-[10px] text-gray-500 font-semibold">Período anterior:</p>
                                                                <p className="text-sm font-black text-red-600">{p.unidades.toLocaleString()} uds. · {formatBs(p.ingreso)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Caídas significativas */}
                                        {dropped.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-black border border-amber-200">
                                                        <TrendingDown size={12}/> {dropped.length} producto{dropped.length > 1 ? 's' : ''} con caída notable
                                                    </span>
                                                    <span className="text-xs text-gray-400">Bajaron más del 10% en unidades vs. período anterior</span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-amber-50 text-xs text-gray-700 uppercase font-black">
                                                            <tr>
                                                                <th className="px-4 py-2.5 text-left">Producto</th>
                                                                <th className="px-4 py-2.5 text-right">Uds. Actual</th>
                                                                <th className="px-4 py-2.5 text-right">Uds. Anterior</th>
                                                                <th className="px-4 py-2.5 text-right">Variación</th>
                                                                <th className="px-4 py-2.5 text-center">Margen</th>
                                                                <th className="px-4 py-2.5 text-left">Tendencia</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {dropped.map((p: any, i: number) => (
                                                                <tr key={i} className="border-b border-amber-50 hover:bg-amber-50/30 transition-colors">
                                                                    <td className="px-4 py-3">
                                                                        <span className="font-bold text-gray-800 text-xs block truncate max-w-[180px]">{p.nombre}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right font-black text-gray-900">{p.unidades.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-right font-semibold text-gray-500">{p.prevUnidades.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black bg-red-50 text-red-600 border border-red-100">
                                                                            <ChevronDown size={11}/> {Math.abs(p.dropPct).toFixed(0)}%
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-black border ${
                                                                            p.margen_pct > 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                            : p.margen_pct > 5 ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                            : 'bg-red-50 text-red-600 border-red-100'
                                                                        }`}>{(p.margen_pct||0).toFixed(1)}%</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 min-w-[120px]">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-gradient-to-r from-amber-400 to-red-400 rounded-full"
                                                                                    style={{width:`${Math.max(Math.round((p.unidades/(p.prevUnidades||1))*100), 2)}%`}}
                                                                                />
                                                                            </div>
                                                                            <span className="text-[9px] text-gray-400 font-semibold shrink-0">
                                                                                {Math.round((p.unidades/(p.prevUnidades||1))*100)}%
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

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
                                        <option value="Recoleta" className="text-slate-900">Suc. Recoletaabaa</option>
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

                    {/* ── Matriz BCG & Análisis de Cartera de Productos ── */}
                    <div className="mt-12 pt-10 border-t border-slate-200">
                        <AnaliticaAvanzada />
                    </div>
        </div>
    );
}
