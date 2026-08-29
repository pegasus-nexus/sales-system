import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Calendar, RefreshCw, Layers, Clock,
    TrendingUp, ShoppingBag, Receipt, CheckCircle2, Filter,
    Download, Maximize2, RotateCcw, AlertTriangle, Store, Award,
    Activity, Bell, Sparkles, Info, ChevronRight, X
} from 'lucide-react';
import { getBIPanelGeneral, getBISucursales } from '../../api/biApi';
import type { BIPanelGeneralResponse, BISucursalOption } from '../../api/biApi';
import { useAuthStore } from '../../store/authStore';

import { BIStateBanner } from './common/BIStateBanner';
import { MargenLiquidoCard } from './MargenLiquidoCard';
import { RentabilidadContableCard } from './RentabilidadContableCard';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// FUNCIÓN ÚNICA CENTRALIZADA DE FECHAS EN EL FRONTEND BASADA STRICTAMENTE EN AMERICA/LA_PAZ
const getFormattedBoliviaDate = (daysOffset: number = 0): string => {
    const now = new Date();
    // Obtener la fecha en formato YYYY-MM-DD usando la zona horaria oficial del negocio America/La_Paz
    const boliviaDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);

    if (daysOffset === 0) {
        return boliviaDateStr;
    }

    const [y, m, d] = boliviaDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + daysOffset);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const BIPanelGeneralView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Sequence Guard & Request Cancellation Refs
    const requestIdRef = useRef<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Controles de Fecha y Sucursal (Estado Atómico Rango de Fechas)
    const [preset, setPreset] = useState<'hoy' | 'ayer' | '7dias' | '30dias' | 'historial' | 'custom'>('hoy');
    const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => ({
        startDate: getFormattedBoliviaDate(0),
        endDate: getFormattedBoliviaDate(0)
    }));
    const { startDate, endDate } = dateRange;

    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);

    // Datos del BI Backend
    const [data, setData] = useState<BIPanelGeneralResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [showSucursalesModal, setShowSucursalesModal] = useState<boolean>(false);

    // PRUEBA OBLIGATORIA #2 — REGISTRO DE ACTUALIZACIÓN DE ESTADO REACT
    useEffect(() => {
        console.log('[BI DATA STATE UPDATED]', {
            fechaInicio: data?.fecha_inicio_bolivia,
            fechaFin: data?.fecha_fin_bolivia,
            ingresos: data?.ingresos_totales,
            ordenes: data?.cantidad_ordenes,
            ticket: data?.ticket_medio,
        });
    }, [data]);

    const loadSucursales = async () => {
        try {
            const list = await getBISucursales();
            setSucursales(list);
        } catch (err) {
            console.error('Error cargando sucursales para BI:', err);
        }
    };

    const fetchBIData = useCallback(async (sDate: string, eDate: string, sucId: string) => {
        const authState = useAuthStore.getState();
        console.log('[AUTH DEBUG]', {
            user: authState.user?.username || authState.user?.full_name || 'N/A',
            role: authState.role || authState.user?.role || 'N/A',
            tenantId: authState.user?.tenant_id || 'N/A',
            sucursalId: authState.sucursal_id || authState.user?.sucursal_id || 'N/A',
            tokenPresent: !!authState.token,
        });

        // PRUEBA OBLIGATORIA #4 — CONSOLE TRACE ORIGEN DE PETICIÓN
        console.trace('[BI FETCH CALL]', {
            startDate: sDate,
            endDate: eDate,
            sucId,
        });

        // 1. Cancelar la petición HTTP en vuelo previa si aún no terminó
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // 2. Incrementar el contador secuencial único del Request ID
        const currentRequestId = ++requestIdRef.current;

        console.log('[BI REQUEST START]', {
            requestId: currentRequestId,
            startDate: sDate,
            endDate: eDate,
            sucursal: sucId,
        });

        setLoading(true);
        setError(null);

        try {
            const res = await getBIPanelGeneral(sDate, eDate, sucId, { signal: controller.signal });

            console.log('[BI HTTP RESPONSE]', {
                requestId: currentRequestId,
                startDate: sDate,
                endDate: eDate,
                sucId,
                responseStart: res.fecha_inicio_bolivia,
                responseEnd: res.fecha_fin_bolivia,
                ingresos: res.ingresos_totales,
                ordenes: res.cantidad_ordenes,
                ticket: res.ticket_medio,
            });

            // 3. PROTECCIÓN CONTRA RESPUESTAS OBSOLETAS: Descartar si el ID no corresponde a la consulta más reciente
            if (currentRequestId !== requestIdRef.current) {
                console.warn('[BI REQUEST DISCARDED BY RACE GUARD]', {
                    requestId: currentRequestId,
                    activeRequestId: requestIdRef.current,
                    startDate: sDate,
                    endDate: eDate
                });
                return;
            }

            console.log('[BI SET DATA]', {
                requestId: currentRequestId,
                activeRequestId: requestIdRef.current,
                startDate: sDate,
                endDate: eDate,
                ingresos: res.ingresos_totales,
                ordenes: res.cantidad_ordenes,
            });

            setData(res);
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.warn('[BI REQUEST CANCELLED CLEANLY BY ABORT CONTROLLER]', {
                    requestId: currentRequestId,
                    startDate: sDate,
                    endDate: eDate
                });
                return;
            }

            if (currentRequestId === requestIdRef.current) {
                console.error('Error obteniendo métricas del BI:', err);
                const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
                const status = axiosErr?.response?.status;
                const msg = axiosErr?.response?.data?.detail
                    || (status === 404
                        ? 'HTTP 404: El endpoint /api/v1/bi/panel-general no fue encontrado en el servidor. Verifica el despliegue del backend en Render.'
                        : 'No fue posible obtener los datos del BI. Error de conexión con el servidor.');
                setError(msg);
                setData(null);
            }
        } finally {
            console.log('[BI REQUEST END]', {
                requestId: currentRequestId,
                activeRequestId: requestIdRef.current,
                startDate: sDate,
                endDate: eDate,
            });

            // Desactivar spinner únicamente para la petición activa
            if (currentRequestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadSucursales();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchBIData(dateRange.startDate, dateRange.endDate, selectedSucursal);
        }
    }, [dateRange, selectedSucursal, fetchBIData]);

    const handlePresetChange = (newPreset: 'hoy' | 'ayer' | '7dias' | '30dias' | 'historial') => {
        setPreset(newPreset);
        const todayBoliviaStr = getFormattedBoliviaDate(0);
        if (newPreset === 'hoy') {
            setDateRange({ startDate: todayBoliviaStr, endDate: todayBoliviaStr });
        } else if (newPreset === 'ayer') {
            const yesterdayBoliviaStr = getFormattedBoliviaDate(-1);
            setDateRange({ startDate: yesterdayBoliviaStr, endDate: yesterdayBoliviaStr });
        } else if (newPreset === '7dias') {
            const d7Str = getFormattedBoliviaDate(-6);
            setDateRange({ startDate: d7Str, endDate: todayBoliviaStr });
        } else if (newPreset === '30dias') {
            const d30Str = getFormattedBoliviaDate(-29);
            setDateRange({ startDate: d30Str, endDate: todayBoliviaStr });
        } else if (newPreset === 'historial') {
            setDateRange({ startDate: 'historial', endDate: 'historial' });
        }
    };

    const handleReset = () => {
        setPreset('hoy');
        const todayBoliviaStr = getFormattedBoliviaDate(0);
        setDateRange({ startDate: todayBoliviaStr, endDate: todayBoliviaStr });
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

    // SI HAY ERROR DE RED/HTTP (DIFERENCIAR ERROR DE CONEXIÓN DE SIN VENTAS)
    if (error && !loading) {
        return (
            <div className="bg-rose-50/90 border-2 border-rose-200/80 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 text-rose-950 max-w-4xl mx-auto my-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-600 shadow-xs">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900">No se pudo obtener los datos del BI</h2>
                        <p className="text-xs font-bold text-rose-700 mt-1">
                            Error de Comunicación HTTP / Servidor Backend
                        </p>
                        <p className="text-xs text-rose-800 mt-3 bg-white/80 p-3 rounded-2xl border border-rose-200 font-mono shadow-xs">
                            {error}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-rose-200 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-rose-700">
                        * Los datos contables están protegidos en MongoDB. No se mostrarán métricas en cero por error de red.
                    </span>
                    <button
                        onClick={() => fetchBIData(startDate, endDate, selectedSucursal)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={14} />
                        <span>Reintentar Conexión</span>
                    </button>
                </div>
            </div>
        );
    }

    const hasNoSales = data && data.cantidad_ordenes === 0;

    return (
        <div className={`min-h-screen bg-[#f8f9fd] p-1 sm:p-2 space-y-6 font-sans text-slate-800 w-full ${isFullscreen ? 'p-8' : ''}`}>
            
            {/* CABECERA PRINCIPAL ESTILO PASTEL LIMPÍSIMO */}
            <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/90 rounded-3xl p-6 shadow-sm border border-indigo-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs tracking-wider uppercase mb-1">
                        <div className="p-1 bg-white rounded-lg shadow-xs">
                            <Layers size={14} className="text-indigo-600" />
                        </div>
                        <span>CENTRO DE INTELIGENCIA DE NEGOCIOS — MODELO ESTRELLA</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Panel General — Día a Día</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1 flex flex-wrap items-center gap-2">
                        <span>Orquestación en tiempo real sobre los datos del POS (MongoDB `sales` • Zona Horaria: <span className="text-emerald-700 font-black bg-emerald-100/60 px-2 py-0.5 rounded-md">America/La_Paz</span>)</span>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-md">BUILD: {typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'PROD-LIVE'}</span>
                    </p>
                </div>

                {/* BOTONES DE ACCIÓN LIMPÍSIMOS EN PASTELES */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => fetchBIData(startDate, endDate, selectedSucursal)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
                        title="Actualizar datos desde el POS"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={handleExportCSV}
                        disabled={!data || loading}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all border border-slate-200/80 shadow-xs disabled:opacity-50"
                        title="Exportar reporte en CSV"
                    >
                        <Download size={14} className="text-slate-500" />
                        <span>Exportar</span>
                    </button>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all border border-slate-200/80 shadow-xs"
                        title="Restablecer filtros por defecto"
                    >
                        <RotateCcw size={14} className="text-slate-500" />
                        <span>Restablecer</span>
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all border border-slate-200/80 shadow-xs"
                        title="Pantalla Completa"
                    >
                        <Maximize2 size={14} className="text-slate-500" />
                        <span>Pantalla completa</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE CONTROLES Y FILTROS EN PASTEL BLANCO */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Presets Rápidos Pastel */}
                <div className="flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl overflow-x-auto">
                    <button
                        onClick={() => handlePresetChange('hoy')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            preset === 'hoy' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => handlePresetChange('ayer')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            preset === 'ayer' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Ayer
                    </button>
                    <button
                        onClick={() => handlePresetChange('7dias')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            preset === '7dias' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        7 Días
                    </button>
                    <button
                        onClick={() => handlePresetChange('30dias')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            preset === '30dias' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        30 Días
                    </button>
                    <button
                        onClick={() => handlePresetChange('historial')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            preset === 'historial' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100'
                        }`}
                    >
                        <span>Historial Completo</span>
                    </button>
                </div>

                {/* Selectores de Fechas y Sucursal */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate === 'historial' ? '' : startDate}
                            onChange={(e) => {
                                setPreset('custom');
                                const val = e.target.value;
                                setDateRange(prev => ({ ...prev, startDate: val }));
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        />
                        <span className="text-slate-400 font-bold text-xs">a</span>
                        <input
                            type="date"
                            value={endDate === 'historial' ? '' : endDate}
                            onChange={(e) => {
                                setPreset('custom');
                                const val = e.target.value;
                                setDateRange(prev => ({ ...prev, endDate: val }));
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
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

            {/* BARRA DE ESTADO EN TONO PASTEL SUAVE */}
            {data && (
                <div className="bg-white rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center border border-slate-200/70 text-xs shadow-xs">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">FECHA CONSULTADA</span>
                        <span className="font-extrabold text-slate-800">
                            {data.fecha_inicio_bolivia === 'historial' ? 'Historial Completo' : data.fecha_inicio_bolivia}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">ESTADO</span>
                        <span className={`font-extrabold flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg border inline-flex ${
                            hasNoSales
                                ? 'text-amber-700 bg-amber-50 border-amber-200/80'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-100/60'
                        }`}>
                            {hasNoSales ? <Info size={12} /> : <CheckCircle2 size={12} />}
                            {hasNoSales ? 'Sin ventas registradas' : data.estado_sincronizacion}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">ÚLTIMA ACTUALIZACIÓN</span>
                        <span className="font-extrabold text-indigo-700">{data.ultima_actualizacion}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">MODO</span>
                        <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100/60 inline-flex">
                            {data.modo}
                        </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">SUCURSALES</span>
                        <span className="font-extrabold text-slate-700 truncate block">
                            {selectedSucursal === 'all' ? `${data.desglose_sucursales.length} Sucursales` : 'Filtrada'}
                        </span>
                    </div>
                </div>
            )}

            {/* NOTIFICACIÓN ESTANDARIZADA DE ESTADO DE INFORMACIÓN */}
            {hasNoSales && !loading && (
                <BIStateBanner
                    type="NO_ACTIVITY"
                    dateRange={startDate === endDate ? startDate : `${startDate} a ${endDate}`}
                    message={`No se detectaron transacciones emitidas por el POS para la fecha seleccionada (${startDate}). La consulta a MongoDB fue realizada exitosamente retornando 200 OK con Bs. 0.00 en ventas.`}
                />
            )}

            {/* BLOQUE DE 5 TARJETAS KPIS CON ESTILO PASTEL ULTRA SUTIL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* TARJETA 1: INGRESOS TOTALES (Pastel Púrpura/Índigo) */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white rounded-3xl p-5 shadow-xs border border-indigo-100/80 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
                    <div className="flex justify-between items-start pb-3 border-b border-indigo-100/60">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-950 block">Ingresos Totales</span>
                            <span className="text-[10px] font-bold text-indigo-600/80">Venta Neta POS</span>
                        </div>
                        <div className="p-2 bg-indigo-100/60 rounded-2xl text-indigo-600">
                            <TrendingUp size={18} />
                        </div>
                    </div>

                    <div className="my-3">
                        <h2 className="text-2xl lg:text-3xl font-black text-indigo-950 tracking-tight leading-none">
                            {loading ? '...' : formatBs(data?.ingresos_totales)}
                        </h2>
                        <p className="text-[10px] font-bold text-indigo-700/80 mt-1 flex items-center gap-1">
                            <span>Ventas brutas menos anuladas</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setShowSucursalesModal(true)}
                        className="pt-2 border-t border-indigo-100/60 text-[11px] font-black text-indigo-700 hover:text-indigo-900 flex items-center justify-between w-full transition-colors group cursor-pointer"
                        title="Ver desglose detallado por sucursales"
                    >
                        <span className="flex items-center gap-1.5">
                            <Store size={13} className="text-indigo-600" />
                            <span>Desglose Sucursales</span>
                        </span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* TARJETA 2: MARGEN LÍQUIDO (Pastel Ámbar/Naranja) */}
                <MargenLiquidoCard
                    margenLiquidoBs={data?.margen_liquido_bs}
                    comisionMatrizBs={data?.comision_matriz_bs}
                    margenRetailBs={data?.margen_retail_bs}
                    loading={loading}
                    formatBs={formatBs}
                />

                {/* TARJETA 3: TICKET MEDIO (Pastel Esmeralda/Menta) */}
                <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100/80 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
                    <div className="flex justify-between items-start pb-3 border-b border-emerald-100/60">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block">Ticket Medio</span>
                            <span className="text-[10px] font-bold text-emerald-700/80">Promedio por venta</span>
                        </div>
                        <div className="p-2 bg-emerald-100/60 rounded-2xl text-emerald-600">
                            <Receipt size={18} />
                        </div>
                    </div>

                    <div className="my-3">
                        <h2 className="text-2xl lg:text-3xl font-black text-emerald-950 tracking-tight leading-none">
                            {loading ? '...' : formatBs(data?.ticket_medio)}
                        </h2>
                        <p className="text-[10px] font-bold text-emerald-700/80 mt-1">
                            Ingresos Totales / Órdenes
                        </p>
                    </div>

                    <button
                        onClick={() => setShowSucursalesModal(true)}
                        className="pt-2 border-t border-emerald-100/60 text-[11px] font-black text-emerald-700 hover:text-emerald-900 flex items-center justify-between w-full transition-colors group cursor-pointer"
                        title="Ver comparativa entre sucursales"
                    >
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Ver Promedios</span>
                        </span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* TARJETA 4: TOTAL DE ÓRDENES (Pastel Azul/Cian) */}
                <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white rounded-3xl p-5 shadow-xs border border-blue-100/80 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
                    <div className="flex justify-between items-start pb-3 border-b border-blue-100/60">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-blue-950 block">Total de Órdenes</span>
                            <span className="text-[10px] font-bold text-blue-700/80">Tickets válidos POS</span>
                        </div>
                        <div className="p-2 bg-blue-100/60 rounded-2xl text-blue-600">
                            <ShoppingBag size={18} />
                        </div>
                    </div>

                    <div className="my-3">
                        <h2 className="text-2xl lg:text-3xl font-black text-blue-950 tracking-tight leading-none">
                            {loading ? '...' : data?.cantidad_ordenes || 0}
                        </h2>
                        <p className="text-[10px] font-bold text-blue-700/80 mt-1">
                            Excluye tickets anulados
                        </p>
                    </div>

                    <button
                        onClick={() => setShowSucursalesModal(true)}
                        className="pt-2 border-t border-blue-100/60 text-[11px] font-black text-blue-700 hover:text-blue-900 flex items-center justify-between w-full transition-colors group cursor-pointer"
                        title="Ver órdenes por sucursal"
                    >
                        <span className="flex items-center gap-1.5">
                            <Layers size={13} className="text-blue-600" />
                            <span>Órdenes Sucursales</span>
                        </span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* TARJETA 5: RENTABILIDAD CONTABLE (Pastel Violeta/Rosa) */}
                <RentabilidadContableCard
                    rentabilidadPct={data?.rentabilidad_contable_pct}
                    loading={loading}
                    onOpenModal={() => setShowSucursalesModal(true)}
                />

            </div>

            {/* LAYOUT PRINCIPAL INSPIRADO EN LA IMAGEN DE REFERENCIA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMNA IZQUIERDA Y CENTRO (2 TÉRCIOS): HISTOGRAMA Y ACTIVIDAD RECIENTE */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* CURVA HORARIA DE VENTAS (ESTILO SECCIÓN BALANCE DE LA IMAGEN DE REFERENCIA) */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-slate-900">Ventas por Rango Horario</h3>
                                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                                        America/La_Paz
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">
                                    Distribución de ingresos por hora del día (00:00 a 23:59)
                                </p>
                            </div>
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <Clock size={20} />
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-bold">
                                Cargando distribución horaria...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                                {data?.ventas_por_hora.map((item) => (
                                    <div
                                        key={item.hora}
                                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                                            item.ordenes > 0
                                                ? 'bg-gradient-to-b from-indigo-50/90 to-purple-50/50 border-indigo-200/80 text-indigo-950 shadow-2xs font-bold'
                                                : 'bg-slate-50/60 border-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                                            {item.hora}:00
                                        </span>
                                        <span className="text-xs font-extrabold block my-1">
                                            {item.ingresos > 0 ? formatBs(item.ingresos) : 'Bs. 0'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-indigo-600 block bg-white/70 py-0.5 rounded-md mt-1">
                                            {item.ordenes} ord.
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN E: ACTIVIDAD RECIENTE / HISTORIAL DE VENTAS */}
                    {data?.ventas_recientes && data.ventas_recientes.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Actividad Reciente</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                                        Últimas ventas procesadas en vivo por el POS
                                    </p>
                                </div>
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <Activity size={20} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {data.ventas_recientes.map((v) => (
                                    <div
                                        key={v.ticket_id}
                                        className="p-4 bg-slate-50/70 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-3 bg-indigo-100/70 text-indigo-700 rounded-2xl shadow-2xs">
                                                <Receipt size={18} />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-slate-900 text-sm block">
                                                    Ticket #{v.numero_ticket}
                                                </span>
                                                <span className="text-xs text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                                                    <span>{v.nombre_sucursal}</span>
                                                    <span>•</span>
                                                    <span className="font-mono text-indigo-600">{v.hora_bolivia}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                            <div className="text-right">
                                                <span className="text-base font-black text-slate-900 block">
                                                    {formatBs(v.total_neto)}
                                                </span>
                                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                    {v.estado_pago}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA (1 TERCIO): SIDEBAR DESTACADO */}
                <div className="space-y-6">

                    {/* TARJETA DESTACADA EN GRADIENTE ELEGANTE */}
                    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 shadow-md border border-white/10 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-indigo-300 block">Estado de Red & POS</span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Aislamiento por Tenant</span>
                            </div>
                            <div className="p-2 bg-white/10 backdrop-blur rounded-2xl border border-white/10 text-emerald-400">
                                <Sparkles size={20} />
                            </div>
                        </div>

                        <div className="my-6">
                            <span className="text-xs text-slate-400 font-bold block uppercase">Sucursal Líder del Período</span>
                            <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                                <Award size={22} className="text-amber-400" />
                                {data?.resumen_operativo?.sucursal_lider || 'Cargando...'}
                            </h2>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-bold text-slate-300">
                            <span>Promedio por Hora:</span>
                            <span className="text-emerald-400 font-black">{formatBs(data?.resumen_operativo?.promedio_por_hora)}</span>
                        </div>
                    </div>

                    {/* DESGLOSE POR SUCURSAL */}
                    {data?.desglose_sucursales && data.desglose_sucursales.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900">Ventas por Sucursal</h3>
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                                    {data.desglose_sucursales.length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {data.desglose_sucursales.map((suc) => (
                                    <div
                                        key={suc.sucursal_id}
                                        className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all hover:bg-indigo-50/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-100/70 text-purple-700 rounded-2xl">
                                                <Store size={16} />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-slate-900 text-xs block">
                                                    {suc.nombre_sucursal}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {suc.ordenes} órdenes ({suc.participacion_pct}%)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs font-black text-slate-900 block">
                                                {formatBs(suc.ingresos)}
                                            </span>
                                            <span className="text-[10px] text-emerald-700 font-extrabold block">
                                                TM: {formatBs(suc.ticket_medio)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN H: ALERTAS OPERATIVAS */}
                    {data?.alertas_operativas && data.alertas_operativas.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900">Alertas Operativas</h3>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Bell size={18} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {data.alertas_operativas.map((a, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3.5 bg-indigo-50/70 border border-indigo-100/80 rounded-2xl flex items-start gap-3 text-xs"
                                    >
                                        <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-2xs mt-0.5">
                                            <Bell size={14} />
                                        </div>
                                        <div>
                                            <span className="font-black text-indigo-950 block text-xs">{a.titulo}</span>
                                            <span className="text-indigo-800 text-[11px] font-semibold mt-0.5 block">{a.mensaje}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PIE DE PÁGINA DE AUDITORÍA Y TRAZABILIDAD SEGURA BI */}
                    <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-500 gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Estado BI: <strong className="text-slate-800">{data?.estado_sincronizacion || 'Conectado'}</strong></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span>Timezone: <strong className="text-indigo-700">{data?.timezone || 'America/La_Paz'}</strong></span>
                            <span>Última Actualización: <strong className="text-slate-800">{data?.ultima_actualizacion || '--:--'}</strong></span>
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL INTERACTIVO: DESGLOSE DE VENTAS POR SUCURSAL */}
            {showSucursalesModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
                        {/* Cabecera del Modal */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-xs">
                                    <Store size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Desglose de Ventas por Sucursales</h3>
                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                        Período consultado: <span className="text-indigo-600 font-bold">{startDate} a {endDate}</span> (America/La_Paz)
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSucursalesModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                                title="Cerrar ventana"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tarjetas Resumen Global */}
                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Venta Neta POS</span>
                                <span className="text-lg font-black text-indigo-950 block">{formatBs(data?.ingresos_totales)}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Total Órdenes</span>
                                <span className="text-lg font-black text-slate-900 block">{data?.cantidad_ordenes || 0} tickets</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Ticket Medio Global</span>
                                <span className="text-lg font-black text-emerald-700 block">{formatBs(data?.ticket_medio)}</span>
                            </div>
                        </div>

                        {/* Lista / Tabla de Desglose por Sucursales */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Distribución por Punto de Venta</h4>
                            
                            {(!data?.desglose_sucursales || data.desglose_sucursales.length === 0) ? (
                                <div className="p-6 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
                                    No se registraron ventas en las sucursales para el período seleccionado.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {data.desglose_sucursales.map((suc) => (
                                        <div
                                            key={suc.sucursal_id}
                                            className="p-4 bg-slate-50/80 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/70 transition-all space-y-2"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                                                        <Store size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 text-sm block">
                                                            {suc.nombre_sucursal}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-semibold">
                                                            {suc.ordenes} órdenes • Ticket Medio: <strong className="text-emerald-700">{formatBs(suc.ticket_medio)}</strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right flex items-center gap-4">
                                                    <div>
                                                        <span className="text-base font-black text-slate-900 block">
                                                            {formatBs(suc.ingresos)}
                                                        </span>
                                                        <span className="text-xs font-black text-indigo-600 block">
                                                            {suc.participacion_pct}% del total
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedSucursal(suc.sucursal_id);
                                                            setShowSucursalesModal(false);
                                                        }}
                                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer"
                                                        title={`Filtrar vista exclusivamente por ${suc.nombre_sucursal}`}
                                                    >
                                                        Filtrar sucursal
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Barra de progreso de participación */}
                                            <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, Math.max(0, suc.participacion_pct))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botón de cierre */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowSucursalesModal(false)}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl transition-all shadow-xs cursor-pointer"
                            >
                                Entendido / Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
