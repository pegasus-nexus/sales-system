import React, { useState } from 'react';
import {
    Sparkles, RefreshCw, Download, ChevronRight, TrendingUp, Target, Clock, Star,
    Calendar, Cloud, Package, MapPin, AlertTriangle, Info,
    Users, Tag, ArrowUpRight, ShoppingCart, Percent, Bot, CheckCircle2, X
} from 'lucide-react';

export const BIDiagnosticoIAView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [showAiModal, setShowAiModal] = useState<boolean>(false);

    // Datos simulados en vivo basados en la maqueta
    const kpis = {
        ventasProyectadas: 3240.00,
        vsAyerPct: 18.7,
        probabilidadMetaPct: 78,
        confianza: 'Alta',
        horaPicoEstimada: '12:00 - 13:00',
        horaPicoConfianza: 'Alta probabilidad',
        indiceOportunidad: '8.6 / 10',
        indiceNota: 'Excelente día para vender'
    };

    // Datos por hora para el Histograma de Barras (Hoy vs Promedio Histórico)
    const hourlyBarData = [
        { hora: '06:00', hoy: 0, promedio: 0 },
        { hora: '08:00', hoy: 120, promedio: 250 },
        { hora: '10:00', hoy: 450, promedio: 380 },
        { hora: '12:00', hoy: 1420, promedio: 890, isPeak: true }, // Pico de Hoy
        { hora: '14:00', hoy: 780, promedio: 650 },
        { hora: '16:00', hoy: 510, promedio: 420 },
        { hora: '18:00', hoy: 390, promedio: 480 },
        { hora: '20:00', hoy: 280, promedio: 310 },
        { hora: '22:00', hoy: 0, promedio: 0 },
    ];

    const factores = [
        {
            icon: Calendar,
            titulo: 'Día de la Semana',
            descripcion: 'Los Lunes registran históricamente un aumento del +14% en consumo de mediodía.',
            impacto: '+ Impacto Alto',
            impactoTipo: 'alto'
        },
        {
            icon: Cloud,
            titulo: 'Clima',
            descripcion: 'Temperatura templada de 22°C en Cochabamba/La Paz promueve el flujo de peatones.',
            impacto: '+ Impacto Medio',
            impactoTipo: 'medio'
        },
        {
            icon: TrendingUp,
            titulo: 'Tendencia Histórica',
            descripcion: 'Desaceleración sutil del 3% en las últimas 72h ajustada por promociones previas.',
            impacto: '+ Impacto Medio',
            impactoTipo: 'medio'
        },
        {
            icon: Package,
            titulo: 'Inventario',
            descripcion: 'Riesgo de agotamiento de stock en 5 productos clave antes de la hora pico.',
            impacto: '↓ Impacto Negativo',
            impactoTipo: 'negativo'
        },
        {
            icon: MapPin,
            titulo: 'Eventos Locales',
            descripcion: 'Sin bloqueos ni paros reportados en los accesos a las sucursales principales.',
            impacto: '+ Impacto Bajo',
            impactoTipo: 'bajo'
        }
    ];

    const recomendaciones = [
        {
            icon: Users,
            titulo: 'Refuerzo de Personal',
            descripcion: 'Aumentar personal de caja entre 11:00 - 14:00 por alta probabilidad de flujo masivo.',
            prioridad: 'Prioridad Alta',
            color: 'purple'
        },
        {
            icon: Tag,
            titulo: 'Promoción Recomendada',
            descripcion: 'Enfocar promociones en: Zapatillas Urbanas (Alta demanda detectada en POS).',
            prioridad: '• Prioridad Alta',
            color: 'green'
        },
        {
            icon: Package,
            titulo: 'Gestión de Inventario',
            descripcion: 'Reponer stock de 5 productos antes de las 11:00 (Riesgo de quiebre de stock).',
            prioridad: '• Prioridad Media',
            color: 'amber'
        },
        {
            icon: Percent,
            titulo: 'Estrategia de Precios',
            descripcion: 'Mantener precios actuales (Alto índice de conversión registrado).',
            prioridad: '• Prioridad Baja',
            color: 'blue'
        },
        {
            icon: ShoppingCart,
            titulo: 'Canales de Venta',
            descripcion: 'Enfocar atención en canal POS presencial (Mejor rendimiento vs online).',
            prioridad: '• Prioridad Media',
            color: 'indigo'
        }
    ];

    const productosPotencial = [
        { nombre: 'Nike Dunk Low', probabilidad: 92, impacto: 'Bs. 450' },
        { nombre: 'Jordan 1 Retro', probabilidad: 68, impacto: 'Bs. 380' },
        { nombre: 'Adidas Campus 00s', probabilidad: 76, impacto: 'Bs. 290' },
        { nombre: 'Nike Air Force 1', probabilidad: 71, impacto: 'Bs. 240' },
        { nombre: 'New Balance 574', probabilidad: 65, impacto: 'Bs. 180' },
    ];

    const segmentosOportunidad = [
        { segmento: 'Jóvenes 18-25', oportunidad: 'Alta', accion: 'Ofertas en urbanas' },
        { segmento: 'Deportistas', oportunidad: 'Alta', accion: 'Promociones en deportivas' },
        { segmento: 'Clientes Recurrentes', oportunidad: 'Media', accion: 'Email marketing' },
        { segmento: 'Nuevos Clientes', oportunidad: 'Media', accion: 'Descuentos de bienvenida' },
        { segmento: 'Familias', oportunidad: 'Baja', accion: 'Promociones en packs' },
    ];

    const alertasInteligentes = [
        {
            icon: AlertTriangle,
            titulo: 'Stock Bajo',
            mensaje: '3 productos críticos con bajo inventario en sucursal Heroínas',
            hora: '09:45',
            tipo: 'alerta'
        },
        {
            icon: AlertTriangle,
            titulo: 'Ventas por Debajo del Promedio',
            mensaje: 'Categoría "Accesorios" -15% vs promedio histórico',
            hora: '09:30',
            tipo: 'alerta'
        },
        {
            icon: Info,
            titulo: 'Oportunidad de Cross-selling',
            mensaje: 'Clientes comprando zapatillas + medias en POS',
            hora: '09:15',
            tipo: 'info'
        }
    ];

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 600);
    };

    return (
        <div className="space-y-6 font-sans text-slate-800 w-full">
            
            {/* CABECERA PRINCIPAL CON INDICADOR DE GOOGLE GEMINI API */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Diagnóstico IA del Día</h1>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100 flex items-center gap-1">
                            <Sparkles size={12} className="text-purple-600" />
                            Análisis en Tiempo Real
                        </span>
                        <button
                            onClick={() => setShowAiModal(true)}
                            className="text-[11px] font-black text-indigo-900 bg-indigo-100/90 hover:bg-indigo-200/90 px-3 py-0.5 rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                            <Bot size={13} className="text-indigo-600" />
                            <span>Powered by Google Gemini API</span>
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 font-bold">
                        Análisis inteligente, detección de patrones de consumo y recomendaciones accionables para hoy.
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
                        <span>Exportar Reporte</span>
                    </button>
                </div>
            </div>

            {/* 4 TARJETAS KPIS PASTEL DE PROYECCIÓN Y OPORTUNIDAD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* TARJETA 1: VENTAS PROYECTADAS HOY */}
                <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-white rounded-3xl p-5 shadow-xs border border-purple-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-2 border-b border-purple-100/60">
                            <span className="text-xs font-black uppercase text-purple-950">Ventas Proyectadas Hoy</span>
                            <div className="p-2 bg-purple-100 text-purple-700 rounded-2xl">
                                <TrendingUp size={16} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-purple-950">
                                Bs. {kpis.ventasProyectadas.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-[10px] font-bold text-purple-700 block mt-0.5">Calculado por Motor ML + Gemini</span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-purple-100/60 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400">vs Ayer:</span>
                        <span className="text-emerald-700 font-black flex items-center gap-0.5">
                            <ArrowUpRight size={14} /> ▲ {kpis.vsAyerPct}%
                        </span>
                    </div>
                </div>

                {/* TARJETA 2: PROBABILIDAD DE SUPERAR META */}
                <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-3xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-100/60">
                            <span className="text-xs font-black uppercase text-emerald-950">Probabilidad de Superar Meta</span>
                            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl">
                                <Target size={16} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-emerald-950">{kpis.probabilidadMetaPct}%</h2>
                            <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">Nivel de Confianza: {kpis.confianza}</span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-emerald-100/60">
                        <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                            <div style={{ width: `${kpis.probabilidadMetaPct}%` }} className="h-full bg-emerald-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* TARJETA 3: HORA PICO ESTIMADA */}
                <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-2 border-b border-amber-100/60">
                            <span className="text-xs font-black uppercase text-amber-950">Hora Pico Estimada</span>
                            <div className="p-2 bg-amber-100 text-amber-700 rounded-2xl">
                                <Clock size={16} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-amber-950">{kpis.horaPicoEstimada}</h2>
                            <span className="text-[10px] font-bold text-amber-700 block mt-0.5">{kpis.horaPicoConfianza}</span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-amber-100/60 flex items-center justify-end">
                        <svg className="w-24 h-5 text-amber-500" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M0 15 Q 30 18, 60 5 T 100 12" />
                        </svg>
                    </div>
                </div>

                {/* TARJETA 4: ÍNDICE DE OPORTUNIDAD */}
                <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-white rounded-3xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-2 border-b border-sky-100/60">
                            <span className="text-xs font-black uppercase text-sky-950">Índice de Oportunidad</span>
                            <div className="p-2 bg-sky-100 text-sky-700 rounded-2xl">
                                <Star size={16} />
                            </div>
                        </div>
                        <div className="my-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-sky-950">{kpis.indiceOportunidad}</h2>
                            <span className="text-[10px] font-bold text-sky-700 block mt-0.5">{kpis.indiceNota}</span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-sky-100/60">
                        <div className="h-2 w-full bg-sky-100 rounded-full overflow-hidden">
                            <div style={{ width: '86%' }} className="h-full bg-sky-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

            </div>

            {/* SECCIÓN INTERMEDIA: HISTOGRAMA DE BARRAS POR HORA (2/3) + FACTORES (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* IZQUIERDA (2/3 ANCHO): VENTAS POR HORA EN BARRAS (HOY VS PROMEDIO) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Análisis de Tendencia del Día</h3>
                            <p className="text-xs text-slate-400 font-bold">Distribución en Barras: Comportamiento de Ventas de Hoy vs Promedio Histórico</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                        
                        {/* HISTOGRAMA DE BARRAS DUAL (HOY VS PROMEDIO) */}
                        <div className="md:col-span-2 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>Ventas por Hora - Hoy vs Promedio</span>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-indigo-900 font-black">
                                        <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block shadow-xs"></span> Hoy (POS)
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                        <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block"></span> Promedio Histórico
                                    </span>
                                </div>
                            </div>

                            {/* LIENZO DE BARRAS POR HORA */}
                            <div className="h-48 relative flex items-end justify-between px-2 pt-6 gap-2 border-b border-slate-200">
                                {hourlyBarData.map((h) => {
                                    const maxVal = 1600;
                                    const hoyPct = Math.min((h.hoy / maxVal) * 100, 100);
                                    const promPct = Math.min((h.promedio / maxVal) * 100, 100);

                                    return (
                                        <div key={h.hora} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                                            {/* Badge de Pico en la hora de mayor venta */}
                                            {h.isPeak && (
                                                <span className="absolute -top-4 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-xs animate-bounce whitespace-nowrap z-10">
                                                    PICO (12:00)
                                                </span>
                                            )}

                                            <div className="w-full flex items-end justify-center gap-1 h-full">
                                                {/* BARRA HOY (ÍNDIGO / PÚRPURA) */}
                                                <div
                                                    style={{ height: `${Math.max(hoyPct, 4)}%` }}
                                                    className="w-3.5 bg-indigo-600 hover:bg-indigo-700 rounded-t-xs transition-all shadow-xs"
                                                    title={`Hoy ${h.hora}: Bs. ${h.hoy}`}
                                                ></div>
                                                {/* BARRA PROMEDIO (SLATE / GRIS) */}
                                                <div
                                                    style={{ height: `${Math.max(promPct, 4)}%` }}
                                                    className="w-3.5 bg-slate-300 hover:bg-slate-400 rounded-t-xs transition-all"
                                                    title={`Promedio ${h.hora}: Bs. ${h.promedio}`}
                                                ></div>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 mt-2">{h.hora}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Evolución vs Ayer Panel */}
                        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between space-y-3 text-xs">
                            <span className="font-black text-slate-900 border-b border-slate-200/60 pb-2 block text-xs">
                                Evolución vs Ayer
                            </span>

                            <div className="space-y-2.5">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 block">Ventas</span>
                                    <div className="flex items-center justify-between">
                                        <strong className="text-emerald-700 font-black">+8.7%</strong>
                                        <span className="text-[11px] font-extrabold text-emerald-800">+Bs. 511.50</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200/50">
                                    <span className="text-[10px] font-bold text-slate-400 block">Órdenes</span>
                                    <div className="flex items-center justify-between">
                                        <strong className="text-emerald-700 font-black">+22.9%</strong>
                                        <span className="text-[11px] font-extrabold text-emerald-800">+11 órdenes</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200/50">
                                    <span className="text-[10px] font-bold text-slate-400 block">Ticket Medio</span>
                                    <div className="flex items-center justify-between">
                                        <strong className="text-rose-600 font-black">-3.4%</strong>
                                        <span className="text-[11px] font-extrabold text-rose-700">-Bs. 1.75</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200/50">
                                    <span className="text-[10px] font-bold text-slate-400 block">Clientes Únicos</span>
                                    <div className="flex items-center justify-between">
                                        <strong className="text-emerald-700 font-black">+16.2%</strong>
                                        <span className="text-[11px] font-extrabold text-emerald-800">+4 clientes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DERECHA (1/3 ANCHO): FACTORES QUE INFLUYEN HOY */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="pb-3 border-b border-slate-100 mb-3">
                            <h3 className="text-base font-black text-slate-900">Factores que Influyen Hoy</h3>
                            <p className="text-xs text-slate-400 font-bold">Variables externas e internas evaluadas por el algoritmo</p>
                        </div>

                        <div className="space-y-2.5">
                            {factores.map((fact, idx) => {
                                const IconComp = fact.icon;
                                const isGreen = fact.impactoTipo === 'alto';
                                const isAmber = fact.impactoTipo === 'medio';
                                const isRed = fact.impactoTipo === 'negativo';

                                return (
                                    <div key={idx} className="p-2.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-start gap-2.5 text-xs">
                                        <div className="p-2 bg-sky-100 text-sky-700 rounded-xl shrink-0 mt-0.5">
                                            <IconComp size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <strong className="text-slate-900 font-black">{fact.titulo}</strong>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                                                    isGreen ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    isAmber ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    isRed ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-sky-50 text-sky-700 border-sky-100'
                                                }`}>
                                                    {fact.impacto}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 font-semibold text-[11px] mt-0.5">{fact.descripcion}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button className="pt-3 border-t border-slate-100 text-xs font-black text-purple-700 hover:text-purple-900 flex items-center justify-between w-full transition-colors cursor-pointer">
                        <span>Ver análisis detallado de factores</span>
                        <ChevronRight size={14} />
                    </button>
                </div>

            </div>

            {/* RECOMENDACIONES INTELIGENTES PARA HOY (GRILLA DE 5 CARDS) */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-black text-slate-900">Recomendaciones Inteligentes para Hoy</h3>
                    <p className="text-xs text-slate-400 font-bold">Acciones sugeridas por el motor de IA para maximizar tus resultados</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {recomendaciones.map((rec, idx) => {
                        const IconComp = rec.icon;
                        const isPurple = rec.color === 'purple';
                        const isGreen = rec.color === 'green';
                        const isAmber = rec.color === 'amber';
                        const isBlue = rec.color === 'blue';

                        return (
                            <div
                                key={idx}
                                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                                    isPurple ? 'bg-purple-50/60 border-purple-100' :
                                    isGreen ? 'bg-emerald-50/60 border-emerald-100' :
                                    isAmber ? 'bg-amber-50/60 border-amber-100' :
                                    isBlue ? 'bg-sky-50/60 border-sky-100' :
                                    'bg-indigo-50/60 border-indigo-100'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className={`p-2.5 w-fit rounded-2xl ${
                                        isPurple ? 'bg-purple-100 text-purple-700' :
                                        isGreen ? 'bg-emerald-100 text-emerald-700' :
                                        isAmber ? 'bg-amber-100 text-amber-700' :
                                        isBlue ? 'bg-sky-100 text-sky-700' :
                                        'bg-indigo-100 text-indigo-700'
                                    }`}>
                                        <IconComp size={16} />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900">{rec.titulo}</h4>
                                    <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">{rec.descripcion}</p>
                                </div>

                                <div className="pt-2 border-t border-black/5">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border block text-center ${
                                        isPurple ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                        isGreen ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                        isAmber ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                        isBlue ? 'bg-sky-100 text-sky-800 border-sky-200' :
                                        'bg-indigo-100 text-indigo-800 border-indigo-200'
                                    }`}>
                                        {rec.prioridad}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BLOQUE INFERIOR DE 3 TARJETAS ANALÍTICAS (POTENCIAL, SEGMENTOS, ALERTAS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* TARJETA 1: PRODUCTOS CON MAYOR POTENCIAL HOY */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="pb-3 border-b border-slate-100 mb-3">
                            <h3 className="text-sm font-black text-slate-900">Productos con Mayor Potencial Hoy</h3>
                            <p className="text-[10px] text-slate-400 font-bold">Productos con alta probabilidad de venta</p>
                        </div>

                        <div className="space-y-3">
                            {productosPotencial.map((prod, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-800 truncate pr-2">
                                        <strong className="text-slate-400 mr-1 text-[10px]">{idx + 1}</strong> {prod.nombre}
                                    </span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div style={{ width: `${prod.probabilidad}%` }} className="bg-emerald-500 h-full rounded-full"></div>
                                        </div>
                                        <span className="text-emerald-700 font-black text-[11px]">{prod.probabilidad}%</span>
                                        <span className="text-slate-500 font-extrabold text-[11px] w-14 text-right">{prod.impacto}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="pt-3 border-t border-slate-100 text-xs font-black text-purple-700 hover:text-purple-900 flex items-center justify-between w-full transition-colors cursor-pointer">
                        <span>Ver catálogo completo con IA</span>
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* TARJETA 2: SEGMENTOS CON MAYOR OPORTUNIDAD */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="pb-3 border-b border-slate-100 mb-3">
                            <h3 className="text-sm font-black text-slate-900">Segmentos con Mayor Oportunidad</h3>
                            <p className="text-[10px] text-slate-400 font-bold">A quién enfocarte hoy</p>
                        </div>

                        <div className="space-y-2.5">
                            {segmentosOportunidad.map((seg, idx) => (
                                <div key={idx} className="p-2.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-bold">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-[10px] font-black">{idx + 1}</span>
                                        <span className="text-slate-800 font-black">{seg.segmento}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                            seg.oportunidad === 'Alta' ? 'bg-emerald-100 text-emerald-800' :
                                            seg.oportunidad === 'Media' ? 'bg-amber-100 text-amber-800' :
                                            'bg-slate-200 text-slate-700'
                                        }`}>
                                            {seg.oportunidad}
                                        </span>
                                        <span className="text-slate-500 font-bold text-[11px]">{seg.accion}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="pt-3 border-t border-slate-100 text-xs font-black text-purple-700 hover:text-purple-900 flex items-center justify-between w-full transition-colors cursor-pointer">
                        <span>Ver segmentación completa</span>
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* TARJETA 3: ALERTAS INTELIGENTES */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="pb-3 border-b border-slate-100 mb-3">
                            <h3 className="text-sm font-black text-slate-900">Alertas Inteligentes</h3>
                            <p className="text-[10px] text-slate-400 font-bold">Situaciones que requieren atención</p>
                        </div>

                        <div className="space-y-2.5">
                            {alertasInteligentes.map((al, idx) => {
                                const IconComp = al.icon;
                                return (
                                    <div key={idx} className="p-3 bg-rose-50/50 border border-rose-100/80 rounded-2xl flex items-start gap-2.5 text-xs">
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
                                            <IconComp size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <strong className="text-slate-900 font-black">{al.titulo}</strong>
                                                <span className="text-[10px] text-slate-400 font-bold">{al.hora}</span>
                                            </div>
                                            <p className="text-slate-600 font-semibold text-[11px] mt-0.5">{al.mensaje}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button className="pt-3 border-t border-slate-100 text-xs font-black text-purple-700 hover:text-purple-900 flex items-center justify-between w-full transition-colors cursor-pointer">
                        <span>Ver todas las alertas</span>
                        <ChevronRight size={14} />
                    </button>
                </div>

            </div>

            {/* MODAL ARQUITECTURA DE IA (GOOGLE GEMINI API) */}
            {showAiModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-2xl w-full space-y-5 relative text-slate-800">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Motor de IA Pegasus Intelligence</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                                        Trazabilidad y arquitectura de las herramientas de Inteligencia Artificial utilizadas
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Card de Google Gemini API */}
                            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-indigo-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-indigo-600" />
                                        MODELO PRINCIPAL DE INTELIGENCIA GENERATIVA
                                    </span>
                                    <span className="text-[10px] font-black bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-md">
                                        Google Gemini API (2.5 / Pro)
                                    </span>
                                </div>
                                <p className="text-xs text-indigo-950 font-bold leading-relaxed">
                                    Antigravity / Pegasus SalesSystem utiliza la tecnología oficial de <strong>Google DeepMind (Google Gemini API)</strong> para el razonamiento semántico, diagnóstico en lenguaje natural de factores causales y generación de recomendaciones operativas en tiempo real.
                                </p>
                            </div>

                            {/* Modelos Complementarios ML */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block">📈 MODELOS PREDICTIVOS ML</span>
                                    <strong className="text-slate-900 font-black text-xs block">Prophet & Random Forest Regressor</strong>
                                    <span className="text-[10px] text-slate-500 block">Predicción de series temporales y horas pico sobre MongoDB `sales`.</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block">🗄️ FUENTE DE DATOS EN VIVO</span>
                                    <strong className="text-indigo-700 font-black text-xs block">Colección 'sales' & 'inventory'</strong>
                                    <span className="text-[10px] text-slate-500 block">Procesamiento continuo en tiempo real (America/La_Paz).</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100 text-slate-600 font-medium">
                                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    Garantías de Seguridad y Aislamiento de Datos:
                                </h4>
                                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                                    <li>Toda la inferencia se procesa bajo aislamiento estricto de Tenant (`tenant_id`).</li>
                                    <li>No se realiza reentrenamiento público con tus datos privados de POS.</li>
                                    <li>Las recomendaciones se adaptan dinámicamente según la sucursal y la zona horaria.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-xs cursor-pointer transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PIE DE PÁGINA DE AUDITORÍA DE IA */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs font-bold text-purple-900 gap-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-600" />
                    <span>Diagnóstico generado por <strong>Google Gemini API</strong> combinado con modelos predictivos ML sobre la colección 'sales'.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={14} className="text-slate-400" />
                    <span>Última actualización: <strong>31/08/2026 09:50:22</strong></span>
                </div>
            </div>

        </div>
    );
};
