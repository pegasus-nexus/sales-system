import React, { useState, useEffect } from 'react';
import {
    Sparkles, RefreshCw, TrendingUp, Info, Send, Bot, User, CloudSun, AlertTriangle
} from 'lucide-react';
import {
    getBIAIForecast, getBIAIProductDemand, getBIAIAnomalies, getBIAICausal, getBIAIRecommendations, postBIAIChat
} from '../../api/biApi';
import type {
    BIAIForecastResponse, BIAIProductDemandResponse, BIAIAnomalyResponse
} from '../../api/biApi';
import { BIStateBanner } from './common/BIStateBanner';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
}

export const BIIAAnalyticaView: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [forecastData, setForecastData] = useState<BIAIForecastResponse | null>(null);
    const [demandData, setDemandData] = useState<BIAIProductDemandResponse | null>(null);
    const [anomaliesData, setAnomaliesData] = useState<BIAIAnomalyResponse | null>(null);
    const [causalData, setCausalData] = useState<any | null>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            sender: 'bot',
            text: '¡Hola! Soy tu Asistente Ejecutivo de BI. Puedes preguntarme: "¿Por qué bajaron las ventas?", "¿Qué producto debo impulsar?" o "¿Qué sucursal requiere atención?".',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [chatInput, setChatInput] = useState<string>('');
    const [sendingChat, setSendingChat] = useState<boolean>(false);

    const loadAIData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [fData, dData, aData, cData, rData] = await Promise.all([
                getBIAIForecast(14),
                getBIAIProductDemand(7),
                getBIAIAnomalies(2.0),
                getBIAICausal().catch(() => null),
                getBIAIRecommendations().catch(() => [])
            ]);
            setForecastData(fData);
            setDemandData(dData);
            setAnomaliesData(aData);
            setCausalData(cData);
            setRecommendations(rData);
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

    const handleSendChat = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || sendingChat) return;

        const userMsg = chatInput.trim();
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: timeNow }]);
        setChatInput('');
        setSendingChat(true);

        try {
            const res = await postBIAIChat(userMsg, 'hoy');
            setChatMessages(prev => [...prev, {
                sender: 'bot',
                text: res.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (err) {
            setChatMessages(prev => [...prev, {
                sender: 'bot',
                text: 'No pude procesar la consulta en este momento. Por favor reintenta.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setSendingChat(false);
        }
    };

    if (loading) {
        return <BIStateBanner type="LOADING" message="Ejecutando algoritmos Holt-Winters, Z-Score y modelos conversacionales sobre dataset certificado..." />;
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
                        <h2 className="text-xl font-black">Centro de Inteligencia Predictiva & IA</h2>
                        <span className="text-xs px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full font-bold border border-indigo-400/40">
                            Modelo Holt-Winters & Natural Language BI
                        </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                        Modelos de aprendizaje analítico con bandas de confianza del 95%. <span className="font-extrabold text-amber-300">Las predicciones se presentan por separado y no modifican los KPIs históricos reales de MongoDB.</span>
                    </p>
                </div>
                <button
                    onClick={loadAIData}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
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

            {/* SECCIÓN 2: FACTORES CAUSALES & RECOMENDADOR COMERCIAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FACTORES CAUSALES EXTERNOS */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Análisis Causal IA (Contexto Externo)</h3>
                            <p className="text-xs text-slate-400 font-bold">Impacto de clima, feriados y calendario de ventas</p>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl">
                            <CloudSun size={18} />
                        </div>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                            <span className="font-black text-blue-950 uppercase text-[10px] block">Condición Climática</span>
                            <p className="font-bold text-slate-800">{causalData?.clima || 'Clima templado a soleado en zona central.'}</p>
                        </div>
                        <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                            <span className="font-black text-purple-950 uppercase text-[10px] block">Calendario & Eventos</span>
                            <p className="font-bold text-slate-800">{causalData?.calendario || 'Jornada comercial regular sin feriados.'}</p>
                        </div>
                    </div>
                </div>

                {/* RECOMENDADOR IA COMERCIAL */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Recomendaciones Comerciales IA</h3>
                            <p className="text-xs text-slate-400 font-bold">Sugerencias accionables de inventario y precios</p>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                            <Sparkles size={18} />
                        </div>
                    </div>

                    <div className="space-y-3 text-xs">
                        {recommendations.map((rec: any) => (
                            <div key={rec.id} className="p-3.5 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-slate-900 text-xs">{rec.titulo}</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                                        {rec.prioridad}
                                    </span>
                                </div>
                                <p className="text-slate-600 text-[11px] font-medium">{rec.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DEMANDA ESTIMADA POR SKU */}
            {demandData && demandData.productos && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Demanda Estimada por Producto (Próximos 7 Días)</h3>
                            <p className="text-xs text-slate-400 font-bold">Proyección de volumen físico requeridos por SKU</p>
                        </div>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                            {demandData.skus_prediccion_confiable || 0} SKUs Confiables
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {demandData.productos.slice(0, 6).map((prod) => (
                            <div key={prod.producto_id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-black text-slate-900 text-xs truncate">{prod.nombre}</span>
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                        {prod.estado_ml}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold">Demanda 7 Días:</span>
                                        <span className="font-black text-indigo-700">{prod.demanda_estimada_horizonte || 0} un</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ANOMALÍAS Y EVENTOS ATÍPICOS (Z-SCORE) */}
            {anomaliesData && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-amber-500" />
                                <span>Eventos Atípicos & Anomalías Detectadas (Z-Score)</span>
                            </h3>
                            <p className="text-xs text-slate-400 font-bold">Detección de patrones fuera de desviación estándar en tickets/ventas</p>
                        </div>
                        <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-xl">
                            {anomaliesData.total_anomalies_found || 0} Eventos
                        </span>
                    </div>

                    <div className="space-y-2">
                        {anomaliesData.anomalies_summary.slice(0, 3).map((anom, idx) => (
                            <div key={idx} className="p-3.5 bg-amber-50/40 border border-amber-200/60 rounded-2xl flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-black text-slate-900 block">{anom.tipo_anomalia} ({anom.fecha})</span>
                                    <span className="text-slate-500 font-medium text-[11px]">{anom.explicacion_tecnica}</span>
                                </div>
                                <span className="font-black text-amber-900">{formatBs(anom.ingresos_reales_bs)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN 3: CHAT BI INTERACTIVO */}
            <div className="bg-slate-900 rounded-3xl p-6 shadow-lg border border-indigo-900 text-white space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600/60 text-amber-300 rounded-2xl border border-indigo-400/30">
                            <Bot size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-black">Chat BI Interactivo — Asistente de Negocios</h3>
                            <p className="text-xs text-slate-400 font-medium">Consultas conversacionales en tiempo real basadas en datos de MongoDB</p>
                        </div>
                    </div>
                </div>

                {/* Contenedor de Mensajes */}
                <div className="bg-slate-950/80 rounded-2xl p-4 max-h-72 overflow-y-auto space-y-3 border border-slate-800/80 text-xs">
                    {chatMessages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-2.5 ${
                                msg.sender === 'user' ? 'flex-row-reverse' : ''
                            }`}
                        >
                            <div
                                className={`p-2 rounded-xl text-xs shrink-0 ${
                                    msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300'
                                }`}
                            >
                                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div
                                className={`p-3.5 rounded-2xl max-w-md ${
                                    msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white font-medium'
                                        : 'bg-slate-850 border border-slate-800 text-slate-100 font-normal'
                                }`}
                            >
                                <p className="leading-relaxed">{msg.text}</p>
                                <span className="text-[9px] opacity-60 mt-1 block text-right">{msg.timestamp}</span>
                            </div>
                        </div>
                    ))}
                    {sendingChat && (
                        <div className="flex items-center gap-2 text-indigo-400 text-xs italic">
                            <Sparkles size={14} className="animate-spin" />
                            <span>Procesando consulta BI...</span>
                        </div>
                    )}
                </div>

                {/* Formulario de Entrada */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ej. ¿Por qué bajaron las ventas? o ¿Qué producto debo impulsar?"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={sendingChat || !chatInput.trim()}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Send size={14} />
                        <span>Enviar</span>
                    </button>
                </form>
            </div>

        </div>
    );
};
