import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAnalyticsDashboard } from '../api/api';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
} from 'recharts';
import {
    Store, Loader2, AlertTriangle, TrendingUp,
    Trophy, DollarSign, Activity, Percent, Sparkles, Layers
} from 'lucide-react';

const formatBs = (value: number) => {
    const num = typeof value === 'number' ? value : 0;
    return `Bs. ${num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const OFFICIAL_BRANCHES = ['Heroínas', 'Recoleta', 'Calacoto'];

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ANIOS = ['2026', '2025', '2024'];

const BRANCH_PALETTES: Record<string, {
    name: string;
    badgeBg: string;
    badgeText: string;
    color: string;
    colorLight: string;
    dotBg: string;
}> = {
    'Heroínas': {
        name: 'Heroínas',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badgeText: 'text-emerald-800',
        color: '#059669', // Verde Pastel
        colorLight: '#cbd5e1', // Gris Claro para período anterior
        dotBg: 'bg-emerald-500'
    },
    'Recoleta': {
        name: 'Recoleta',
        badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
        badgeText: 'text-sky-800',
        color: '#0284c7', // Azul Pastel
        colorLight: '#cbd5e1', // Gris Claro para período anterior
        dotBg: 'bg-sky-500'
    },
    'Calacoto': {
        name: 'Calacoto',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeText: 'text-amber-800',
        color: '#d97706', // Naranja Pastel
        colorLight: '#cbd5e1', // Gris Claro para período anterior
        dotBg: 'bg-amber-500'
    }
};

function getMonday(d: Date) {
    const c = new Date(d);
    const day = c.getDay();
    c.setDate(c.getDate() - (day === 0 ? 6 : day - 1));
    c.setHours(0, 0, 0, 0);
    return c;
}

export default function RegionalAndProductMix() {
    const [mode, setMode] = useState<'today' | 'week' | 'month' | 'year'>('month');
    
    // Selectores independientes para Período Actual y Período Comparación
    const [currMonthIdx, setCurrMonthIdx] = useState<number>(6); // Julio (0-indexed: 6 = Julio)
    const [currYear, setCurrYear] = useState<string>('2026');

    const [prevMonthIdx, setPrevMonthIdx] = useState<number>(5); // Junio (0-indexed: 5 = Junio)
    const [prevYear, setPrevYear] = useState<string>('2026');

    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const [resConsultaA, setResConsultaA] = useState<any>(null);
    const [resConsultaB, setResConsultaB] = useState<any>(null);

    // Calcular las fechas exactas ISO de inicio y fin para Consulta A (Actual) y Consulta B (Comparación)
    const datesBoundaries = useMemo(() => {
        const now = new Date();
        let startA = new Date();
        let endA = new Date();
        let startB = new Date();
        let endB = new Date();

        if (mode === 'today') {
            startA = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endA = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            let yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startB = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
            endB = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        } else if (mode === 'week') {
            startA = getMonday(now);
            endA = new Date(startA);
            endA.setDate(endA.getDate() + 6);
            endA.setHours(23, 59, 59, 999);

            endB = new Date(startA);
            endB.setMilliseconds(-1);
            startB = new Date(endB);
            startB.setDate(startB.getDate() - 6);
            startB.setHours(0, 0, 0, 0);
        } else if (mode === 'year') {
            const yA = parseInt(currYear);
            startA = new Date(yA, 0, 1, 0, 0, 0);
            endA = new Date(yA, 11, 31, 23, 59, 59, 999);

            const yB = parseInt(prevYear);
            startB = new Date(yB, 0, 1, 0, 0, 0);
            endB = new Date(yB, 11, 31, 23, 59, 59, 999);
        } else {
            // Modo Mes (Julio 2026 vs Junio 2026)
            const yA = parseInt(currYear);
            startA = new Date(yA, currMonthIdx, 1, 0, 0, 0);
            endA = new Date(yA, currMonthIdx + 1, 0, 23, 59, 59, 999);

            const yB = parseInt(prevYear);
            startB = new Date(yB, prevMonthIdx, 1, 0, 0, 0);
            endB = new Date(yB, prevMonthIdx + 1, 0, 23, 59, 59, 999);
        }

        return {
            startA: startA.toISOString(),
            endA: endA.toISOString(),
            startB: startB.toISOString(),
            endB: endB.toISOString()
        };
    }, [mode, currMonthIdx, currYear, prevMonthIdx, prevYear]);

    // Metadatos para las etiquetas de comparación
    const comparisonMeta = useMemo(() => {
        if (mode === 'today') {
            return { labelVs: 'vs Ayer', currentLabel: 'Hoy', prevLabel: 'Ayer' };
        } else if (mode === 'week') {
            return { labelVs: 'vs Semana anterior', currentLabel: 'Semana Actual', prevLabel: 'Semana Anterior' };
        } else if (mode === 'year') {
            return { labelVs: `vs ${prevYear}`, currentLabel: currYear, prevLabel: prevYear };
        } else {
            const labelA = `${MESES[currMonthIdx]} ${currYear}`;
            const labelB = `${MESES[prevMonthIdx]} ${prevYear}`;
            return { labelVs: `vs ${labelB}`, currentLabel: labelA, prevLabel: labelB };
        }
    }, [mode, currMonthIdx, currYear, prevMonthIdx, prevYear]);

    // Extracción ESTRICTA de métricas reales sin cálculos paralelos ni fallbacks no-cero cuando ventas es 0
    const extractMetrics = useCallback((res: any, branchName: string) => {
        if (!res) return { ventas: 0, transacciones: 0, clientes: 0, ticket: 0, margen: 0 };
        
        // 1. Intentar desde desgloseSucursales (SSOT Oficial del Dashboard Ejecutivo V2)
        const desglose = res.desgloseSucursales || {};
        const matchedKey = Object.keys(desglose).find(k => k.toLowerCase().includes(branchName.toLowerCase()));

        if (matchedKey && desglose[matchedKey]) {
            const b = desglose[matchedKey];
            const v = Math.round((b.ingresos ?? b.ventas ?? 0) * 100) / 100;
            const t = Math.round(b.visitas ?? b.transacciones ?? 0);
            const c = Math.round(b.clientes ?? b.visitas ?? 0);
            const tk = v > 0 ? (b.ticketMedio ?? (t > 0 ? v / t : 0)) : 0;
            const m = v > 0 ? (b.margenRetail ?? b.margenNeto ?? b.margen ?? 0) : 0;

            return { ventas: v, transacciones: t, clientes: c, ticket: tk, margen: m };
        }

        // 2. Intentar desde sales_by_branch o sucursales
        const branchList = res.sales_by_branch || res.sucursales || [];
        const matched = branchList.find((b: any) => (b.sucursal || b.name || b._id || '').toLowerCase().includes(branchName.toLowerCase()));

        if (matched) {
            const v = Math.round((matched.ventas ?? matched.ingresos ?? matched.total ?? 0) * 100) / 100;
            const t = Math.round(matched.tickets_cliente ?? matched.transacciones ?? 0);
            const c = Math.round(matched.clientes ?? t);
            const tk = v > 0 ? (matched.ticketMedio ?? (t > 0 ? v / t : 0)) : 0;
            const m = v > 0 ? (matched.margenRetail ?? matched.margenNeto ?? matched.margen ?? 0) : 0;

            return { ventas: v, transacciones: t, clientes: c, ticket: tk, margen: m };
        }

        return { ventas: 0, transacciones: 0, clientes: 0, ticket: 0, margen: 0 };
    }, []);

    // Ejecutar dos consultas independientes reutilizando el servicio SSOT de Analytics (/analytics/dashboard?time_range=custom)
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const [resA, resB]: any = await Promise.all([
                getAnalyticsDashboard(datesBoundaries.startA, datesBoundaries.endA, undefined, 'custom'),
                getAnalyticsDashboard(datesBoundaries.startB, datesBoundaries.endB, undefined, 'custom')
            ]);

            setResConsultaA(resA);
            setResConsultaB(resB);

            // TRAZAS TEMPORALES DIAGNÓSTICAS DE VERIFICACIÓN SSOT
            console.log("=================================================");
            console.log("[DIAGNOSTICO SSOT RENDIMIENTO POR SUCURSAL]");
            console.log("PERIODO CONSULTADO A (Actual):", datesBoundaries.startA, "a", datesBoundaries.endA);
            console.log("PERIODO CONSULTADO B (Comparación):", datesBoundaries.startB, "a", datesBoundaries.endB);
            console.log("MONGO DASHBOARD RESPONSE A:", resA);
            console.log("MONGO DASHBOARD RESPONSE B:", resB);
            OFFICIAL_BRANCHES.forEach(bName => {
                const mA = extractMetrics(resA, bName);
                const mB = extractMetrics(resB, bName);
                console.log(`>>> SUCURSAL ${bName.toUpperCase()}:`);
                console.log(`   [ACTUAL] Ventas: ${mA.ventas} | Trans: ${mA.transacciones} | Clientes: ${mA.clientes} | Ticket: ${mA.ticket} | Margen: ${mA.margen}`);
                console.log(`   [COMPARADO] Ventas: ${mB.ventas} | Trans: ${mB.transacciones} | Clientes: ${mB.clientes} | Ticket: ${mB.ticket} | Margen: ${mB.margen}`);
            });
            console.log("=================================================");
        } catch (e) {
            console.error("Error fetching branch performance using official SSOT pipeline:", e);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [datesBoundaries, extractMetrics]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Procesar datos comparativos para las 3 sucursales oficiales
    const branchesProcessed = useMemo(() => {
        const dataA = OFFICIAL_BRANCHES.map(bName => extractMetrics(resConsultaA, bName));
        const dataB = OFFICIAL_BRANCHES.map(bName => extractMetrics(resConsultaB, bName));

        const totalSalesAll = dataA.reduce((sum, item) => sum + item.ventas, 0);

        return OFFICIAL_BRANCHES.map((bName, idx) => {
            const palette = BRANCH_PALETTES[bName] || BRANCH_PALETTES['Heroínas'];
            const mA = dataA[idx];
            const mB = dataB[idx];

            const ventasCurr = mA.ventas;
            const ventasPrev = mB.ventas;

            const diffAbs = ventasCurr - ventasPrev;
            const pctYoY = ventasPrev > 0 ? ((ventasCurr - ventasPrev) / ventasPrev) * 100 : (ventasCurr > 0 ? 100 : 0);

            const sharePct = totalSalesAll > 0 ? Math.round((ventasCurr / totalSalesAll) * 100) : 0;

            return {
                nombre: bName,
                palette,
                hasSales: ventasCurr > 0,
                ventas: ventasCurr,
                ventasPrev,
                diffAbs,
                pctYoY,
                transacciones: mA.transacciones,
                clientes: mA.clientes,
                ticket: mA.ticket,
                margen: mA.margen,
                sharePct
            };
        });
    }, [resConsultaA, resConsultaB, extractMetrics]);

    // Ordenar ranking por ventas descendente
    const rankingSorted = useMemo(() => {
        return [...branchesProcessed].sort((a, b) => b.ventas - a.ventas);
    }, [branchesProcessed]);

    const hasData = branchesProcessed.some(b => b.hasSales);

    // 3 KPIs Superiores
    const topSalesBranch = rankingSorted[0] || branchesProcessed[0];
    const topGrowthBranch = useMemo(() => {
        return [...branchesProcessed].sort((a, b) => b.pctYoY - a.pctYoY)[0] || branchesProcessed[0];
    }, [branchesProcessed]);
    const topMarginBranch = useMemo(() => {
        return [...branchesProcessed].sort((a, b) => b.margen - a.margen)[0] || branchesProcessed[0];
    }, [branchesProcessed]);

    const maxSalesVal = Math.max(...branchesProcessed.flatMap(b => [b.ventas, b.ventasPrev]), 1);
    const maxGrowthVal = Math.max(...branchesProcessed.map(b => Math.abs(b.pctYoY)), 1);

    // Datos formateados para el Doughnut de Participación
    const pieData = useMemo(() => {
        return branchesProcessed.map(b => ({
            name: b.nombre,
            value: b.ventas > 0 ? b.ventas : (hasData ? 0 : 1),
            sharePct: b.sharePct,
            color: b.palette.color
        }));
    }, [branchesProcessed, hasData]);

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col space-y-6">
            
            {/* ENCABEZADO CON FILTROS Y SELECTORES DE MES */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-1">
                        <Layers className="text-indigo-600" size={24} />
                        Rendimiento por Sucursal
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                        Comparación del período seleccionado frente al período anterior.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Selectores de Período Actual y Comparación para el modo Mes */}
                    {mode === 'month' && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-bold">
                            <span className="text-slate-400 text-[10px] uppercase font-black px-1">Actual:</span>
                            <select
                                value={currMonthIdx}
                                onChange={(e) => setCurrMonthIdx(parseInt(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl px-2 py-1 outline-none font-bold text-slate-800"
                            >
                                {MESES.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={currYear}
                                onChange={(e) => setCurrYear(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-2 py-1 outline-none font-bold text-slate-800"
                            >
                                {ANIOS.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            <span className="text-slate-400 text-[10px] uppercase font-black px-1 ml-2">vs Comparar:</span>
                            <select
                                value={prevMonthIdx}
                                onChange={(e) => setPrevMonthIdx(parseInt(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl px-2 py-1 outline-none font-bold text-slate-800"
                            >
                                {MESES.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={prevYear}
                                onChange={(e) => setPrevYear(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-2 py-1 outline-none font-bold text-slate-800"
                            >
                                {ANIOS.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filtros Rápido de Período (Hoy, Semana, Mes, Año) */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/60 shrink-0">
                        {[
                            { id: 'today', label: 'Hoy' },
                            { id: 'week', label: 'Semana' },
                            { id: 'month', label: 'Mes' },
                            { id: 'year', label: 'Año' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setMode(tab.id as any)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${mode === tab.id ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-indigo-500">
                    <Loader2 size={40} className="animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando rendimiento SSOT por sucursal...</p>
                </div>
            ) : isError ? (
                <div className="flex items-center justify-center py-10 text-rose-500 text-xs font-bold bg-rose-50 rounded-2xl border border-rose-100 gap-2">
                    <AlertTriangle size={18} /> Error cargando comparativa por sucursal.
                </div>
            ) : (
                <div className="space-y-6">

                    {/* Mensaje Informativo si No Existen Ventas en el Período Seleccionado */}
                    {!hasData && (
                        <div className="bg-amber-50/90 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-600 shrink-0" />
                            <span>No existen ventas registradas para el período seleccionado ({comparisonMeta.currentLabel}). Los gráficos se mantienen visibles en cero.</span>
                        </div>
                    )}

                    {/* 3. KPIS SUPERIORES (SOLO 3 TARJETAS PEQUEÑAS) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50/80 rounded-3xl p-5 border border-emerald-200/80 shadow-2xs flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">🏆 Mayor Venta</span>
                                <h4 className="text-lg font-black text-slate-900 mt-0.5">{topSalesBranch.nombre}</h4>
                                <span className="text-xs font-bold text-emerald-700">{formatBs(topSalesBranch.ventas)}</span>
                            </div>
                        </div>

                        <div className="bg-sky-50/80 rounded-3xl p-5 border border-sky-200/80 shadow-2xs flex items-center gap-4">
                            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-sky-800 tracking-wider block">📈 Mayor Crecimiento</span>
                                <h4 className="text-lg font-black text-slate-900 mt-0.5">{topGrowthBranch.nombre}</h4>
                                <span className="text-xs font-bold text-sky-700">
                                    {topGrowthBranch.pctYoY >= 0 ? '+' : ''}{topGrowthBranch.pctYoY.toFixed(1)}% {comparisonMeta.labelVs}
                                </span>
                            </div>
                        </div>

                        <div className="bg-amber-50/80 rounded-3xl p-5 border border-amber-200/80 shadow-2xs flex items-center gap-4">
                            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                                <DollarSign size={22} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">💰 Mejor Margen</span>
                                <h4 className="text-lg font-black text-slate-900 mt-0.5">{topMarginBranch.nombre}</h4>
                                <span className="text-xs font-bold text-amber-700">{formatBs(topMarginBranch.margen)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4 & 5. BLOQUE DE GRÁFICOS EJECUTIVOS (GRÁFICO PRINCIPAL Y DOUGHNUT) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* 4. GRÁFICO PRINCIPAL: Ventas por Sucursal (Actual vs Anterior en Barras Horizontales) */}
                        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-600" />
                                    Ventas por Sucursal
                                </h3>
                                <div className="flex items-center gap-4 text-xs font-bold">
                                    <span className="flex items-center gap-1.5 text-slate-700">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" /> {comparisonMeta.currentLabel}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-400">
                                        <div className="w-3 h-3 rounded-full bg-slate-300" /> {comparisonMeta.prevLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-5 pt-2">
                                {branchesProcessed.map((b, idx) => {
                                    const pctCurr = maxSalesVal > 0 ? (b.ventas / maxSalesVal) * 100 : 0;
                                    const pctPrev = maxSalesVal > 0 ? (b.ventasPrev / maxSalesVal) * 100 : 0;

                                    return (
                                        <div key={idx} className="group relative space-y-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex justify-between items-baseline text-xs font-black text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${b.palette.dotBg}`} />
                                                    <span className="text-sm">{b.nombre}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 font-bold">{comparisonMeta.prevLabel}: {formatBs(b.ventasPrev)}</span>
                                                    <span className="text-slate-900 font-black">{comparisonMeta.currentLabel}: {formatBs(b.ventas)}</span>
                                                </div>
                                            </div>

                                            {/* Barra Período Actual */}
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max(pctCurr, 2)}%`, backgroundColor: b.palette.color }}
                                                />
                                            </div>

                                            {/* Barra Período Anterior (Gris Claro) */}
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-500 bg-slate-300"
                                                    style={{ width: `${Math.max(pctPrev, 2)}%` }}
                                                />
                                            </div>

                                            {/* Tooltip flotante con métricas exactas de la consulta SSOT */}
                                            <div className="absolute right-4 top-2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl z-20 pointer-events-none border border-slate-700">
                                                <div className="font-black text-indigo-300 mb-1">{b.nombre} — {comparisonMeta.currentLabel}</div>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-200">
                                                    <span>Ventas: {formatBs(b.ventas)}</span>
                                                    <span>Margen: {formatBs(b.margen)}</span>
                                                    <span>Trans: {b.transacciones}</span>
                                                    <span>Ticket: {formatBs(b.ticket)}</span>
                                                    <span>Clientes: {b.clientes}</span>
                                                    <span>Crecimiento: {b.pctYoY >= 0 ? '+' : ''}{b.pctYoY.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5. SEGUNDO GRÁFICO: Participación por Sucursal (Doughnut Chart) */}
                        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <Percent size={18} className="text-indigo-600" />
                                    Participación de Ventas
                                </h3>
                            </div>

                            <div className="h-44 relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            formatter={(value: any, name: any) => [formatBs(value), name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Cuota Total</span>
                                    <span className="text-base font-black text-slate-900">100%</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                {branchesProcessed.map((b, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${b.palette.dotBg}`} />
                                            <span className="text-slate-800">{b.nombre}</span>
                                        </div>
                                        <span className="font-black text-slate-900">{b.sharePct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* 6. TERCER GRÁFICO: Comparación del Crecimiento */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-600" />
                                Variación respecto al período anterior ({comparisonMeta.labelVs})
                            </h3>
                            <span className="text-xs font-bold text-slate-400">Porcentaje de crecimiento %</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            {branchesProcessed.map((b, idx) => {
                                const isPos = b.pctYoY >= 0;
                                const barWidth = maxGrowthVal > 0 ? (Math.abs(b.pctYoY) / maxGrowthVal) * 100 : 0;
                                return (
                                    <div key={idx} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2">
                                        <div className="flex justify-between items-center text-xs font-black text-slate-900">
                                            <span className="flex items-center gap-1.5">
                                                <span className={`w-2.5 h-2.5 rounded-full ${b.palette.dotBg}`} />
                                                {b.nombre}
                                            </span>
                                            <span className={isPos ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                                {isPos ? '+' : ''}{b.pctYoY.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-200/60 rounded-full overflow-hidden p-0.5">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${isPos ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                style={{ width: `${Math.max(barWidth, 4)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 7. TABLA EJECUTIVA ÚNICA (CONSUME ESTRICTAMENTE LAS MISMAS CIFRAS) */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <Store size={18} className="text-indigo-600" />
                                Detalle Comparativo Ejecutivo por Sucursal
                            </h3>
                            <span className="text-xs font-bold text-slate-400">Ordenado por ventas</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3">Sucursal</th>
                                        <th className="px-4 py-3 text-right">Ventas ({comparisonMeta.currentLabel})</th>
                                        <th className="px-4 py-3 text-right">Anterior ({comparisonMeta.prevLabel})</th>
                                        <th className="px-4 py-3 text-right">Δ %</th>
                                        <th className="px-4 py-3 text-right">Trans.</th>
                                        <th className="px-4 py-3 text-right">Clientes</th>
                                        <th className="px-4 py-3 text-right">Ticket</th>
                                        <th className="px-4 py-3 text-right">Margen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                    {rankingSorted.map((b, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-3.5 flex items-center gap-2 font-black text-slate-900">
                                                <span className={`w-2.5 h-2.5 rounded-full ${b.palette.dotBg}`} />
                                                {b.nombre}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatBs(b.ventas)}</td>
                                            <td className="px-4 py-3.5 text-right text-slate-400">{formatBs(b.ventasPrev)}</td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${b.pctYoY >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                    {b.pctYoY >= 0 ? '+' : ''}{b.pctYoY.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-bold text-slate-800">{b.transacciones.toLocaleString()}</td>
                                            <td className="px-4 py-3.5 text-right text-slate-600">{b.clientes.toLocaleString()}</td>
                                            <td className="px-4 py-3.5 text-right font-bold text-slate-800">{formatBs(b.ticket)}</td>
                                            <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatBs(b.margen)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
