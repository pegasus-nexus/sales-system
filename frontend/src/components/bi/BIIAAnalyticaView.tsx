import React, { useState, useEffect } from 'react';
import {
    Sparkles, RefreshCw, AlertTriangle, TrendingUp, Info
} from 'lucide-react';
import {
    getBIAIForecast, getBIAIProductDemand, getBIAIAnomalies
} from '../../api/biApi';
import type {
    BIAIForecastResponse, BIAIProductDemandResponse, BIAIAnomalyResponse
} from '../../api/biApi';
import { BIStateBanner } from './common/BIStateBanner';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const BIIAAnalyticaView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [forecastData, setForecastData] = useState<BIAIForecastResponse | null>(null);
    const [demandData, setDemandData] = useState<BIAIProductDemandResponse | null>(null);
    const [anomaliesData, setAnomaliesData] = useState<BIAIAnomalyResponse | null>(null);

    const loadAIData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [fData, dData, aData] = await Promise.all([
                getBIAIForecast(14),
                getBIAIProductDemand(7),
                getBIAIAnomalies(2.0)
            ]);
            setForecastData(fData);
            setDemandData(dData);
            setAnomaliesData(aData);
        } catch (err: any) {
            console.error('Error cargando IA/ML:', err);
            setError(err?.message || 'No se pudo comunicar con el servidor de inteligencia artificial.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAIData();
    }, []);

    if (loading) {
        return <BIStateBanner type="LOADING" message="Ejecutando algoritmos Holt-Winters y Z-Score sobre dataset certificado..." />;
    }

    if (error) {
        return (
            <BIStateBanner
                type="API_ERROR"
                title="Error en Servidor de Inteligencia Artificial"
                message={error}
                onRetry={loadAIData}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* ENCABEZADO DE SEPARACIÓN ETIQUETADO OBLIGATORIO */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 shadow-md border border-indigo-800/40 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <h2 className="text-xl font-black">Centro de Inteligencia Predictiva & ML</h2>
                        <span className="text-xs px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full font-bold border border-indigo-400/40">
                            Modelo Holt-Winters 7d
                        </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                        Modelos de aprendizaje analítico con bandas de confianza del 95%. <span className="font-extrabold text-amber-300">Las predicciones se presentan por separado y no modifican los KPIs históricos reales de MongoDB.</span>
                    </p>
                </div>
                <button
                    onClick={loadAIData}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Actualizar Inferencias
                </button>
            </div>

            {/* SECCIÓN 1: PRONÓSTICO HOLT-WINTERS DE VENTAS & BACKTESTING */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* TARJETA DE MODELO Y MÉTRICAS DE ERROR (1 TERCIO) */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Modelo Predictivo Ganador</h3>
                            <p className="text-xs text-slate-400 font-bold">Evaluación transparente de backtesting</p>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <TrendingUp size={18} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                            <span className="text-xs font-black text-slate-900 block">{forecastData?.model_champion}</span>
                            <span className="text-[11px] font-bold text-slate-400 mt-0.5 block">
                                Backtesting evaluado en {forecastData?.backtesting_evaluated_days} días de test
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                                <span className="text-[10px] font-black uppercase text-indigo-900 block">MAE (Error Absoluto)</span>
                                <span className="text-sm font-black text-indigo-700">Bs. {forecastData?.metrics.holt_winters.mae.toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                                <span className="text-[10px] font-black uppercase text-amber-900 block">MAPE (Error %)</span>
                                <span className="text-sm font-black text-amber-700">{forecastData?.metrics.holt_winters.mape}%</span>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-100/70 rounded-2xl text-[11px] font-semibold text-slate-500 flex items-start gap-2">
                            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span>El MAPE refleja el margen de error promedio del modelo frente al pasado.</span>
                        </div>
                    </div>
                </div>

                {/* TABLA DE COMPARATIVA DE MUESTRA PRONOSTICADA (2 TERCIOS) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Muestra de Pronóstico & Backtesting</h3>
                            <p className="text-xs text-slate-400 font-bold">Dato Real MongoDB (🟢) vs. Predicción ML (🔵)</p>
                        </div>
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                            Confianza 95%
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                    <th className="py-3 px-3">Fecha Evaluada</th>
                                    <th className="py-3 px-3 text-right">🟢 Real MongoDB</th>
                                    <th className="py-3 px-3 text-right">🔵 Predicción ML</th>
                                    <th className="py-3 px-3 text-right">Diferencia (Error)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {forecastData?.sample_forecast_comparison.map((comp, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-3 font-black text-slate-900">{comp.fecha}</td>
                                        <td className="py-3 px-3 text-right font-black text-emerald-700">{formatBs(comp.real_mongodb)}</td>
                                        <td className="py-3 px-3 text-right font-black text-indigo-700">{formatBs(comp.prediccion_ml)}</td>
                                        <td className="py-3 px-3 text-right font-extrabold text-amber-600">{formatBs(comp.error_bs)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* SECCIÓN 2: PREDICCIÓN DE DEMANDA FÍSICA POR SKU */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Demanda Estimada por Producto (Próximos 7 Días)</h3>
                        <p className="text-xs text-slate-400 font-bold">Proyección de volumen físico de inventario requeridos por SKU</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                            {demandData?.skus_prediccion_confiable || 0} SKUs Confiables
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {demandData?.productos.slice(0, 6).map((prod) => (
                        <div key={prod.producto_id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2">
                            <div className="flex justify-between items-start">
                                <span className="font-black text-slate-900 text-xs line-clamp-1">{prod.nombre}</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    prod.estado_ml.includes('CONFIABLE')
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {prod.estado_ml}
                                </span>
                            </div>

                            {prod.estado_ml.includes('CONFIABLE') ? (
                                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold">Demanda 7 Días:</span>
                                        <span className="font-black text-indigo-700">{prod.demanda_estimada_horizonte} unidades</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                        <span>Rango 95% Confianza:</span>
                                        <span className="text-slate-600 font-extrabold">
                                            {prod.intervalo_confianza_95?.limite_inferior} - {prod.intervalo_confianza_95?.limite_superior} un
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-400 font-medium pt-2">{prod.mensaje}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 3: ALERTAS DE ANOMALÍAS OPERACIONALES DETECTADAS */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Alertas Operacionales & Eventos Atípicos (Z-Score)</h3>
                        <p className="text-xs text-slate-400 font-bold">Detección automática de picos o caídas inusuales en ventas</p>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-xl flex items-center gap-1">
                        <AlertTriangle size={14} />
                        {anomaliesData?.total_anomalies_found || 0} Eventos Atípicos
                    </span>
                </div>

                <div className="space-y-3">
                    {anomaliesData?.anomalies_summary.slice(0, 5).map((anom, idx) => (
                        <div key={idx} className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-900 text-xs">{anom.tipo_anomalia}</span>
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-lg">
                                        {anom.severidad}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">{anom.fecha}</span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium">{anom.explicacion_tecnica}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-black text-slate-900 block">{formatBs(anom.ingresos_reales_bs)}</span>
                                <span className="text-[10px] font-bold text-slate-400">Z-Score: {anom.z_score_ingresos}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
