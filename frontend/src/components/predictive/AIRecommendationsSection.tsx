import React from 'react';
import { Bot, Lightbulb, CheckCircle2, ArrowUpRight, ShieldCheck, Tag, Users, Package } from 'lucide-react';
import type { AIRecommendation } from '../../api/types';

interface Props {
  recommendations: AIRecommendation[];
}

export const AIRecommendationsSection: React.FC<Props> = ({ recommendations }) => {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'inventario': return <Package size={16} className="text-blue-600" />;
      case 'promoción': return <Tag size={16} className="text-purple-600" />;
      case 'personal': return <Users size={16} className="text-emerald-600" />;
      default: return <Lightbulb size={16} className="text-amber-600" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'alto':
        return <span className="text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200/60">Impacto Alto</span>;
      case 'medio':
        return <span className="text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200/60">Impacto Medio</span>;
      default:
        return <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">Impacto Normal</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200/60">
            <Bot size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600">
              Google Gemini Motor Cognitivo
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Recomendaciones Estratégicas IA
            </h3>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
          Actualización dinámica en tiempo real
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className="bg-slate-50/60 hover:bg-white border border-slate-200/70 hover:border-blue-200 p-5 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-sm space-y-3 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs group-hover:border-blue-300 transition-colors">
                  {getActionIcon(rec.action_type)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-blue-700 transition-colors">
                    {rec.title}
                  </h4>
                  {rec.branch_target && (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                      Sucursal {rec.branch_target}
                    </span>
                  )}
                </div>
              </div>
              {getImpactBadge(rec.impact_level)}
            </div>

            <div className="bg-white/80 border border-slate-200/50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed font-medium">
              <strong className="text-slate-800 font-bold block mb-0.5">Motivo IA:</strong>
              {rec.reason}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-purple-600">
                <CheckCircle2 size={13} /> Acción Recomendada
              </span>
              <span className="text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5 transition-colors">
                Ejecutar <ArrowUpRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
