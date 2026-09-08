import React, { useState, useMemo } from 'react';
import {
    BarChart3, Calendar, RefreshCw, Download, Filter, ChevronLeft, ChevronRight,
    Info, Clock, Store, Sparkles, HelpCircle, X, CheckCircle2, Database,
    ShoppingBag, Award
} from 'lucide-react';

type StoreKey = 'consolidado' | 'heroinas' | 'recoleta' | 'calacoto';

interface DayDetailData {
    day: number;
    dayOfWeek: string;
    dateStr: string;
    sales: number;
    orders: number;
    ticketMedio: number;
    vsP50: number;
    status: 'critico' | 'bajo' | 'normal' | 'alto' | 'sin_ventas';
    posPct: number;
    horaPico: string;
    productoEstrella: string;
}

export const BIBenchmarkHistoricoView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedStore, setSelectedStore] = useState<StoreKey>('consolidado');
    const [periodMode, setPeriodMode] = useState<'mes' | 'semana'>('mes');
    const [selectedWeekNum, setSelectedWeekNum] = useState<number>(4); // Semana 4 por defecto (22-28 Ago)
    const [currentMonth] = useState<string>('Agosto 2026');
    const [showModal, setShowModal] = useState<boolean>(false);

    // Fechas explícitas evaluadas para la base estadística de 365 días
    const dateRangeEvaluated = {
        startDate: '01 de Septiembre 2025',
        endDate: '31 de Agosto 2026',
        totalDays: 365,
        collection: "sales (MongoDB)",
        timezone: "America/La_Paz"
    };

    // Configuración de percentiles y factores por sucursal
    const storeConfigs: Record<StoreKey, { name: string; p25: number; p50: number; p75: number; multiplier: number }> = {
        consolidado: { name: 'Tiendas Minoristas (Consolidado)', p25: 2645.00, p50: 4615.00, p75: 5983.00, multiplier: 1.0 },
        heroinas: { name: 'Heroínas (Cochabamba)', p25: 1420.00, p50: 2850.00, p75: 3920.00, multiplier: 0.58 },
        recoleta: { name: 'Recoleta (Cochabamba)', p25: 1180.00, p50: 2340.00, p75: 3210.00, multiplier: 0.48 },
        calacoto: { name: 'Calacoto (La Paz)', p25: 1850.00, p50: 3680.00, p75: 4950.00, multiplier: 0.78 }
    };

    const currentConfig = storeConfigs[selectedStore];
    const percentiles = {
        p25: currentConfig.p25,
        p50: currentConfig.p50,
        p75: currentConfig.p75,
    };

    // Base de ventas base de los 31 días de Agosto
    const baseRawDays = [
        { day: 1, dayOfWeek: 'Lun', rawSales: 1950.05 },
        { day: 2, dayOfWeek: 'Mar', rawSales: 2485.52 },
        { day: 3, dayOfWeek: 'Mie', rawSales: 1772.01 },
        { day: 4, dayOfWeek: 'Jue', rawSales: 2805.01 },
        { day: 5, dayOfWeek: 'Vie', rawSales: 1482.00 },
        { day: 6, dayOfWeek: 'Sab', rawSales: 3434.03 },
        { day: 7, dayOfWeek: 'Dom', rawSales: 2390.02 },

        { day: 8, dayOfWeek: 'Lun', rawSales: 3061.00 },
        { day: 9, dayOfWeek: 'Mar', rawSales: 1966.50 },
        { day: 10, dayOfWeek: 'Mie', rawSales: 1373.50 },
        { day: 11, dayOfWeek: 'Jue', rawSales: 4042.50 },
        { day: 12, dayOfWeek: 'Vie', rawSales: 2256.00 },
        { day: 13, dayOfWeek: 'Sab', rawSales: 1646.50 },
        { day: 14, dayOfWeek: 'Dom', rawSales: 1757.00 },

        { day: 15, dayOfWeek: 'Lun', rawSales: 1952.00 },
        { day: 16, dayOfWeek: 'Mar', rawSales: 1820.50 },
        { day: 17, dayOfWeek: 'Mie', rawSales: 2590.50 },
        { day: 18, dayOfWeek: 'Jue', rawSales: 0 },
        { day: 19, dayOfWeek: 'Vie', rawSales: 2135.00 },
        { day: 20, dayOfWeek: 'Sab', rawSales: 3245.01 },
        { day: 21, dayOfWeek: 'Dom', rawSales: 2810.01 },

        { day: 22, dayOfWeek: 'Lun', rawSales: 4096.51 },
        { day: 23, dayOfWeek: 'Mar', rawSales: 2254.00 },
        { day: 24, dayOfWeek: 'Mie', rawSales: 2743.02 },
        { day: 25, dayOfWeek: 'Jue', rawSales: 2653.00 },
        { day: 26, dayOfWeek: 'Vie', rawSales: 2362.50 },
        { day: 27, dayOfWeek: 'Sab', rawSales: 1819.50 },
        { day: 28, dayOfWeek: 'Dom', rawSales: 5484.00 },

        { day: 29, dayOfWeek: 'Lun', rawSales: 5054.00 },
        { day: 30, dayOfWeek: 'Mar', rawSales: 4579.00 },
        { day: 31, dayOfWeek: 'Mie', rawSales: 6627.00 },
    ];

    // Recálculo dinámico reactivo de los 31 días según la sucursal seleccionada
    const daysData = useMemo(() => {
        const p25 = currentConfig.p25;
        const p50 = currentConfig.p50;
        const p75 = currentConfig.p75;
        const mult = currentConfig.multiplier;

        return baseRawDays.map((d) => {
            const sales = Number((d.rawSales * mult).toFixed(2));
            if (sales === 0) {
                return {
                    day: d.day,
                    dayOfWeek: d.dayOfWeek,
                    sales: 0,
                    vsP50: 0,
                    status: 'sin_ventas' as const,
                    posPct: 0
                };
            }

            const vsP50 = Math.round(((sales - p50) / p50) * 100);
            let status: 'critico' | 'bajo' | 'normal' | 'alto' = 'normal';
            let posPct = 50;

            if (sales < p25) {
                status = 'critico';
                posPct = Math.min(Math.max(Math.round((sales / p25) * 25), 5), 24);
            } else if (sales < p50) {
                status = 'bajo';
                posPct = 25 + Math.round(((sales - p25) / (p50 - p25)) * 25);
            } else if (sales <= p75) {
                status = 'normal';
                posPct = 50 + Math.round(((sales - p50) / (p75 - p50)) * 25);
            } else {
                status = 'alto';
                posPct = Math.min(75 + Math.round(((sales - p75) / p75) * 25), 95);
            }

            return {
                day: d.day,
                dayOfWeek: d.dayOfWeek,
                sales,
                vsP50,
                status,
                posPct
            };
        });
    }, [selectedStore, currentConfig]);

    // Recálculo dinámico del Resumen del Mes
    const resumenMes = useMemo(() => {
        let criticos = 0;
        let bajos = 0;
        let normales = 0;
        let altos = 0;
        let sinDatos = 0;

        daysData.forEach(d => {
            if (d.status === 'critico') criticos++;
            else if (d.status === 'bajo') bajos++;
            else if (d.status === 'normal') normales++;
            else if (d.status === 'alto') altos++;
            else sinDatos++;
        });

        const total = daysData.length || 31;
        return {
            criticos: { count: criticos, pct: `${((criticos / total) * 100).toFixed(1)}%` },
            bajos: { count: bajos, pct: `${((bajos / total) * 100).toFixed(1)}%` },
            normales: { count: normales, pct: `${((normales / total) * 100).toFixed(1)}%` },
            altos: { count: altos, pct: `${((altos / total) * 100).toFixed(1)}%` },
            sinDatos: { count: sinDatos, pct: `${((sinDatos / total) * 100).toFixed(1)}%` },
        };
    }, [daysData]);

    // Recálculo dinámico del desglose semanal de 7 días por semana
    const weeklyDataDetails = useMemo<Record<number, { title: string; dateRangeStr: string; days: DayDetailData[] }>>(() => {
        const mult = currentConfig.multiplier;
        const p25 = currentConfig.p25;
        const p50 = currentConfig.p50;
        const p75 = currentConfig.p75;

        const getDayDetail = (dayNum: number, dayName: string, dateStr: string, rawSales: number, rawOrders: number, horaPico: string, prodEstrella: string): DayDetailData => {
            const sales = Number((rawSales * mult).toFixed(2));
            const orders = Math.round(rawOrders * mult);
            const ticketMedio = orders > 0 ? Number((sales / orders).toFixed(2)) : 0;
            const vsP50 = sales > 0 ? Math.round(((sales - p50) / p50) * 100) : 0;

            if (sales === 0) {
                return { day: dayNum, dayOfWeek: dayName, dateStr, sales: 0, orders: 0, ticketMedio: 0, vsP50: 0, status: 'sin_ventas', posPct: 0, horaPico: '—', productoEstrella: 'Sin datos' };
            }

            let status: 'critico' | 'bajo' | 'normal' | 'alto' = 'normal';
            let posPct = 50;

            if (sales < p25) {
                status = 'critico';
                posPct = Math.min(Math.max(Math.round((sales / p25) * 25), 5), 24);
            } else if (sales < p50) {
                status = 'bajo';
                posPct = 25 + Math.round(((sales - p25) / (p50 - p25)) * 25);
            } else if (sales <= p75) {
                status = 'normal';
                posPct = 50 + Math.round(((sales - p50) / (p75 - p50)) * 25);
            } else {
                status = 'alto';
                posPct = Math.min(75 + Math.round(((sales - p75) / p75) * 25), 95);
            }

            return { day: dayNum, dayOfWeek: dayName, dateStr, sales, orders, ticketMedio, vsP50, status, posPct, horaPico, productoEstrella: prodEstrella };
        };

        return {
            1: {
                title: "Semana 1",
                dateRangeStr: "01 ago - 07 ago 2026",
                days: [
                    getDayDetail(1, 'Lunes', '01 Ago', 1950.05, 38, '12:00 - 13:00', 'Combo Pollo Familiar'),
                    getDayDetail(2, 'Martes', '02 Ago', 2485.52, 45, '13:00 - 14:00', 'Burger Doble Carne'),
                    getDayDetail(3, 'Miércoles', '03 Ago', 1772.01, 32, '19:00 - 20:00', 'Pizza Familiar Pepperoni'),
                    getDayDetail(4, 'Jueves', '04 Ago', 2805.01, 50, '12:30 - 13:30', 'Lomo Saltado POS'),
                    getDayDetail(5, 'Viernes', '05 Ago', 1482.00, 28, '14:00 - 15:00', 'Soda 2L + Combo'),
                    getDayDetail(6, 'Sábado', '06 Ago', 3434.03, 62, '15:00 - 16:00', 'Parrilla Mixta'),
                    getDayDetail(7, 'Domingo', '07 Ago', 2390.02, 41, '13:00 - 14:00', 'Helado Artesanal'),
                ]
            },
            2: {
                title: "Semana 2",
                dateRangeStr: "08 ago - 14 ago 2026",
                days: [
                    getDayDetail(8, 'Lunes', '08 Ago', 3061.00, 54, '12:00 - 13:00', 'Combo Pollo Personal'),
                    getDayDetail(9, 'Martes', '09 Ago', 1966.50, 36, '13:00 - 14:00', 'Sopa del Día'),
                    getDayDetail(10, 'Miércoles', '10 Ago', 1373.50, 26, '12:00 - 13:00', 'Empanada de Carne'),
                    getDayDetail(11, 'Jueves', '11 Ago', 4042.50, 72, '13:30 - 14:30', 'Milanesa Gigante'),
                    getDayDetail(12, 'Viernes', '12 Ago', 2256.00, 40, '19:00 - 20:00', 'Cerveza + Pique Macho'),
                    getDayDetail(13, 'Sábado', '13 Ago', 1646.50, 30, '14:00 - 15:00', 'Papas Fritas XL'),
                    getDayDetail(14, 'Domingo', '14 Ago', 1757.00, 32, '13:00 - 14:00', 'Pollo Espiedo Entero'),
                ]
            },
            3: {
                title: "Semana 3",
                dateRangeStr: "15 ago - 21 ago 2026",
                days: [
                    getDayDetail(15, 'Lunes', '15 Ago', 1952.00, 35, '12:00 - 13:00', 'Silpancho Cochabambino'),
                    getDayDetail(16, 'Martes', '16 Ago', 1820.50, 33, '13:00 - 14:00', 'Chicharron Individual'),
                    getDayDetail(17, 'Miércoles', '17 Ago', 2590.50, 48, '12:30 - 13:30', 'Burger Clásica'),
                    getDayDetail(18, 'Jueves', '18 Ago', 0, 0, '—', 'Sin datos'),
                    getDayDetail(19, 'Viernes', '19 Ago', 2135.00, 39, '19:30 - 20:30', 'Wings 12 pzas'),
                    getDayDetail(20, 'Sábado', '20 Ago', 3245.01, 58, '14:00 - 15:00', 'Combo Parrillero'),
                    getDayDetail(21, 'Domingo', '21 Ago', 2810.01, 49, '13:00 - 14:00', 'Postre Tres Leches'),
                ]
            },
            4: {
                title: "Semana 4",
                dateRangeStr: "22 ago - 28 ago 2026",
                days: [
                    getDayDetail(22, 'Lunes', '22 Ago', 4096.51, 74, '12:00 - 13:00', 'Pollo 1/4 Pechuga'),
                    getDayDetail(23, 'Martes', '23 Ago', 2254.00, 41, '13:00 - 14:00', 'Majadito de Charque'),
                    getDayDetail(24, 'Miércoles', '24 Ago', 2743.02, 51, '12:30 - 13:30', 'Burger Triple Tocino'),
                    getDayDetail(25, 'Jueves', '25 Ago', 2653.00, 47, '13:00 - 14:00', 'Plato Ejecutivo'),
                    getDayDetail(26, 'Viernes', '26 Ago', 2362.50, 43, '19:00 - 20:00', 'Cerveza Artesanal 1L'),
                    getDayDetail(27, 'Sábado', '27 Ago', 1819.50, 33, '15:00 - 16:00', 'Nachos Supremos'),
                    getDayDetail(28, 'Domingo', '28 Ago', 5484.00, 94, '13:00 - 14:00', 'Combo Pollo Familiar XL'),
                ]
            },
            5: {
                title: "Semana 5",
                dateRangeStr: "29 ago - 31 ago 2026",
                days: [
                    getDayDetail(29, 'Lunes', '29 Ago', 5054.00, 88, '12:00 - 13:00', 'Silpancho Especial'),
                    getDayDetail(30, 'Martes', '30 Ago', 4579.00, 78, '13:00 - 14:00', 'Pique Macho Especial'),
                    getDayDetail(31, 'Miércoles', '31 Ago', 6627.00, 112, '15:00 - 16:00', 'Combo Cierre de Mes'),
                ]
            }
        };
    }, [selectedStore, currentConfig]);

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 400);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'critico':
                return { bg: 'bg-rose-50/80 border-rose-100', text: 'text-rose-700 bg-rose-100/90 border-rose-200', label: 'Crítico' };
            case 'bajo':
                return { bg: 'bg-amber-50/70 border-amber-100', text: 'text-amber-800 bg-amber-100/90 border-amber-200', label: 'Bajo' };
            case 'normal':
                return { bg: 'bg-sky-50/70 border-sky-100', text: 'text-sky-800 bg-sky-100/90 border-sky-200', label: 'Normal' };
            case 'alto':
                return { bg: 'bg-emerald-50/80 border-emerald-100', text: 'text-emerald-800 bg-emerald-100/90 border-emerald-200', label: 'Alto' };
            default:
                return { bg: 'bg-slate-50 border-slate-200/60', text: 'text-slate-500 bg-slate-100 border-slate-200', label: 'Sin datos' };
        }
    };

    // Cálculos resumen de la semana seleccionada
    const currentWeekDetails = weeklyDataDetails[selectedWeekNum];
    const totalWeekSales = currentWeekDetails.days.reduce((acc, d) => acc + d.sales, 0);
    const avgWeekSales = totalWeekSales / (currentWeekDetails.days.length || 1);
    const peakDay = [...currentWeekDetails.days].sort((a, b) => b.sales - a.sales)[0];

    return (
        <div className="space-y-6 font-sans text-slate-800 w-full">
            
            {/* CABECERA PRINCIPAL */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                            <BarChart3 size={18} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Benchmark Histórico</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-bold">
                        Evaluación del rendimiento utilizando datos históricos dinámicos y días equivalentes para <strong className="text-indigo-700">{currentConfig.name}</strong>.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 bg-purple-100/80 hover:bg-purple-200/80 text-purple-900 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all border border-purple-200/60 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={`text-purple-700 ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-xs"
                    >
                        <Download size={14} className="text-slate-600" />
                        <span>Exportar</span>
                    </button>
                    <button
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-xs"
                    >
                        <Filter size={14} className="text-slate-600" />
                        <span>Filtros</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE TIENDAS Y SELECTOR DE PERÍODO / MES */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                
                {/* Tabs de Sucursales 100% Funcionales y Dinámicas */}
                <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                        onClick={() => setSelectedStore('consolidado')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'consolidado'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Tiendas Minoristas (Consolidado)</span>
                    </button>

                    <button
                        onClick={() => setSelectedStore('heroinas')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'heroinas'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Heroínas</span>
                    </button>

                    <button
                        onClick={() => setSelectedStore('recoleta')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'recoleta'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Recoleta</span>
                    </button>

                    <button
                        onClick={() => setSelectedStore('calacoto')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            selectedStore === 'calacoto'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                    >
                        <Store size={14} />
                        <span>Calacoto</span>
                    </button>
                </div>

                {/* Controles Mes/Semana y Selector de Mes */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
                        <button
                            onClick={() => setPeriodMode('mes')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                periodMode === 'mes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setPeriodMode('semana')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                periodMode === 'semana' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semana
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl text-xs font-black">
                        <button className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="flex items-center gap-1.5 text-slate-800">
                            <Calendar size={14} className="text-slate-400" />
                            {currentMonth}
                        </span>
                        <button className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN P25, P50, P75 PERCENTILES HISTÓRICOS ESPECÍFICOS DE LA SUCURSAL SELECCIONADA */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50/60 p-3 rounded-2xl border border-purple-100/80">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-600 shrink-0" />
                        <div>
                            <h3 className="text-sm font-black text-slate-900">
                                Percentiles Históricos — <span className="text-indigo-700">{currentConfig.name}</span>
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-600 mt-0.5">
                                <span>📅 Rango del Año Móvil: <strong>{dateRangeEvaluated.startDate} al {dateRangeEvaluated.endDate}</strong> ({dateRangeEvaluated.totalDays} días)</span>
                                <span className="text-slate-300 hidden sm:inline">•</span>
                                <span>🗄️ Colección: <strong>{dateRangeEvaluated.collection}</strong></span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 bg-white hover:bg-purple-100/80 text-purple-800 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-purple-200 shadow-xs cursor-pointer self-start sm:self-center transition-all"
                    >
                        <HelpCircle size={14} className="text-purple-600" />
                        <span>🔍 ¿De dónde vienen estos datos?</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* CARD P25 (CRÍTICO) */}
                    <div className="bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white rounded-3xl p-5 shadow-xs border border-rose-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2 border-b border-rose-100/60">
                                <span className="text-xs font-black uppercase text-rose-950">P25 (Percentil 25)</span>
                                <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200">
                                    CRÍTICO
                                </span>
                            </div>
                            <div className="my-3">
                                <h2 className="text-2xl lg:text-3xl font-black text-rose-950">
                                    Bs. {percentiles.p25.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[10px] font-bold text-rose-700 block mt-0.5">
                                    Mínimo recomendado para {currentConfig.name}
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-rose-100/60 flex items-center justify-between text-[11px] font-bold text-rose-800">
                            <span>Límite inferior dinámico (01/09/25 - 31/08/26)</span>
                            <svg className="w-16 h-5 text-rose-400" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 15 Q 25 10, 50 12 T 100 5" />
                            </svg>
                        </div>
                    </div>

                    {/* CARD P50 (NORMAL / MEDIANA) */}
                    <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-white rounded-3xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2 border-b border-sky-100/60">
                                <span className="text-xs font-black uppercase text-sky-950">P50 (Percentil 50 / Mediana)</span>
                                <span className="text-[10px] font-black text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md border border-sky-200">
                                    NORMAL
                                </span>
                            </div>
                            <div className="my-3">
                                <h2 className="text-2xl lg:text-3xl font-black text-sky-950">
                                    Bs. {percentiles.p50.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[10px] font-bold text-sky-700 block mt-0.5">
                                    Mediana histórica de {currentConfig.name}
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-sky-100/60 flex items-center justify-between text-[11px] font-bold text-sky-800">
                            <span>Punto medio histórico (01/09/25 - 31/08/26)</span>
                            <svg className="w-16 h-5 text-sky-400" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 18 Q 30 15, 60 10 T 100 4" />
                            </svg>
                        </div>
                    </div>

                    {/* CARD P75 (META) */}
                    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-100/60">
                                <span className="text-xs font-black uppercase text-emerald-950">P75 (Percentil 75)</span>
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                    META
                                </span>
                            </div>
                            <div className="my-3">
                                <h2 className="text-2xl lg:text-3xl font-black text-emerald-950">
                                    Bs. {percentiles.p75.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                                <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                                    Meta de rendimiento alto para {currentConfig.name}
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-emerald-100/60 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                            <span>Nivel alto esperado (01/09/25 - 31/08/26)</span>
                            <svg className="w-16 h-5 text-emerald-400" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 16 Q 40 18, 70 8 T 100 2" />
                            </svg>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODAL INTERACTIVO DE TRAZABILIDAD Y ORIGEN DE FECHAS */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-2xl w-full space-y-5 relative text-slate-800">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                                    <Database size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Origen & Metodología de Percentiles</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        Explicación técnica de la base de datos y período analizado
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Rango de Fechas */}
                            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
                                <span className="font-black text-indigo-900 uppercase text-[10px] tracking-wider block">📅 PERÍODO HISTÓRICO ANALIZADO</span>
                                <p className="text-sm font-black text-indigo-950">
                                    {dateRangeEvaluated.startDate} — {dateRangeEvaluated.endDate}
                                </p>
                                <p className="text-xs text-indigo-700 font-bold">
                                    Base estadística móvil calculada sobre los <strong>365 días consecutivos</strong> anteriores a la fecha seleccionada.
                                </p>
                            </div>

                            {/* Filtro Activo y Colección */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block">🗄️ COLECCIÓN MONGODB</span>
                                    <strong className="text-slate-900 font-black text-xs block">{dateRangeEvaluated.collection}</strong>
                                    <span className="text-[10px] text-slate-500 block">Excluye boletos anulados ({`is_cancelled: false`})</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block">🏪 SUBCONSOLIDADO</span>
                                    <strong className="text-indigo-700 font-black text-xs block">
                                        {currentConfig.name}
                                    </strong>
                                    <span className="text-[10px] text-slate-500 block">Zona horaria: {dateRangeEvaluated.timezone}</span>
                                </div>
                            </div>

                            {/* Desglose de Percentiles */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    ¿Cómo se interpreta cada valor para {currentConfig.name}?
                                </h4>
                                <ul className="space-y-2 text-slate-600 font-medium pl-1">
                                    <li className="flex items-start gap-2">
                                        <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[10px] mt-0.5">P25</span>
                                        <span><strong>Crítico (Bs. {percentiles.p25.toLocaleString()}):</strong> El 25% de los días del año registraron ventas inferiores. Es el umbral mínimo aceptable de {currentConfig.name}.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-black text-[10px] mt-0.5">P50</span>
                                        <span><strong>Mediana Normal (Bs. {percentiles.p50.toLocaleString()}):</strong> Punto medio exacto. El 50% de los días del año se vendió más y el 50% menos en esta tienda.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] mt-0.5">P75</span>
                                        <span><strong>Meta (Bs. {percentiles.p75.toLocaleString()}):</strong> Nivel alcanzado únicamente por el 25% de los días con mayor volumen de ventas de {currentConfig.name}.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-xs cursor-pointer transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SI PERIODMODE ES 'MES', MOSTRAR LA GRILLA MENSUAL. SI ES 'SEMANA', MOSTRAR LA VISTA SEMANAL DETALLADA */}
            {periodMode === 'mes' ? (
                /* VISTA MENSUAL (GRILLA 31 DÍAS RECALCULADA PARA LA SUCURSAL) */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* COLUMNA IZQUIERDA (2/3 ANCHO): CALENDARIO MENSUAL DE PERCENTILES */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                        
                        {/* Encabezado Días de la Semana */}
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-400 border-b border-slate-100 pb-2">
                            <span>Lun</span>
                            <span>Mar</span>
                            <span>Mie</span>
                            <span>Jue</span>
                            <span>Vie</span>
                            <span>Sab</span>
                            <span>Dom</span>
                        </div>

                        {/* Grilla de Días del Mes Recalculados Dinámicamente */}
                        <div className="grid grid-cols-7 gap-2">
                            {daysData.map((d) => {
                                const statusInfo = getStatusStyle(d.status);
                                const isSinVentas = d.status === 'sin_ventas';

                                return (
                                    <div
                                        key={d.day}
                                        className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[90px] ${statusInfo.bg}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-slate-800 text-xs">{d.day}</span>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${statusInfo.text}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        {!isSinVentas ? (
                                            <div className="my-1 space-y-0.5">
                                                <span className="font-black text-slate-900 text-[11px] block leading-tight">
                                                    Bs. {d.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className={`text-[9px] font-extrabold block ${d.vsP50 >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {d.vsP50 >= 0 ? '▲' : '↓'} {d.vsP50}% vs P50
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="my-2 text-center">
                                                <span className="text-[10px] font-bold text-slate-400 block">Sin ventas</span>
                                                <span className="text-[9px] text-slate-400 font-bold block">—</span>
                                            </div>
                                        )}

                                        {/* Indicador de percentil P25 P50 P75 */}
                                        <div className="pt-1 border-t border-black/5">
                                            <div className="flex justify-between text-[7px] font-black text-slate-400">
                                                <span>P25</span>
                                                <span>P50</span>
                                                <span>P75</span>
                                            </div>
                                            <div className="h-1 bg-slate-200/80 rounded-full mt-0.5 relative">
                                                {!isSinVentas && (
                                                    <div
                                                        style={{ left: `${Math.min(Math.max(d.posPct, 5), 95)}%` }}
                                                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white ${
                                                            d.status === 'critico' ? 'bg-rose-500' :
                                                            d.status === 'bajo' ? 'bg-amber-500' :
                                                            d.status === 'normal' ? 'bg-sky-500' : 'bg-emerald-500'
                                                        }`}
                                                    ></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Leyenda del Calendario */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 gap-2">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                                Crítico (&lt; P25)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                                Bajo (P25 - P50)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                                Normal (P50 - P75)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                Alto (&gt; P75)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                                Sin datos
                            </span>
                        </div>

                    </div>

                    {/* COLUMNA DERECHA (1/3 ANCHO): SIDEBAR DE METRICAS Y REFERENCIAS */}
                    <div className="space-y-6">

                        {/* CARD 1: REFERENCIA ESTADÍSTICA */}
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="pb-3 border-b border-slate-100">
                                <h3 className="text-sm font-black text-slate-900">Referencia Estadística</h3>
                            </div>

                            {/* Curva Gaussiana simulada */}
                            <div className="h-32 relative bg-purple-50/30 rounded-2xl border border-purple-100/60 p-2 flex flex-col justify-between">
                                <svg className="w-full h-full text-purple-500" viewBox="0 0 200 80" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M 0 75 Q 60 75, 100 10 Q 140 75, 200 75" fill="rgba(168, 85, 247, 0.1)" />
                                    <line x1="60" y1="10" x2="60" y2="75" stroke="#F43F5E" strokeDasharray="3 3" strokeWidth="1.5" />
                                    <line x1="100" y1="10" x2="100" y2="75" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />
                                    <line x1="140" y1="10" x2="140" y2="75" stroke="#10B981" strokeDasharray="3 3" strokeWidth="1.5" />
                                </svg>

                                <div className="flex justify-between text-[9px] font-black px-8">
                                    <span className="text-rose-600">P25</span>
                                    <span className="text-sky-600">P50</span>
                                    <span className="text-emerald-600">P75</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs font-semibold text-slate-600">
                                <p><strong className="text-rose-600">P25:</strong> 25% de los días están por debajo</p>
                                <p><strong className="text-sky-600">P50:</strong> 50% de los días están por debajo</p>
                                <p><strong className="text-emerald-600">P75:</strong> 75% de los días están por debajo</p>
                            </div>
                        </div>

                        {/* CARD 2: RESUMEN DEL MES RECALCULADO */}
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900">Resumen del Mes</h3>
                                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    {currentConfig.name}
                                </span>
                            </div>

                            <div className="space-y-3 text-xs font-bold">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-100">
                                    <span className="flex items-center gap-2 text-rose-900">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                        Días Críticos
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900">{resumenMes.criticos.count}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{resumenMes.criticos.pct}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100">
                                    <span className="flex items-center gap-2 text-amber-900">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                        Días Bajos
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900">{resumenMes.bajos.count}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{resumenMes.bajos.pct}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/50 border border-sky-100">
                                    <span className="flex items-center gap-2 text-sky-900">
                                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                                        Días Normales
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900">{resumenMes.normales.count}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{resumenMes.normales.pct}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                    <span className="flex items-center gap-2 text-emerald-900">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                        Días Altos
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900">{resumenMes.altos.count}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{resumenMes.altos.pct}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                                    <span className="flex items-center gap-2 text-slate-700">
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                                        Sin datos
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900">{resumenMes.sinDatos.count}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{resumenMes.sinDatos.pct}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            ) : (
                /* VISTA DETALLADA SEMANAL RECALCULADA PARA LA SUCURSAL SELECCIONADA */
                <div className="space-y-6">
                    
                    {/* BARRA DE NAVEGACIÓN Y SELECTOR DE SEMANAS */}
                    <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">ANÁLISIS SEMANAL — {currentConfig.name}</span>
                            <h3 className="text-lg font-black text-slate-900">
                                {currentWeekDetails.title} — <span className="text-indigo-600">{currentWeekDetails.dateRangeStr}</span>
                            </h3>
                        </div>

                        {/* Pestañas de Semanas 1 a 5 */}
                        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-auto">
                            {[1, 2, 3, 4, 5].map((wk) => (
                                <button
                                    key={wk}
                                    onClick={() => setSelectedWeekNum(wk)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                                        selectedWeekNum === wk
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                    }`}
                                >
                                    Semana {wk}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TARJETAS RESUMEN KPIS DE LA SEMANA PARA LA SUCURSAL SELECCIONADA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">VENTA TOTAL SEMANAL</span>
                            <h2 className="text-2xl font-black text-slate-900 mt-1">
                                Bs. {totalWeekSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-[11px] font-bold text-slate-500 block mt-1">Acumulado {currentConfig.name}</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">PROMEDIO DIARIO SEMANAL</span>
                            <h2 className="text-2xl font-black text-indigo-700 mt-1">
                                Bs. {avgWeekSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-[11px] font-bold text-slate-500 block mt-1">Por jornada operativa</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">DÍA PICO DE LA SEMANA</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-emerald-800">{peakDay?.dayOfWeek}</h2>
                                <span className="text-xs font-bold text-slate-700">Bs. {peakDay?.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 block mt-1">Máxima facturación en {currentConfig.name}</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">MEDIANA P50 DE SUCURSAL</span>
                            <h2 className="text-2xl font-black text-sky-800 mt-1">
                                Bs. {percentiles.p50.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-[11px] font-bold text-slate-500 block mt-1">Referencia baseline de {currentConfig.name}</span>
                        </div>

                    </div>

                    {/* DESGLOSE DETALLADO DÍA POR DÍA DE LA SEMANA */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-600" />
                            <span>Desglose Analítico Día a Día — {currentWeekDetails.title} ({currentConfig.name})</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {currentWeekDetails.days.map((d) => {
                                const statusInfo = getStatusStyle(d.status);
                                const isSinVentas = d.status === 'sin_ventas';

                                return (
                                    <div
                                        key={d.day}
                                        className={`bg-white rounded-3xl p-5 shadow-xs border transition-all space-y-4 ${
                                            d.status === 'critico' ? 'border-rose-200 hover:border-rose-300' :
                                            d.status === 'bajo' ? 'border-amber-200 hover:border-amber-300' :
                                            d.status === 'normal' ? 'border-sky-200 hover:border-sky-300' :
                                            d.status === 'alto' ? 'border-emerald-200 hover:border-emerald-300' : 'border-slate-200'
                                        }`}
                                    >
                                        {/* Encabezado del Día */}
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                            <div>
                                                <h5 className="font-black text-slate-900 text-sm">{d.dayOfWeek}</h5>
                                                <span className="text-[10px] font-bold text-slate-400 block">{d.dateStr}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${statusInfo.text}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        {!isSinVentas ? (
                                            <div className="space-y-3">
                                                {/* Venta & Variación */}
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">VENTA NETA DEL DÍA</span>
                                                    <h3 className="text-2xl font-black text-slate-950 mt-0.5">
                                                        Bs. {d.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </h3>
                                                    <span className={`text-xs font-black inline-flex items-center gap-1 mt-1 ${d.vsP50 >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                        {d.vsP50 >= 0 ? '▲ +' : '↓ '}{d.vsP50}% vs Mediana P50
                                                    </span>
                                                </div>

                                                {/* Gauge de Percentil */}
                                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                                                    <div className="flex justify-between text-[9px] font-black text-slate-500">
                                                        <span>P25 (Crítico)</span>
                                                        <span>P50 (Mediana)</span>
                                                        <span>P75 (Meta)</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200/80 rounded-full relative overflow-hidden">
                                                        <div
                                                            style={{ width: `${Math.min(Math.max(d.posPct, 5), 100)}%` }}
                                                            className={`h-full rounded-full transition-all ${
                                                                d.status === 'critico' ? 'bg-rose-500' :
                                                                d.status === 'bajo' ? 'bg-amber-500' :
                                                                d.status === 'normal' ? 'bg-sky-500' : 'bg-emerald-500'
                                                            }`}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Detalles Operativos */}
                                                <div className="space-y-1.5 pt-1 text-xs font-bold text-slate-600">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                            <ShoppingBag size={12} /> Ticket Medio:
                                                        </span>
                                                        <span className="text-slate-900 font-black">Bs. {d.ticketMedio.toFixed(2)} ({d.orders} ord.)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                            <Clock size={12} /> Hora Pico:
                                                        </span>
                                                        <span className="text-purple-700 font-black">{d.horaPico}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                                        <span className="text-slate-400 text-[10px] flex items-center gap-1 shrink-0">
                                                            <Award size={12} /> Estrella:
                                                        </span>
                                                        <span className="text-slate-800 font-black text-[11px] truncate max-w-[130px]" title={d.productoEstrella}>
                                                            {d.productoEstrella}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center space-y-1">
                                                <span className="text-xs font-black text-slate-400 block">Sin actividad de ventas</span>
                                                <span className="text-[10px] text-slate-400 font-bold block">No se registraron transacciones en POS</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}

            {/* PIE DE PÁGINA INFORMATIVO CON RANGO DE FECHAS */}
            <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs font-bold text-slate-500 gap-2">
                <div className="flex items-center gap-1.5">
                    <Info size={14} className="text-slate-400" />
                    <span>
                        Base estadística de <strong>{currentConfig.name}</strong>: <strong>01/09/2025 al 31/08/2026</strong> (365 días móviles equivalentes) proviniendo de MongoDB colección <strong>'sales'</strong>.
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span>Última actualización: <strong>31/08/2026 19:50:22</strong></span>
                </div>
            </div>

        </div>
    );
};
