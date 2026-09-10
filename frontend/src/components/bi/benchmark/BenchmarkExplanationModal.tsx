import React from 'react';
import { X, Database, Calculator, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const BenchmarkExplanationModal: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                Transparencia de Datos & Metodología
                            </h3>
                            <p className="text-xs text-slate-500">
                                Explicación detallada sobre la procedencia y fórmula de cálculo del Benchmark Histórico
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Sections */}
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
                    {/* Section 1: Data Origin */}
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 font-extrabold text-indigo-900 text-sm">
                            <Database className="w-4 h-4 text-indigo-600" />
                            <span>1. Origén Autoritativo de Datos</span>
                        </div>
                        <p>
                            Las métricas mostradas en este panel se calculan directamente desde las ventas transaccionadas en los puntos de venta POS almacenadas en <strong>MongoDB</strong> (colección <code className="font-mono text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded">sales</code>).
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-indigo-950 font-medium">
                            <li>Zona horaria oficial: <strong className="font-mono">America/La_Paz</strong>.</li>
                            <li>Aislamiento estricto por <strong className="font-mono">tenant_id</strong> y sucursal.</li>
                            <li>Muestra histórica: <strong className="font-mono">365 días móviles equivalentes</strong>.</li>
                        </ul>
                    </div>

                    {/* Section 2: Mathematical Formulas */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                            <Calculator className="w-4 h-4 text-indigo-600" />
                            <span>2. Fórmulas de Cálculo</span>
                        </div>

                        <div className="space-y-2 font-mono">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-900 text-[11px] block">Variación vs. Mediana (P50):</span>
                                <span className="text-indigo-700 font-extrabold text-xs">Variación % = ((Venta Hoy - P50) / P50) × 100</span>
                            </div>

                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-900 text-[11px] block">Posición Percentil:</span>
                                <span className="text-emerald-700 font-extrabold text-xs">Percentil = (Días con venta menor a Hoy / 365 días) × 100</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Percentile Ranges */}
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 font-extrabold text-emerald-900 text-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>3. Zonas y Clasificación de Rendimiento</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="bg-rose-100/80 border border-rose-200 p-2.5 rounded-xl">
                                <strong className="text-rose-900 block font-bold">🔴 Crítico (&lt; P25)</strong>
                                <span className="text-rose-800">Menos del 25% del histórico esperable.</span>
                            </div>
                            <div className="bg-blue-100/80 border border-blue-200 p-2.5 rounded-xl">
                                <strong className="text-blue-900 block font-bold">🔵 Normal (P50 - P75)</strong>
                                <span className="text-blue-800">Comportamiento estándar de operación.</span>
                            </div>
                            <div className="bg-emerald-100/80 border border-emerald-200 p-2.5 rounded-xl">
                                <strong className="text-emerald-900 block font-bold">🟢 Meta (&gt; P75)</strong>
                                <span className="text-emerald-800">Rendimiento superior en el Top 25%.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer button */}
                <div className="border-t border-slate-100 pt-3 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entendido</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
