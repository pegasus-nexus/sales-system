import React from 'react';
import { Cpu, GitBranch, Layers, CheckCircle, Database } from 'lucide-react';
import type { ModelExplanation } from '../../api/types';

interface Props {
  explanation: ModelExplanation;
}

export const ModelExplanationSection: React.FC<Props> = ({ explanation }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200/60">
            <Cpu size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
              Arquitectura de Machine Learning
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Explicación del Modelo IA
            </h3>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
          Transparencia Algorítmica Estimada
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Modelo Principal */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs">
            <GitBranch size={16} /> Modelo Principal
          </div>
          <h4 className="font-black text-slate-900 text-base">{explanation.model_name}</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Algoritmo de ensamble por gradiente optimizado para capturar patrones estacionales no lineales en series temporales de retail.
          </p>
        </div>

        {/* Card 2: Modelo Cuantílico */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-2 text-purple-600 font-extrabold text-xs">
            <Layers size={16} /> Pérdida Cuantílica (Quantile Loss)
          </div>
          <h4 className="font-black text-slate-900 text-base">Pesimista P10 · Esperado P50 · Optimista P90</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            No calcula un único valor estático. Produce una banda probabilística de incertidumbre adaptada a fluctuaciones del mercado.
          </p>
        </div>

        {/* Card 3: Datos de Entrenamiento */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs">
            <Database size={16} /> Pipeline de Ingesta
          </div>
          <h4 className="font-black text-slate-900 text-base">Pymongo & Pandas Aggregate</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Entrenado directamente sobre el historial transaccional real del sistema con aislamiento estricto por tenant y sucursal.
          </p>
        </div>

      </div>

      {/* Feature Grid */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Variables e Indicadores Utilizados (Features Engine)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {explanation.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 border border-slate-200/60">
              <CheckCircle size={14} className="text-blue-600 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
