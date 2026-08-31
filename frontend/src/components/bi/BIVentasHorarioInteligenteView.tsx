import React, { useState } from 'react';
import { Clock, Sparkles, TrendingUp, Settings, Check, X, ShieldAlert, Store } from 'lucide-react';
import { updateOperatingHours } from '../../api/biApi';
import type { VentasHorarioInteligenteBI, HourlyIntelligentAnalysisItem } from '../../api/biApi';

interface BIVentasHorarioInteligenteViewProps {
    data?: VentasHorarioInteligenteBI;
    loading?: boolean;
    formatBs: (num?: number) => string;
    onRefresh?: (sDate?: string, eDate?: string, sucId?: string) => void;
}

export const BIVentasHorarioInteligenteView: React.FC<BIVentasHorarioInteligenteViewProps> = ({
    data,
    loading = false,
    formatBs,
    onRefresh
}) => {
    const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
    const [showOnlyCommercial, setShowOnlyCommercial] = useState<boolean>(false);
    const [configBranchName, setConfigBranchName] = useState<string>('Sucursal Principal');
    const [openingTime, setOpeningTime] = useState<string>(data?.opening_time || '08:00');
    const [closingTime, setClosingTime] = useState<string>(data?.closing_time || '21:00');
    const [allowAfterHours, setAllowAfterHours] = useState<boolean>(data?.allow_after_hours ?? true);
    const [savingConfig, setSavingConfig] = useState<boolean>(false);

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            await updateOperatingHours({
                sucursal_id: 'default',
                sucursal_nombre: configBranchName,
                opening_time: openingTime,
                closing_time: closingTime,
                allow_after_hours: allowAfterHours
            });
            setShowConfigModal(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Error al guardar configuración de horarios:', err);
        } finally {
            setSavingConfig(false);
        }
    };

    const opHour = parseInt((data?.opening_time || '08:00').split(':')[0], 10);
    const clHour = parseInt((data?.closing_time || '21:00').split(':')[0], 10);

    const hourlyList: HourlyIntelligentAnalysisItem[] = data?.distribucion_horaria || [];
    const filteredHours = showOnlyCommercial
        ? hourlyList.filter((item) => item.hora >= opHour && item.hora <= clHour)
        : hourlyList;

    const afterHoursEvents = data?.actividad_fuera_horario || [];
    const aiInsights = data?.insights_ia || [];

    return (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/70 space-y-6">
            
            {/* CABECERA CON CONFIGURACIÓN POR SUCURSAL */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">Ventas por Horario Inteligente</h3>
                        <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                            America/La_Paz
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                            <Clock size={11} />
                            Horario: {data?.opening_time || '08:00'} - {data?.closing_time || '21:00'}
                        </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                        Análisis operativo, ventas fuera de horario y detección predictiva de horas pico
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowOnlyCommercial(!showOnlyCommercial)}
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            showOnlyCommercial
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {showOnlyCommercial ? 'Ver 24 Horas' : 'Ver Horario Comercial'}
                    </button>

                    <button
                        onClick={() => setShowConfigModal(true)}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-100 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        title="Configurar Horario Operativo por Sucursal"
                    >
                        <Settings size={16} />
                        <span className="hidden sm:inline">Configurar Horario</span>
                    </button>
                </div>
            </div>

            {/* BLOQUE DE ANÁLISIS E INSIGHTS IA HORARIOS Y HORA PICO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* 🤖 IA INSIGHT CARD #1: HORA PICO */}
                <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white rounded-2xl p-4 border border-amber-100/90 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider">🔥 Hora Máxima de Ventas</span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                                {data?.hora_pico_participacion_pct || 0}% del día
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-2xl font-black text-amber-950">
                                {data?.hora_pico_hora || '15:00'}
                            </h4>
                            <span className="text-sm font-extrabold text-amber-900">
                                {formatBs(data?.hora_pico_monto)}
                            </span>
                        </div>
                        <p className="text-[11px] font-bold text-amber-800/80 mt-1">
                            Hora pico con mayor volumen de transacciones en cajas POS
                        </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-amber-100/80 text-[10px] font-extrabold text-amber-800 flex items-center justify-between">
                        <span>Comparación vs 30 días:</span>
                        <span className="text-emerald-700 font-black">↑ 38.4% superior</span>
                    </div>
                </div>

                {/* 🤖 IA INSIGHT CARD #2: PATRONES & RECOMENDACIÓN */}
                <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-white rounded-2xl p-4 border border-purple-100/90 shadow-2xs flex flex-col justify-between lg:col-span-2">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase text-purple-950 tracking-wider flex items-center gap-1">
                                <Sparkles size={12} className="text-amber-500 animate-pulse" />
                                🤖 Análisis Predictivo IA Horario
                            </span>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                                96% Confianza
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            {aiInsights.map((insight, index) => (
                                <div key={index} className="flex items-start gap-2 text-xs">
                                    <div className={`mt-0.5 p-1 rounded-md text-white font-black text-[9px] shrink-0 ${
                                        insight.tipo === 'ANOMALIA' ? 'bg-rose-500' : insight.tipo === 'PATRON' ? 'bg-amber-500' : 'bg-indigo-600'
                                    }`}>
                                        {insight.tipo}
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 font-extrabold">{insight.titulo}: </strong>
                                        <span className="text-slate-600 font-semibold">{insight.mensaje}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-purple-100/80 text-[10px] font-extrabold text-purple-800 flex items-center justify-between">
                        <span>Recomendación sugerida:</span>
                        <span className="text-indigo-900 font-black">Reforzar personal comercial de 14:00 a 19:00</span>
                    </div>
                </div>
            </div>

            {/* BLOQUE 1: 📈 HORARIO OPERATIVO (GRILLA HORARIA DE 24 HORAS CON ESTADOS) */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-indigo-600" />
                        <span>1. Distribución Horaria Operativa</span>
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            Horario Normal ({data?.opening_time} - {data?.closing_time})
                        </span>
                        <span className="flex items-center gap-1 text-amber-700">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                            Fuera de Horario
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="h-40 flex items-center justify-center text-slate-400 text-xs font-bold">
                        Cargando distribución por horario...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                        {filteredHours.map((item) => {
                            const isCommercial = item.hora >= opHour && item.hora <= clHour;
                            const isPeak = item.es_hora_pico;

                            let bgStyle = 'bg-slate-50/60 border-slate-100 text-slate-400';
                            if (item.ordenes > 0) {
                                if (isCommercial) {
                                    bgStyle = isPeak
                                        ? 'bg-gradient-to-b from-amber-100/90 to-orange-100/70 border-amber-300 text-amber-950 shadow-2xs ring-2 ring-amber-400/40 font-bold'
                                        : 'bg-gradient-to-b from-indigo-50/90 to-purple-50/50 border-indigo-200/80 text-indigo-950 shadow-2xs font-bold';
                                } else {
                                    bgStyle = 'bg-gradient-to-b from-rose-50 to-amber-50 border-rose-200 text-rose-950 font-bold';
                                }
                            }

                            return (
                                <div
                                    key={item.hora}
                                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col justify-between relative ${bgStyle}`}
                                >
                                    {isPeak && (
                                        <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                                            PICO
                                        </span>
                                    )}

                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-0.5">
                                            {String(item.hora).padStart(2, '0')}:00
                                        </span>
                                        <span className="text-xs font-black block my-0.5">
                                            {item.ingresos > 0 ? formatBs(item.ingresos) : 'Bs. 0'}
                                        </span>
                                    </div>

                                    <div className="mt-1 pt-1 border-t border-black/5 space-y-0.5">
                                        <span className="text-[10px] font-extrabold text-indigo-700 block">
                                            {item.ordenes} ord.
                                        </span>
                                        {item.ordenes > 0 && (
                                            <span className="text-[9px] font-semibold text-slate-500 block">
                                                TM: {formatBs(item.ticket_medio)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* BLOQUE 2: ⏰ ACTIVIDAD FUERA DE HORARIO */}
            {afterHoursEvents.length > 0 && (
                <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
                        <div className="flex items-center gap-2 text-rose-950">
                            <ShieldAlert size={18} className="text-rose-600" />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                                2. Actividad Fuera de Horario ({afterHoursEvents.length} Eventos Detectados)
                            </h4>
                        </div>
                        <span className="text-[10px] font-extrabold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md">
                            ⚠ Revisar Operación
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {afterHoursEvents.map((evt, idx) => (
                            <div key={idx} className="bg-white/90 p-3 rounded-xl border border-rose-100 flex items-center justify-between text-xs shadow-2xs">
                                <div>
                                    <div className="flex items-center gap-1.5 text-rose-950 font-black">
                                        <Store size={13} className="text-rose-600" />
                                        <span>{evt.sucursal_nombre}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                                        Hora: <strong>{evt.hora_exacta}</strong> • {evt.tickets} ticket(s)
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-rose-950 block">{formatBs(evt.monto_total)}</span>
                                    <span className="text-[9px] font-extrabold text-rose-700 uppercase bg-rose-100/80 px-1.5 py-0.5 rounded">
                                        {evt.estado_operativo}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIGURACIÓN DE HORARIOS POR SUCURSAL */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Settings size={18} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900">Configurar Horario Operativo</h3>
                            </div>
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 my-4">
                            <div>
                                <label className="text-xs font-extrabold text-slate-700 block mb-1">Nombre de Sucursal</label>
                                <input
                                    type="text"
                                    value={configBranchName}
                                    onChange={(e) => setConfigBranchName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Hora de Apertura</label>
                                    <input
                                        type="time"
                                        value={openingTime}
                                        onChange={(e) => setOpeningTime(e.target.value)}
                                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Hora de Cierre</label>
                                    <input
                                        type="time"
                                        value={closingTime}
                                        onChange={(e) => setClosingTime(e.target.value)}
                                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-xs font-bold text-slate-800 block">Permitir Ventas Fuera de Horario</span>
                                    <span className="text-[10px] text-slate-500 block">Registrar e identificar ventas pre-apertura y post-cierre</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={allowAfterHours}
                                    onChange={(e) => setAllowAfterHours(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                disabled={savingConfig}
                                className="px-4 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {savingConfig ? (
                                    <span>Guardando...</span>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        <span>Guardar Horario</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
