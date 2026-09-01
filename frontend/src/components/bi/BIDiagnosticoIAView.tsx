import React, { useState } from 'react';
import {
    Sparkles, RefreshCw, Download, ChevronRight, TrendingUp, Target, Clock, Star,
    Calendar, Cloud, Package, MapPin, AlertTriangle, Info,
    Users, Tag, ArrowUpRight, ShoppingCart, Percent
} from 'lucide-react';

export const BIDiagnosticoIAView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);

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

    const factores = [
        {
            icon: Calendar,
            titulo: 'Día de la Semana',
            descripcion: 'Lunes con comportamiento histórico positivo',
            impacto: '+ Impacto Alto',
            impactoTipo: 'alto'
        },
        {
            icon: Cloud,
            titulo: 'Clima',
            descripcion: 'Temperatura agradable en tu zona',
            impacto: '+ Impacto Medio',
            impactoTipo: 'medio'
        },
        {
            icon: TrendingUp,
            titulo: 'Tendencia Histórica',
            descripcion: 'Patrón de ventas decreciente en los últimos 3 días',
            impacto: '+ Impacto Medio',
            impactoTipo: 'medio'
        },
        {
            icon: Package,
            titulo: 'Inventario',
            descripcion: 'Algunas categorías con stock bajo',
            impacto: '↓ Impacto Negativo',
            impactoTipo: 'negativo'
        },
        {
            icon: MapPin,
            titulo: 'Eventos Locales',
            descripcion: 'Sin eventos que afecten el consumo',
            impacto: '+ Impacto Bajo',
            impactoTipo: 'bajo'
        }
    ];

    const recomendaciones = [
        {
            icon: Users,
            titulo: 'Refuerzo de Personal',
            descripcion: 'Aumentar personal de caja entre 11:00 - 14:00 por alta probabilidad de flujo',
            prioridad: 'Prioridad Alta',
            color: 'purple'
        },
        {
            icon: Tag,
            titulo: 'Promoción Recomendada',
            descripcion: 'Enfocar promociones en: Zapatillas Urbanas (Alta demanda detectada)',
            prioridad: '• Prioridad Alta',
            color: 'green'
        },
        {
            icon: Package,
            titulo: 'Gestión de Inventario',
            descripcion: 'Reponer stock de 5 productos antes de las 11:00 (Riesgo de quiebre)',
            prioridad: '• Prioridad Media',
            color: 'amber'
        },
        {
            icon: Percent,
            titulo: 'Estrategia de Precios',
            descripcion: 'Mantener precios actuales (Alto índice de conversión)',
            prioridad: '• Prioridad Baja',
            color: 'blue'
        },
        {
            icon: ShoppingCart,
            titulo: 'Canales de Venta',
            descripcion: 'Enfocar en canal POS (Mejor rendimiento vs online)',
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
            mensaje: '3 productos críticos con bajo inventario',
            hora: '09:45',
            tipo: 'alerta'
        },
        {
            icon: AlertTriangle,
            titulo: 'Ventas por Debajo del Promedio',
            mensaje: 'Categoría "Accesorios" -15% vs promedio',
            hora: '09:30',
            tipo: 'alerta'
        },
        {
            icon: Info,
            titulo: 'Oportunidad de Cross-selling',
            mensaje: 'Clientes comprando zapatillas + medias',
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
            
            {/* CABECERA PRINCIPAL CON TITULO E INDICADORES DE IA */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Diagnóstico IA del Día</h1>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100 flex items-center gap-1">
                            <Sparkles size={12} className="text-purple-600" />
                            Análisis en Tiempo Real
                        </span>
                        <span className="text-[11px] font-extrabold text-purple-900 bg-purple-100/70 px-2.5 py-0.5 rounded-lg border border-purple-200/60">
                            📍 Zona: America/La_Paz
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold">
                        Análisis inteligente, detección de patrones y recomendaciones accionables para hoy
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
                            <span className="text-[10px] font-bold text-purple-700 block mt-0.5">Proyección IA</span>
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
                            <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">Confianza {kpis.confianza}</span>
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

            {/* SECCIÓN INTERMEDIA: ANÁLISIS DE TENDENCIA (2/3) + FACTORES (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* IZQUIERDA (2/3 ANCHO): ANÁLISIS DE TENDENCIA DEL DÍA */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Análisis de Tendencia del Día</h3>
                            <p className="text-xs text-slate-400 font-bold">Comparación del comportamiento actual vs patrón histórico</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                        {/* Gráfico dual simulado */}
                        <div className="md:col-span-2 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>Ventas por Hora - Hoy vs Promedio</span>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 text-purple-700 font-black">
                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span> Hoy
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-400 font-bold">
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Promedio
                                    </span>
                                </div>
                            </div>

                            <div className="h-44 relative flex items-end justify-between px-2 pt-6">
                                <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs animate-pulse">
                                    HOY (PICO)
                                </span>
                                <svg className="w-full h-full text-purple-600" viewBox="0 0 300 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M0 85 C 30 75, 60 40, 90 45 C 120 50, 150 10, 180 60 C 210 50, 240 30, 270 65 L 300 70" />
                                    <path d="M0 90 C 30 85, 60 60, 90 65 C 120 70, 150 45, 180 75 C 210 65, 240 55, 270 80 L 300 85" stroke="#CBD5E1" strokeDasharray="4 4" />
                                </svg>
                            </div>

                            <div className="flex justify-between text-[9px] font-extrabold text-slate-400 pt-1 border-t border-slate-200/60">
                                <span>06:00</span>
                                <span>08:00</span>
                                <span>10:00</span>
                                <span>12:00</span>
                                <span>14:00</span>
                                <span>16:00</span>
                                <span>18:00</span>
                                <span>20:00</span>
                                <span>22:00</span>
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
                            <p className="text-xs text-slate-400 font-bold">Variables externas e internas que impactan tus ventas</p>
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
                    <p className="text-xs text-slate-400 font-bold">Acciones sugeridas por IA para maximizar tus resultados</p>
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

            {/* PIE DE PÁGINA DE AUDITORÍA DE IA */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs font-bold text-purple-900 gap-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-600" />
                    <span>Análisis generado con IA basado en datos históricos, patrones de comportamiento y factores externos en tiempo real.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={14} className="text-slate-400" />
                    <span>Última actualización: <strong>31/08/2026 09:50:22</strong></span>
                </div>
            </div>

        </div>
    );
};
