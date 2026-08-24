import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, RefreshCw, Layers, Clock,
    TrendingUp, ShoppingBag, Receipt, CheckCircle2, Filter,
    Download, Maximize2, RotateCcw, AlertTriangle, Store, Award, Zap,
    Activity, Cpu, Bell
} from 'lucide-react';
import { getBIPanelGeneral, getBISucursales } from '../../api/biApi';
import type { BIPanelGeneralResponse, BISucursalOption } from '../../api/biApi';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getFormattedDate = (daysOffset: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
};

export const BIPanelGeneralView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Controles de Fecha y Sucursal
    const [preset, setPreset] = useState<'hoy' | 'ayer' | '7dias' | '30dias' | 'historial' | 'custom'>('30dias');
    const [startDate, setStartDate] = useState<string>(() => getFormattedDate(-30));
    const [endDate, setEndDate] = useState<string>(() => getFormattedDate(0));
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    // Datos del BI Backend
    const [data, setData] = useState<BIPanelGeneralResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursales(list);
        } catch (err) {
            console.error('Error cargando sucursales para BI:', err);
        }
    };

    const fetchBIData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBIPanelGeneral(sDate, eDate, sucId);
            setData(res);
        } catch (err: unknown) {
            console.error('Error obteniendo métricas del BI:', err);
            const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
            const status = axiosErr?.response?.status;
            const msg = axiosErr?.response?.data?.detail
                || (status === 404
                    ? 'HTTP 404: El endpoint /api/v1/bi/panel-general no fue encontrado en el servidor. Verifica el despliegue del backend en Render.'
                    : 'Error al obtener datos del servidor BI. Comprueba la conexión.');
            setError(msg);
            setData(null); // Garantizar que no se muestre Bs. 0.00 en caso de error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSucursales();
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchBIData(startDate, endDate, selectedSucursal);
        }
    }, [startDate, endDate, selectedSucursal, fetchBIData]);

    const handlePresetChange = (newPreset: 'hoy' | 'ayer' | '7dias' | '30dias' | 'historial') => {
        setPreset(newPreset);
        const today = getFormattedDate(0);
        if (newPreset === 'hoy') {
            setStartDate(today);
            setEndDate(today);
        } else if (newPreset === 'ayer') {
            const meyer = getFormattedDate(-1);
            setStartDate(meyer);
            setEndDate(meyer);
        } else if (newPreset === '7dias') {
            const d7 = getFormattedDate(-7);
            setStartDate(d7);
            setEndDate(today);
        } else if (newPreset === '30dias') {
            const d30 = getFormattedDate(-30);
            setStartDate(d30);
            setEndDate(today);
        } else if (newPreset === 'historial') {
            setStartDate('historial');
            setEndDate('historial');
        }
    };

    const handleReset = () => {
        setPreset('30dias');
        setStartDate(getFormattedDate(-30));
        setEndDate(getFormattedDate(0));
        setSelectedSucursal('all');
    };

    const handleExportCSV = () => {
        if (!data || !data.desglose_sucursales) return;
        const headers = ['Sucursal ID', 'Nombre Sucursal', 'Ingresos Totales (Bs)', 'Órdenes', 'Ticket Medio (Bs)', 'Participacion %'];
        const rows = data.desglose_sucursales.map(s => [
            s.sucursal_id,
            `"${s.nombre_sucursal}"`,
            s.ingresos,
            s.ordenes,
            s.ticket_medio,
            `${s.participacion_pct}%`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `bi_panel_general_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    // REGLA DE ORO DE ERROR HANDLING: Si hay un error de conexión/backend, NO mostrar Bs 0.00
    if (error && !loading) {
        return (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 text-rose-950 max-w-4xl mx-auto my-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900">No se pudo conectar con el servicio de BI</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">
                            Error de Comunicación HTTP / Servidor Backend
                        </p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/70 p-3 rounded-xl border border-rose-200 font-mono">
                            {error}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-rose-200 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-rose-700">
                        * Los datos contables se encuentran protegidos en MongoDB. No se mostrarán métricas en cero por error de red.
                    </span>
                    <button
                        onClick={() => fetchBIData(startDate, endDate, selectedSucursal)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md active:scale-95"
                    >
                        <RefreshCw size={14} />
                        <span>Reintentar Conexión</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 animate-in fade-in duration-300 ${isFullscreen ? 'bg-slate-50 p-6' : ''}`}>
            {/* CENTRO DE INTELIGENCIA — CABECERA DEL PANEL GENERAL */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <Layers size={14} />
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — MODELO ESTRELLA</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">Panel General — Día a Día</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Orquestación en tiempo real sobre los datos del POS (MongoDB `sales` • Zona Horaria: <span className="text-emerald-400 font-bold">America/La_Paz</span>)
                    </p>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => fetchBIData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                        title="Actualizar datos desde el POS"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={handleExportCSV}
                        disabled={!data || loading}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-2xl transition-all border border-slate-700 disabled:opacity-50"
                        title="Exportar reporte en CSV"
                    >
                        <Download size={14} />
                        <span>Exportar</span>
                    </button>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-2xl transition-all border border-slate-700"
                        title="Restablecer filtros por defecto"
                    >
                        <RotateCcw size={14} />
                        <span>Restablecer</span>
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-2xl transition-all border border-slate-700"
                        title="Pantalla Completa"
                    >
                        <Maximize2 size={14} />
                        <span>Pantalla completa</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE CONTROLES Y FILTROS */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Presets Rápidos */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                    <button
                        onClick={() => handlePresetChange('hoy')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            preset === 'hoy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => handlePresetChange('ayer')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            preset === 'ayer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Ayer
                    </button>
                    <button
                        onClick={() => handlePresetChange('7dias')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            preset === '7dias' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        7 Días
                    </button>
                    <button
                        onClick={() => handlePresetChange('30dias')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            preset === '30dias' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        30 Días
                    </button>
                    <button
                        onClick={() => handlePresetChange('historial')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            preset === 'historial' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                        }`}
                    >
                        <span>Historial Completo</span>
                    </button>
                </div>

                {/* Selectores de Fechas Personalizadas y Sucursal */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate === 'historial' ? '' : startDate}
                            onChange={(e) => {
                                setPreset('custom');
                                setStartDate(e.target.value);
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        />
                        <span className="text-slate-400 font-bold text-xs">a</span>
                        <input
                            type="date"
                            value={endDate === 'historial' ? '' : endDate}
                            onChange={(e) => {
                                setPreset('custom');
                                setEndDate(e.target.value);
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {sucursales.map((s) => (
                                <option key={s.sucursal_id} value={s.sucursal_id}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* BARRA DE ESTADO DE CONEXIÓN Y TRAZABILIDAD */}
            {data && (
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center border border-slate-800 text-xs shadow-inner">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">FECHA</span>
                        <span className="font-extrabold text-white">
                            {data.fecha_inicio_bolivia === 'historial' ? 'Historial Completo' : data.fecha_inicio_bolivia}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">ESTADO</span>
                        <span className="font-extrabold text-emerald-400 flex items-center justify-center gap-1">
                            <CheckCircle2 size={12} />
                            {data.estado_sincronizacion}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">ÚLTIMA ACTUALIZACIÓN</span>
                        <span className="font-extrabold text-indigo-300">{data.ultima_actualizacion}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">MODO</span>
                        <span className="font-extrabold text-amber-400">{data.modo}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">SUCURSALES</span>
                        <span className="font-extrabold text-slate-200 truncate block">
                            {selectedSucursal === 'all' ? `${data.desglose_sucursales.length} Sucursales` : 'Filtrada'}
                        </span>
                    </div>
                </div>
            )}

            {/* PRIMER BLOQUE DE KPIS (5 TARJETAS REQUERIDAS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. INGRESOS TOTALES */}
                <div className="bg-[#7b75a6] rounded-3xl p-5 text-white shadow-md flex flex-col justify-between border border-white/10 relative overflow-hidden">
                    <div className="flex justify-between items-center pb-2 border-b border-white/20">
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-wider block text-white/90">Ingresos Totales</span>
                            <span className="text-[9px] font-semibold text-white/70">Venta Neta POS</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    </div>

                    <div className="my-4">
                        <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-none drop-shadow">
                            {loading ? '...' : formatBs(data?.ingresos_totales)}
                        </h2>
                        <p className="text-[10px] font-semibold text-white/80 mt-1.5 flex items-center gap-1">
                            <TrendingUp size={12} />
                            <span>Ventas brutas menos anuladas</span>
                        </p>
                    </div>

                    <div className="pt-2 border-t border-white/20 flex justify-between items-center text-[10px] font-extrabold text-white/80">
                        <span>Fuente: MongoDB sales</span>
                    </div>
                </div>

                {/* 2. MARGEN LÍQUIDO (Disponible Próximamente) */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">Margen Líquido</span>
                            <span className="text-[9px] font-semibold text-slate-400">Rentabilidad Contable</span>
                        </div>
                        <Receipt size={16} className="text-slate-400" />
                    </div>

                    <div className="my-4">
                        <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 inline-block">
                            Disponible próximamente
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">
                            Fase auditando costos reales
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                        <span>Estructura visual lista</span>
                    </div>
                </div>

                {/* 3. TICKET MEDIO */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">Ticket Medio</span>
                            <span className="text-[9px] font-semibold text-slate-400">Promedio por venta</span>
                        </div>
                        <Receipt size={16} className="text-emerald-600" />
                    </div>

                    <div className="my-4">
                        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">
                            {loading ? '...' : formatBs(data?.ticket_medio)}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 mt-1.5">
                            Ingresos Totales / Órdenes
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Vectorial Pandas</span>
                    </div>
                </div>

                {/* 4. TOTAL DE ÓRDENES (Visitas/Tickets POS) */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">Total de Órdenes</span>
                            <span className="text-[9px] font-semibold text-slate-400">Tickets válidos POS</span>
                        </div>
                        <ShoppingBag size={16} className="text-indigo-600" />
                    </div>

                    <div className="my-4">
                        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">
                            {loading ? '...' : data?.cantidad_ordenes || 0}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 mt-1.5">
                            Excluye tickets anulados
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                        <span>1 Ticket = 1 Orden</span>
                    </div>
                </div>

                {/* 5. IMPACTO IA (Disponible Próximamente) */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block">Impacto IA</span>
                            <span className="text-[9px] font-semibold text-slate-400">Modelo Predictivo</span>
                        </div>
                        <Cpu size={16} className="text-indigo-600" />
                    </div>

                    <div className="my-4">
                        <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-200 inline-block">
                            Disponible próximamente
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">
                            Fase de integración ML
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                        <span>Sin predicción activa</span>
                    </div>
                </div>
            </div>

            {/* SECCIÓN A Y D: VENTAS EN TIEMPO REAL & RESUMEN DEL DÍA */}
            {data?.resumen_operativo && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">SUCURSAL LÍDER</span>
                        <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                            <Award size={18} className="text-amber-500" />
                            {data.resumen_operativo.sucursal_lider}
                        </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">MEJOR HORA DE VENTA</span>
                        <span className="text-base font-black text-indigo-900 flex items-center gap-1.5">
                            <Clock size={18} className="text-indigo-600" />
                            {data.resumen_operativo.mejor_hora}
                        </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">PROMEDIO POR HORA</span>
                        <span className="text-base font-black text-emerald-900 flex items-center gap-1.5">
                            <Zap size={18} className="text-emerald-600" />
                            {formatBs(data.resumen_operativo.promedio_por_hora)}
                        </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">ÚLTIMA VENTA REGISTRADA</span>
                        <span className="text-base font-black text-slate-800 flex items-center gap-1.5">
                            <Activity size={18} className="text-indigo-500" />
                            {data.resumen_operativo.ultima_venta_hora}
                        </span>
                    </div>
                </div>
            )}

            {/* SECCIÓN B & F: TABLA DE VENTAS Y PARTICIPACIÓN POR SUCURSAL */}
            {data?.desglose_sucursales && data.desglose_sucursales.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Sección B & F — Desglose y Participación % por Sucursal</h3>
                            <p className="text-xs font-bold text-slate-400">
                                Ventas netas, cantidad de órdenes, ticket promedio y cuota de participación por tienda
                            </p>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                            {data.desglose_sucursales.length} Sucursales Activas
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-black tracking-wider">
                                    <th className="p-3.5 rounded-l-xl">Sucursal</th>
                                    <th className="p-3.5 text-right">Ventas Totales (Bs.)</th>
                                    <th className="p-3.5 text-center">Órdenes</th>
                                    <th className="p-3.5 text-right">Ticket Medio</th>
                                    <th className="p-3.5 text-right rounded-r-xl">Participación %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {data.desglose_sucursales.map((suc) => (
                                    <tr key={suc.sucursal_id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3.5">
                                            <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
                                                <Store size={14} className="text-indigo-600" />
                                                {suc.nombre_sucursal}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right font-black text-indigo-950 text-sm">
                                            {formatBs(suc.ingresos)}
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-extrabold">
                                                {suc.ordenes} ord.
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right text-emerald-700 font-extrabold">
                                            {formatBs(suc.ticket_medio)}
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-indigo-600 h-full rounded-full"
                                                        style={{ width: `${Math.min(suc.participacion_pct, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-black text-slate-900">{suc.participacion_pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SECCIÓN C: CURVA HORARIA (HORA DE BOLIVIA) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Sección C — Ventas por Rango Horario (Hora de Bolivia)</h3>
                        <p className="text-xs font-bold text-slate-400">
                            Agrupación en hora local America/La_Paz (00:00 a 23:59)
                        </p>
                    </div>
                    <Clock size={18} className="text-indigo-600" />
                </div>

                {loading ? (
                    <div className="h-40 flex items-center justify-center text-slate-400 text-xs font-bold">
                        Cargando distribución horaria...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                        {data?.ventas_por_hora.map((item) => (
                            <div
                                key={item.hora}
                                className={`p-2.5 rounded-2xl border text-center transition-all ${
                                    item.ordenes > 0
                                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold'
                                        : 'bg-slate-50 border-slate-150 text-slate-400'
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase block text-slate-500 mb-1">
                                    {item.hora}:00
                                </span>
                                <span className="text-xs font-extrabold block">
                                    {item.ingresos > 0 ? formatBs(item.ingresos) : 'Bs. 0'}
                                </span>
                                <span className="text-[10px] font-medium block mt-0.5 text-slate-500">
                                    {item.ordenes} ord.
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECCIÓN E: ACTIVIDAD RECIENTE (ÚLTIMAS VENTAS REALES DEL POS) */}
            {data?.ventas_recientes && data.ventas_recientes.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Sección E — Actividad Reciente</h3>
                            <p className="text-xs font-bold text-slate-400">
                                Últimas ventas registradas por el POS ordenadas cronológicamente (Hora de Bolivia)
                            </p>
                        </div>
                        <Activity size={18} className="text-emerald-600" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-black tracking-wider">
                                    <th className="p-3 rounded-l-xl">Hora (Bolivia)</th>
                                    <th className="p-3">Ticket #</th>
                                    <th className="p-3">Sucursal</th>
                                    <th className="p-3 text-right">Monto (Bs.)</th>
                                    <th className="p-3 text-center rounded-r-xl">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {data.ventas_recientes.map((v) => (
                                    <tr key={v.ticket_id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3 font-mono font-extrabold text-indigo-950">
                                            {v.hora_bolivia}
                                        </td>
                                        <td className="p-3 font-mono text-slate-500">
                                            {v.numero_ticket}
                                        </td>
                                        <td className="p-3 font-extrabold text-slate-800">
                                            {v.nombre_sucursal}
                                        </td>
                                        <td className="p-3 text-right font-black text-emerald-700">
                                            {formatBs(v.total_neto)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                                                {v.estado_pago}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SECCIÓN H: ALERTAS OPERATIVAS */}
            {data?.alertas_operativas && data.alertas_operativas.length > 0 && (
                <div className="space-y-2">
                    {data.alertas_operativas.map((a, idx) => (
                        <div key={idx} className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 text-indigo-900 text-xs font-bold">
                            <Bell size={16} className="text-indigo-600 flex-shrink-0" />
                            <div>
                                <span className="font-black uppercase tracking-wider block text-[10px] text-indigo-700">{a.titulo}</span>
                                <span className="text-indigo-900">{a.mensaje}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
