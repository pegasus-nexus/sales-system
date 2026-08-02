import React from 'react';
import { Bot, Sparkles, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ExecutiveAISummary } from '../../api/types';

interface Props {
  summary: ExecutiveAISummary;
}

export const ExecutiveSummaryCard: React.FC<Props> = ({ summary }) => {
  return (
    <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Decorative subtle gradient backdrop */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/60 via-purple-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
        
        {/* Left Side: Header & Narrative */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200/60 rounded-2xl text-blue-600 shadow-2xs">
              <Bot size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/50">
                  Google Gemini Generativo
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <Sparkles size={12} className="text-amber-500" /> Informe en Tiempo Real
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Resumen Ejecutivo IA
              </h2>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5 text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
            <p className="whitespace-pre-line">{summary.summary_text}</p>
          </div>

          {/* Key Metrics Quick Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-200/60 p-3 rounded-xl">
              <div className="p-2 bg-emerald-100/80 rounded-lg text-emerald-700">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">Impulsor de Crecimiento</p>
                <p className="text-xs font-semibold text-slate-800">{summary.top_growth_driver}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-amber-50/50 border border-amber-200/60 p-3 rounded-xl">
              <div className="p-2 bg-amber-100/80 rounded-lg text-amber-700">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">Riesgo Crítico Próximo</p>
                <p className="text-xs font-semibold text-slate-800">{summary.critical_risks[0] || 'Monitoreo constante'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Large Confidence Score Badge */}
        <div className="w-full lg:w-64 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs shrink-0 self-stretch">
          <div className="flex items-center gap-1.5 text-blue-600 mb-2">
            <ShieldCheck size={18} />
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-500">Confianza del Modelo</span>
          </div>
          <div className="text-5xl font-black text-slate-900 tracking-tight my-1">
            {summary.confidence_score.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-3">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-2xs"
              style={{ width: `${Math.min(100, summary.confidence_score)}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            Validado con Loss Cuantílico y Pymongo ML Pipeline
          </p>
        </div>

      </div>
    </div>
  );
};
