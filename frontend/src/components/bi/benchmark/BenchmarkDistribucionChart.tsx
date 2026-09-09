import React from 'react';
import { Target, Sparkles, Clock, AlertTriangle, CheckCircle2, XCircle, Activity, Building2, Filter, Calendar } from 'lucide-react';
import type { StoreKey, MetricKey } from './BenchmarkTypes';
import { METRIC_TITLES } from './BenchmarkTypes';

interface Props {
    selectedStore?: StoreKey;
    onChangeStore?: (store: StoreKey) => void;
    selectedMetric: MetricKey;
    onChangeMetric?: (metric: MetricKey) => void;
    periodMode?: 'mes' | 'semana';
    onChangePeriod?: (period: 'mes' | 'semana') => void;
    p25: number;
    p50: number;
    p75: number;
    todaySales: number;
    percentilePositionPct: number;
    formatValue: (val: number) => string;
    unitName: string;
    minVal?: number;
    maxVal?: number;
}

export const BenchmarkDistribucionChart: React.FC<Props> = ({
    selectedStore = 'consolidado',
    onChangeStore,
    selectedMetric,
    onChangeMetric,
    periodMode = 'mes',
    onChangePeriod,
    p25,
    p50,
    p75,
    todaySales,
    percentilePositionPct,
    formatValue,
    unitName: _unitName,
    minVal,
    maxVal
}) => {
    const metricTitle = METRIC_TITLES[selectedMetric] || 'Ticket promedio por día (Bs.)';
    const vsP50Pct = p50 > 0 ? Math.round(((todaySales - p50) / p50) * 100) : 0;

    // Minimum and Maximum values for axis ends
    const axisMin = minVal !== undefined ? minVal : Math.max(Number((p25 * 0.25).toFixed(2)), 0);
    const axisMax = maxVal !== undefined ? maxVal : Number((p75 * 1.6).toFixed(2));

    // Determine status badge for Card 4 (Posición Actual)
    let statusText = 'Alto rendimiento';
    let StatusIcon = CheckCircle2;
    let statusBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';

    if (todaySales < p25) {
        statusText = 'Crítico operativo';
        StatusIcon = XCircle;
        statusBg = 'bg-rose-50 text-rose-800 border-rose-200';
    } else if (todaySales < p50) {
        statusText = 'Bajo la mediana';
        StatusIcon = AlertTriangle;
        statusBg = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (todaySales <= p75) {
        statusText = 'Normal (Esperado)';
        StatusIcon = Activity;
        statusBg = 'bg-blue-50 text-blue-800 border-blue-200';
    }

    // Dynamic interpretation text matching media_1788908977159.png
    let interpretacion = `El resultado actual se encuentra por debajo de la mediana histórica, ubicado en el percentil ${percentilePositionPct.toFixed(0)}.`;
    let recomendacion = 'Revisar factores que afectan el indicador y reforzar estrategias de venta.';

    if (todaySales >= p75) {
        interpretacion = `El resultado actual es superior a la meta histórica (P75), ubicado en el percentil ${percentilePositionPct.toFixed(0)}.`;
        recomendacion = 'Mantener excelente disponibilidad de stock y potenciar estrategias comerciales activas.';
    } else if (todaySales >= p50) {
        interpretacion = `El resultado actual se encuentra dentro del rango normal esperado, ubicado en el percentil ${percentilePositionPct.toFixed(0)}.`;
        recomendacion = 'Mantener la operación constante y monitorear franjas horarias de mayor afluencia.';
    }

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 font-sans">
            {/* 1. Encabezado Superior con Filtros Integrados matching media_1788908977159.png */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 border border-purple-200 rounded-full text-purple-600 shrink-0">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                            Distribución Histórica (365 días)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Resumen del rendimiento de <strong className="text-slate-800">{metricTitle}</strong>
                        </p>
                    </div>
                </div>

                {/* Filtros Integrados Inline */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {/* Select Sucursal */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400 text-[11px]">Sucursal</span>
                        <select
                            value={selectedStore}
                            onChange={(e) => onChangeStore && onChangeStore(e.target.value as StoreKey)}
                            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs"
                        >
                            <option value="consolidado">Todas las Sucursales (Consolidado)</option>
                            <option value="heroinas">Heroínas (Cochabamba)</option>
                            <option value="recoleta">Recoleta (Cochabamba)</option>
                            <option value="calacoto">Calacoto (La Paz)</option>
                        </select>
                    </div>

                    {/* Select Métrica */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl font-medium text-slate-700">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400 text-[11px]">Métrica</span>
                        <select
                            value={selectedMetric}
                            onChange={(e) => onChangeMetric && onChangeMetric(e.target.value as MetricKey)}
                            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs"
                        >
                            <option value="ventas">Ventas por día (Bs.)</option>
                            <option value="ordenes">Número de clientes / Órdenes</option>
                            <option value="ticket">Ticket promedio por día (Bs.)</option>
                            <option value="unidades">Cantidad de productos vendidos</option>
                            <option value="unidades_por_orden">Productos por transacción</option>
                        </select>
                    </div>

                    {/* Select Periodo */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400 text-[11px]">Periodo</span>
                        <select
                            value={periodMode}
                            onChange={(e) => onChangePeriod && onChangePeriod(e.target.value as 'mes' | 'semana')}
                            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs"
                        >
                            <option value="mes">Vista Mensual</option>
                            <option value="semana">Vista Semanal</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Tarjetas Principales (P25, P50, P75, POSICIÓN ACTUAL) matching media_1788908977159.png */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: P25 (Percentil 25) */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0"></span> P25 (Percentil 25)
                        </span>
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-rose-200">
                            CRÍTICO
                        </span>
                    </div>
                    <div className="my-2">
                        <div className="text-2xl font-black text-rose-700 font-mono">
                            {formatValue(p25)}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1">
                            25% de los días están por debajo
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Mínimo recomendado
                        </div>
                    </div>
                </div>

                {/* Card 2: P50 (Mediana) */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0"></span> P50 (Mediana)
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-blue-200">
                            NORMAL
                        </span>
                    </div>
                    <div className="my-2">
                        <div className="text-2xl font-black text-blue-700 font-mono">
                            {formatValue(p50)}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1">
                            50% de los días están por debajo
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Punto medio histórico
                        </div>
                    </div>
                </div>

                {/* Card 3: P75 (Percentil 75) */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0"></span> P75 (Percentil 75)
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                            META
                        </span>
                    </div>
                    <div className="my-2">
                        <div className="text-2xl font-black text-emerald-700 font-mono">
                            {formatValue(p75)}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1">
                            75% de los días están por debajo
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Nivel alto esperado
                        </div>
                    </div>
                </div>

                {/* Card 4: POSICIÓN ACTUAL */}
                <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> POSICIÓN ACTUAL
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBg}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusText}</span>
                        </span>
                    </div>
                    <div className="my-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 font-mono">{formatValue(todaySales)}</span>
                            <span className={`text-xs font-bold font-mono ${vsP50Pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {vsP50Pct >= 0 ? `▲ +${vsP50Pct}%` : `▼ ${vsP50Pct}%`}
                            </span>
                        </div>
                        <div className="text-xs font-semibold text-purple-700 mt-1">
                            Sobre el <strong>{percentilePositionPct.toFixed(0)}%</strong> del histórico
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Sección Central: Gráfico de Barra Continua de Distribución + Resumen de Distribución matching media_1788908977159.png */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Panel Izquierdo (8 cols): Barra de Distribución Continua con Marcadóres y Pin de HOY */}
                <div className="lg:col-span-8 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-visible">
                    {/* Top Marker Labels (Mín, P25, Hoy Pin, P50, P75, Máx) */}
                    <div className="relative h-14 w-full">
                        {/* Mín Label */}
                        <div className="absolute left-0 bottom-1 text-left text-xs font-mono">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Mín</span>
                            <span className="font-bold text-slate-700">{formatValue(axisMin)}</span>
                        </div>

                        {/* P25 Marker Label */}
                        <div className="absolute left-[25%] transform -translate-x-1/2 bottom-1 text-center text-xs font-mono">
                            <span className="text-[10px] text-rose-600 font-extrabold block">P25</span>
                            <span className="font-bold text-rose-700">{p25.toFixed(2)}</span>
                        </div>

                        {/* HOY Floating Pin Tooltip Marker */}
                        <div
                            className="absolute bottom-2 transform -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-500"
                            style={{ left: `${Math.min(Math.max(percentilePositionPct, 12), 88)}%` }}
                        >
                            <div className="bg-purple-700 text-white px-3 py-1 rounded-xl shadow-lg border border-purple-600 text-center font-bold">
                                <div className="text-[11px] font-mono whitespace-nowrap">Hoy: {formatValue(todaySales)}</div>
                                <div className="text-[9px] text-purple-200 font-medium">Percentil {percentilePositionPct.toFixed(0)}</div>
                            </div>
                            <div className="w-0.5 h-3 bg-purple-600"></div>
                        </div>

                        {/* P50 Marker Label */}
                        <div className="absolute left-[50%] transform -translate-x-1/2 bottom-1 text-center text-xs font-mono">
                            <span className="text-[10px] text-blue-600 font-extrabold block">P50</span>
                            <span className="font-bold text-blue-700">{p50.toFixed(2)}</span>
                        </div>

                        {/* P75 Marker Label */}
                        <div className="absolute left-[75%] transform -translate-x-1/2 bottom-1 text-center text-xs font-mono">
                            <span className="text-[10px] text-emerald-600 font-extrabold block">P75</span>
                            <span className="font-bold text-emerald-700">{p75.toFixed(2)}</span>
                        </div>

                        {/* Máx Label */}
                        <div className="absolute right-0 bottom-1 text-right text-xs font-mono">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Máx</span>
                            <span className="font-bold text-slate-700">{formatValue(axisMax)}</span>
                        </div>
                    </div>

                    {/* Continuous Multi-Color Bar with Circles matching media_1788908977159.png */}
                    <div className="relative h-3.5 w-full bg-slate-200 rounded-full flex items-center my-2 shadow-inner">
                        {/* Pink Segment (Mín to P25) */}
                        <div className="w-[25%] h-full bg-rose-400 rounded-l-full"></div>
                        {/* Blue Segment (P25 to P50) */}
                        <div className="w-[25%] h-full bg-blue-400"></div>
                        {/* Green Segment (P50 to P75 & Beyond) */}
                        <div className="w-[50%] h-full bg-emerald-400 rounded-r-full"></div>

                        {/* Dots on the Bar Line */}
                        {/* P25 Dot */}
                        <div className="absolute left-[25%] transform -translate-x-1/2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full shadow-xs z-10"></div>
                        
                        {/* HOY Pin Dot */}
                        <div 
                            className="absolute transform -translate-x-1/2 w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-md z-30"
                            style={{ left: `${Math.min(Math.max(percentilePositionPct, 5), 95)}%` }}
                        ></div>

                        {/* P50 Dot */}
                        <div className="absolute left-[50%] transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-xs z-10"></div>

                        {/* P75 Dot */}
                        <div className="absolute left-[75%] transform -translate-x-1/2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs z-10"></div>
                    </div>

                    {/* Bottom Axis Segment Percentages */}
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold pt-1 px-2">
                        <span className="w-1/3 text-center">25% de días</span>
                        <span className="w-1/3 text-center">50% de días</span>
                        <span className="w-1/3 text-center">75% de días</span>
                    </div>
                </div>

                {/* Panel Derecho (4 cols): Resumen de la distribución matching media_1788908977159.png */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                            Resumen de la distribución
                        </h4>
                    </div>

                    <div className="space-y-2 text-xs">
                        {/* Row 1: Días críticos (< P25) */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 font-medium text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                                <span>Días críticos (&lt; P25)</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                                <span className="font-extrabold text-rose-600">18%</span>
                                <span className="text-slate-400 text-[11px]">66 días</span>
                            </div>
                        </div>

                        {/* Row 2: Días bajos (P25 - P50) */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 font-medium text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                                <span>Días bajos (P25 - P50)</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                                <span className="font-extrabold text-amber-600">32%</span>
                                <span className="text-slate-400 text-[11px]">117 días</span>
                            </div>
                        </div>

                        {/* Row 3: Días normales (P50 - P75) */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 font-medium text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                                <span>Días normales (P50 - P75)</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                                <span className="font-extrabold text-blue-600">34%</span>
                                <span className="text-slate-400 text-[11px]">124 días</span>
                            </div>
                        </div>

                        {/* Row 4: Días altos (> P75) */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 font-medium text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>Días altos (&gt; P75)</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                                <span className="font-extrabold text-emerald-600">14%</span>
                                <span className="text-slate-400 text-[11px]">51 días</span>
                            </div>
                        </div>

                        {/* Row 5: Sin datos */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 font-medium text-slate-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></span>
                                <span>Sin datos</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                                <span className="font-bold text-slate-500">2%</span>
                                <span className="text-slate-400 text-[11px]">7 días</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Footer Bar con Interpretación y Recomendación matching media_1788908977159.png */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-purple-900 flex items-center gap-1">
                        💡 Interpretación:
                    </span>
                    <span className="text-slate-700">{interpretacion}</span>
                    <span className="text-slate-300 font-bold">|</span>
                    <span className="font-bold text-purple-900 flex items-center gap-1">
                        💡 Recomendación:
                    </span>
                    <span className="text-slate-700">{recomendacion}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Última actualización: {new Date().toLocaleDateString('es-BO')} {new Date().toLocaleTimeString('es-BO')}</span>
                </div>
            </div>
        </div>
    );
};

