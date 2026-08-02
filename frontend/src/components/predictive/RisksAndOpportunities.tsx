import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import type { DetectedRisk, DetectedOpportunity } from '../../api/types';

interface Props {
  risks: DetectedRisk[];
  opportunities: DetectedOpportunity[];
}

export const RisksAndOpportunities: React.FC<Props> = ({ risks, opportunities }) => {
  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'crítica': return <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md">Gravedad Crítica</span>;
      case 'alta': return <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md">Gravedad Alta</span>;
      default: return <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md">Gravedad Media</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* ── 10. RIESGOS DETECTADOS ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200/60">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
                Prevención Activa
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Riesgos Detectados por IA
              </h3>
            </div>
          </div>
          <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
            Alertas Preventivas
          </span>
        </div>

        <div className="space-y-3">
          {risks.map((r, idx) => (
            <div 
              key={idx}
              className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{r.risk_type}</h4>
                  {getSeverityBadge(r.severity)}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Afecta a: <strong className="text-slate-800">{r.product_or_category}</strong>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 block">
                  Prob. {r.probability_pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 11. OPORTUNIDADES DETECTADAS ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200/60">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                Inteligencia de Mercado
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Oportunidades Detectadas por IA
              </h3>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Crecimiento Proyectado
          </span>
        </div>

        <div className="space-y-3">
          {opportunities.map((opp, idx) => (
            <div 
              key={idx}
              className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                  {opp.type}
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                  +{opp.growth_pct}% Potencial
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">{opp.title}</h4>
              <p className="text-xs text-slate-600 font-medium leading-snug">{opp.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
