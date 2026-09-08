import React, { useState } from 'react';
import {
    BarChart3, Calendar, RefreshCw, Download, Filter, ChevronLeft, ChevronRight,
    Info, Clock, Store, Sparkles, HelpCircle, X, CheckCircle2, Database,
    ShoppingBag, Award
} from 'lucide-react';

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
    const [selectedStore, setSelectedStore] = useState<string>('consolidado');
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

    // Datos simulados de percentiles basados en la maqueta
    const percentiles = {
        p25: 2645.00,
        p50: 4615.00,
        p75: 5983.00,
    };

    // Datos de los 31 días de Agosto 2026 coincidiendo con la maqueta
    const daysData = [
        { day: 1, dayOfWeek: 'Lun', sales: 1950.05, vsP50: -65, status: 'critico', posPct: 15 },
        { day: 2, dayOfWeek: 'Mar', sales: 2485.52, vsP50: -35, status: 'bajo', posPct: 22 },
        { day: 3, dayOfWeek: 'Mie', sales: 1772.01, vsP50: -64, status: 'critico', posPct: 12 },
        { day: 4, dayOfWeek: 'Jue', sales: 2805.01, vsP50: -32, status: 'critico', posPct: 24 },
        { day: 5, dayOfWeek: 'Vie', sales: 1482.00, vsP50: -66, status: 'critico', posPct: 10 },
        { day: 6, dayOfWeek: 'Sab', sales: 3434.03, vsP50: -26, status: 'bajo', posPct: 35 },
        { day: 7, dayOfWeek: 'Dom', sales: 2390.02, vsP50: -60, status: 'critico', posPct: 20 },

        { day: 8, dayOfWeek: 'Lun', sales: 3061.00, vsP50: -44, status: 'critico', posPct: 28 },
        { day: 9, dayOfWeek: 'Mar', sales: 1966.50, vsP50: -44, status: 'critico', posPct: 16 },
        { day: 10, dayOfWeek: 'Mie', sales: 1373.50, vsP50: -72, status: 'critico', posPct: 8 },
        { day: 11, dayOfWeek: 'Jue', sales: 4042.50, vsP50: -3, status: 'bajo', posPct: 42 },
        { day: 12, dayOfWeek: 'Vie', sales: 2256.00, vsP50: -47, status: 'critico', posPct: 18 },
        { day: 13, dayOfWeek: 'Sab', sales: 1646.50, vsP50: -65, status: 'critico', posPct: 12 },
        { day: 14, dayOfWeek: 'Dom', sales: 1757.00, vsP50: -70, status: 'critico', posPct: 14 },

        { day: 15, dayOfWeek: 'Lun', sales: 1952.00, vsP50: -65, status: 'critico', posPct: 15 },
        { day: 16, dayOfWeek: 'Mar', sales: 1820.50, vsP50: -65, status: 'critico', posPct: 14 },
        { day: 17, dayOfWeek: 'Mie', sales: 2590.50, vsP50: -48, status: 'bajo', posPct: 24 },
        { day: 18, dayOfWeek: 'Jue', sales: 0, vsP50: 0, status: 'sin_ventas', posPct: 0 },
        { day: 19, dayOfWeek: 'Vie', sales: 2135.00, vsP50: -50, status: 'critico', posPct: 17 },
        { day: 20, dayOfWeek: 'Sab', sales: 3245.01, vsP50: -30, status: 'critico', posPct: 32 },
        { day: 21, dayOfWeek: 'Dom', sales: 2810.01, vsP50: -53, status: 'critico', posPct: 25 },

        { day: 22, dayOfWeek: 'Lun', sales: 4096.51, vsP50: -26, status: 'bajo', posPct: 43 },
        { day: 23, dayOfWeek: 'Mar', sales: 2254.00, vsP50: -26, status: 'critico', posPct: 18 },
        { day: 24, dayOfWeek: 'Mie', sales: 2743.02, vsP50: -45, status: 'bajo', posPct: 26 },
        { day: 25, dayOfWeek: 'Jue', sales: 2653.00, vsP50: -36, status: 'critico', posPct: 25 },
        { day: 26, dayOfWeek: 'Vie', sales: 2362.50, vsP50: -45, status: 'bajo', posPct: 20 },
        { day: 27, dayOfWeek: 'Sab', sales: 1819.50, vsP50: -61, status: 'critico', posPct: 14 },
        { day: 28, dayOfWeek: 'Dom', sales: 5484.00, vsP50: -8, status: 'bajo', posPct: 65 },

        { day: 29, dayOfWeek: 'Lun', sales: 5054.00, vsP50: -8, status: 'bajo', posPct: 58 },
        { day: 30, dayOfWeek: 'Mar', sales: 4579.00, vsP50: 20, status: 'alto', posPct: 75 },
        { day: 31, dayOfWeek: 'Mie', sales: 6627.00, vsP50: 34, status: 'alto', posPct: 88 },
    ];

    // Detalle semanal enriquecido para la vista semanal detallada
    const weeklyDataDetails: Record<number, { title: string; dateRangeStr: string; days: DayDetailData[] }> = {
        1: {
            title: "Semana 1",
            dateRangeStr: "01 ago - 07 ago 2026",
            days: [
                { day: 1, dayOfWeek: 'Lunes', dateStr: '01 Ago', sales: 1950.05, orders: 38, ticketMedio: 51.31, vsP50: -65, status: 'critico', posPct: 15, horaPico: '12:00 - 13:00', productoEstrella: 'Combo Pollo Familiar' },
                { day: 2, dayOfWeek: 'Martes', dateStr: '02 Ago', sales: 2485.52, orders: 45, ticketMedio: 55.23, vsP50: -35, status: 'bajo', posPct: 22, horaPico: '13:00 - 14:00', productoEstrella: 'Burger Doble Carne' },
                { day: 3, dayOfWeek: 'Miércoles', dateStr: '03 Ago', sales: 1772.01, orders: 32, ticketMedio: 55.37, vsP50: -64, status: 'critico', posPct: 12, horaPico: '19:00 - 20:00', productoEstrella: 'Pizza Familiar Pepperoni' },
                { day: 4, dayOfWeek: 'Jueves', dateStr: '04 Ago', sales: 2805.01, orders: 50, ticketMedio: 56.10, vsP50: -32, status: 'critico', posPct: 24, horaPico: '12:30 - 13:30', productoEstrella: 'Lomo Saltado POS' },
                { day: 5, dayOfWeek: 'Viernes', dateStr: '05 Ago', sales: 1482.00, orders: 28, ticketMedio: 52.92, vsP50: -66, status: 'critico', posPct: 10, horaPico: '14:00 - 15:00', productoEstrella: 'Soda 2L + Combo' },
                { day: 6, dayOfWeek: 'Sábado', dateStr: '06 Ago', sales: 3434.03, orders: 62, ticketMedio: 55.38, vsP50: -26, status: 'bajo', posPct: 35, horaPico: '15:00 - 16:00', productoEstrella: 'Parrilla Mixta' },
                { day: 7, dayOfWeek: 'Domingo', dateStr: '07 Ago', sales: 2390.02, orders: 41, ticketMedio: 58.29, vsP50: -60, status: 'critico', posPct: 20, horaPico: '13:00 - 14:00', productoEstrella: 'Helado Artesanal' },
            ]
        },
        2: {
            title: "Semana 2",
            dateRangeStr: "08 ago - 14 ago 2026",
            days: [
                { day: 8, dayOfWeek: 'Lunes', dateStr: '08 Ago', sales: 3061.00, orders: 54, ticketMedio: 56.68, vsP50: -44, status: 'critico', posPct: 28, horaPico: '12:00 - 13:00', productoEstrella: 'Combo Pollo Personal' },
                { day: 9, dayOfWeek: 'Martes', dateStr: '09 Ago', sales: 1966.50, orders: 36, ticketMedio: 54.62, vsP50: -44, status: 'critico', posPct: 16, horaPico: '13:00 - 14:00', productoEstrella: 'Sopa del Día' },
                { day: 10, dayOfWeek: 'Miércoles', dateStr: '10 Ago', sales: 1373.50, orders: 26, ticketMedio: 52.82, vsP50: -72, status: 'critico', posPct: 8, horaPico: '12:00 - 13:00', productoEstrella: 'Empanada de Carne' },
                { day: 11, dayOfWeek: 'Jueves', dateStr: '11 Ago', sales: 4042.50, orders: 72, ticketMedio: 56.14, vsP50: -3, status: 'bajo', posPct: 42, horaPico: '13:30 - 14:30', productoEstrella: 'Milanesa Gigante' },
                { day: 12, dayOfWeek: 'Viernes', dateStr: '12 Ago', sales: 2256.00, orders: 40, ticketMedio: 56.40, vsP50: -47, status: 'critico', posPct: 18, horaPico: '19:00 - 20:00', productoEstrella: 'Cerveza + Pique Macho' },
                { day: 13, dayOfWeek: 'Sábado', dateStr: '13 Ago', sales: 1646.50, orders: 30, ticketMedio: 54.88, vsP50: -65, status: 'critico', posPct: 12, horaPico: '14:00 - 15:00', productoEstrella: 'Papas Fritas XL' },
                { day: 14, dayOfWeek: 'Domingo', dateStr: '14 Ago', sales: 1757.00, orders: 32, ticketMedio: 54.90, vsP50: -70, status: 'critico', posPct: 14, horaPico: '13:00 - 14:00', productoEstrella: 'Pollo Espiedo Entero' },
            ]
        },
        3: {
            title: "Semana 3",
            dateRangeStr: "15 ago - 21 ago 2026",
            days: [
                { day: 15, dayOfWeek: 'Lunes', dateStr: '15 Ago', sales: 1952.00, orders: 35, ticketMedio: 55.77, vsP50: -65, status: 'critico', posPct: 15, horaPico: '12:00 - 13:00', productoEstrella: 'Silpancho Cochabambino' },
                { day: 16, dayOfWeek: 'Martes', dateStr: '16 Ago', sales: 1820.50, orders: 33, ticketMedio: 55.16, vsP50: -65, status: 'critico', posPct: 14, horaPico: '13:00 - 14:00', productoEstrella: 'Chicharron Individual' },
                { day: 17, dayOfWeek: 'Miércoles', dateStr: '17 Ago', sales: 2590.50, orders: 48, ticketMedio: 53.96, vsP50: -48, status: 'bajo', posPct: 24, horaPico: '12:30 - 13:30', productoEstrella: 'Burger Clásica' },
                { day: 18, dayOfWeek: 'Jueves', dateStr: '18 Ago', sales: 0, orders: 0, ticketMedio: 0, vsP50: 0, status: 'sin_ventas', posPct: 0, horaPico: '—', productoEstrella: 'Sin datos' },
                { day: 19, dayOfWeek: 'Viernes', dateStr: '19 Ago', sales: 2135.00, orders: 39, ticketMedio: 54.74, vsP50: -50, status: 'critico', posPct: 17, horaPico: '19:30 - 20:30', productoEstrella: 'Wings 12 pzas' },
                { day: 20, dayOfWeek: 'Sábado', dateStr: '20 Ago', sales: 3245.01, orders: 58, ticketMedio: 55.94, vsP50: -30, status: 'critico', posPct: 32, horaPico: '14:00 - 15:00', productoEstrella: 'Combo Parrillero' },
                { day: 21, dayOfWeek: 'Domingo', dateStr: '21 Ago', sales: 2810.01, orders: 49, ticketMedio: 57.34, vsP50: -53, status: 'critico', posPct: 25, horaPico: '13:00 - 14:00', productoEstrella: 'Postre Tres Leches' },
            ]
        },
        4: {
            title: "Semana 4",
            dateRangeStr: "22 ago - 28 ago 2026",
            days: [
                { day: 22, dayOfWeek: 'Lunes', dateStr: '22 Ago', sales: 4096.51, orders: 74, ticketMedio: 55.35, vsP50: -26, status: 'bajo', posPct: 43, horaPico: '12:00 - 13:00', productoEstrella: 'Pollo 1/4 Pechuga' },
                { day: 23, dayOfWeek: 'Martes', dateStr: '23 Ago', sales: 2254.00, orders: 41, ticketMedio: 54.97, vsP50: -26, status: 'critico', posPct: 18, horaPico: '13:00 - 14:00', productoEstrella: 'Majadito de Charque' },
                { day: 24, dayOfWeek: 'Miércoles', dateStr: '24 Ago', sales: 2743.02, orders: 51, ticketMedio: 53.78, vsP50: -45, status: 'bajo', posPct: 26, horaPico: '12:30 - 13:30', productoEstrella: 'Burger Triple Tocino' },
                { day: 25, dayOfWeek: 'Jueves', dateStr: '25 Ago', sales: 2653.00, orders: 47, ticketMedio: 56.44, vsP50: -36, status: 'critico', posPct: 25, horaPico: '13:00 - 14:00', productoEstrella: 'Plato Ejecutivo' },
                { day: 26, dayOfWeek: 'Viernes', dateStr: '26 Ago', sales: 2362.50, orders: 43, ticketMedio: 54.94, vsP50: -45, status: 'bajo', posPct: 20, horaPico: '19:00 - 20:00', productoEstrella: 'Cerveza Artesanal 1L' },
                { day: 27, dayOfWeek: 'Sábado', dateStr: '27 Ago', sales: 1819.50, orders: 33, ticketMedio: 55.13, vsP50: -61, status: 'critico', posPct: 14, horaPico: '15:00 - 16:00', productoEstrella: 'Nachos Supremos' },
                { day: 28, dayOfWeek: 'Domingo', dateStr: '28 Ago', sales: 5484.00, orders: 94, ticketMedio: 58.34, vsP50: -8, status: 'bajo', posPct: 65, horaPico: '13:00 - 14:00', productoEstrella: 'Combo Pollo Familiar XL' },
            ]
        },
        5: {
            title: "Semana 5",
            dateRangeStr: "29 ago - 31 ago 2026",
            days: [
                { day: 29, dayOfWeek: 'Lunes', dateStr: '29 Ago', sales: 5054.00, orders: 88, ticketMedio: 57.43, vsP50: -8, status: 'bajo', posPct: 58, horaPico: '12:00 - 13:00', productoEstrella: 'Silpancho Especial' },
                { day: 30, dayOfWeek: 'Martes', dateStr: '30 Ago', sales: 4579.00, orders: 78, ticketMedio: 58.70, vsP50: 20, status: 'alto', posPct: 75, horaPico: '13:00 - 14:00', productoEstrella: 'Pique Macho Especial' },
                { day: 31, dayOfWeek: 'Miércoles', dateStr: '31 Ago', sales: 6627.00, orders: 112, ticketMedio: 59.16, vsP50: 34, status: 'alto', posPct: 88, horaPico: '15:00 - 16:00', productoEstrella: 'Combo Cierre de Mes' },
            ]
        }
    };

    const resumenMes = {
        criticos: { count: 17, pct: '54.8%' },
        bajos: { count: 10, pct: '32.3%' },
        normales: { count: 0, pct: '0%' },
        altos: { count: 4, pct: '12.9%' },
        sinDatos: { count: 1, pct: '3.2%' },
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
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
                        Evaluación del rendimiento utilizando datos históricos dinámicos y días equivalentes.
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
                
                {/* Tabs de Sucursales */}
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
                                ? 'bg-indigo-600 text-white shadow-md'
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
                                ? 'bg-indigo-600 text-white shadow-md'
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
                                ? 'bg-indigo-600 text-white shadow-md'
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

            {/* SECCIÓN P25, P50, P75 PERCENTILES HISTÓRICOS */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50/60 p-3 rounded-2xl border border-purple-100/80">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-600 shrink-0" />
                        <div>
                            <h3 className="text-sm font-black text-slate-900">Percentiles Históricos</h3>
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
                                    Mínimo recomendado (25% de los días vendieron menos)
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
                                    Mediana del negocio (50% arriba / 50% abajo)
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
                                    Rendimiento superior (Solo 25% supera esta meta)
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
                                        {selectedStore === 'consolidado' ? 'Tiendas Minoristas (Consolidado)' : selectedStore.toUpperCase()}
                                    </strong>
                                    <span className="text-[10px] text-slate-500 block">Zona horaria: {dateRangeEvaluated.timezone}</span>
                                </div>
                            </div>

                            {/* Desglose de Percentiles */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    ¿Cómo se interpreta cada valor?
                                </h4>
                                <ul className="space-y-2 text-slate-600 font-medium pl-1">
                                    <li className="flex items-start gap-2">
                                        <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[10px] mt-0.5">P25</span>
                                        <span><strong>Crítico (Bs. 2,645.00):</strong> El 25% de los días del año registraron ventas inferiores. Es el umbral mínimo aceptable del negocio.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-black text-[10px] mt-0.5">P50</span>
                                        <span><strong>Mediana Normal (Bs. 4,615.00):</strong> Punto medio exacto. El 50% de los días del año se vendió más y el 50% menos.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] mt-0.5">P75</span>
                                        <span><strong>Meta (Bs. 5,983.00):</strong> Nivel alcanzado únicamente por el 25% de los días con mayor volumen de ventas del año.</span>
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
                /* VISTA MENSUAL (GRILLA 31 DÍAS) */
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

                        {/* Grilla de Días del Mes */}
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

                    {/* COLUMNA DERECHA (1/3 ANCHO): SIDEBAR DE METRICAS Y REFERENCIAS (SIN PRONÓSTICO IA) */}
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

                        {/* CARD 2: RESUMEN DEL MES */}
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="pb-3 border-b border-slate-100">
                                <h3 className="text-sm font-black text-slate-900">Resumen del Mes</h3>
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
                /* VISTA DETALLADA SEMANAL COMPLETA AL PRESIONAR 'SEMANA' */
                <div className="space-y-6">
                    
                    {/* BARRA DE NAVEGACIÓN Y SELECTOR DE SEMANAS */}
                    <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">ANÁLISIS SEMANAL DETALLADO</span>
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

                    {/* TARJETAS RESUMEN KPIS DE LA SEMANA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">VENTA TOTAL SEMANAL</span>
                            <h2 className="text-2xl font-black text-slate-900 mt-1">
                                Bs. {totalWeekSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-[11px] font-bold text-slate-500 block mt-1">Acumulado de {currentWeekDetails.days.length} días</span>
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
                            <span className="text-[11px] font-bold text-emerald-700 block mt-1">Máxima facturación registrada</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">MEDIANA HISTÓRICA P50</span>
                            <h2 className="text-2xl font-black text-sky-800 mt-1">
                                Bs. {percentiles.p50.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-[11px] font-bold text-slate-500 block mt-1">Referencia baseline de negocio</span>
                        </div>

                    </div>

                    {/* DESGLOSE DETALLADO DÍA POR DÍA DE LA SEMANA (7 TARJETAS ANALÍTICAS) */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-600" />
                            <span>Desglose Analítico Día a Día — {currentWeekDetails.title}</span>
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
                        Base estadística: <strong>01/09/2025 al 31/08/2026</strong> (365 días móviles equivalentes) proviniendo de MongoDB colección <strong>'sales'</strong>.
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
