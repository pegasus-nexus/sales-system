import React from 'react';
import { CalendarHeart, Flame, Gift, Sparkles, ShieldCheck } from 'lucide-react';
import type { UpcomingImpactEvent } from '../../api/types';

interface Props {
  events: UpcomingImpactEvent[];
}

export const UpcomingEventsSection: React.FC<Props> = ({ events }) => {
  const getEventIcon = (iconType: string) => {
    switch (iconType.toLowerCase()) {
      case 'heart': return <CalendarHeart className="text-rose-600" size={24} />;
      case 'flower': return <Flame className="text-amber-600" size={24} />;
      case 'gift': return <Gift className="text-purple-600" size={24} />;
      default: return <Sparkles className="text-blue-600" size={24} />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Estacionalidad Histórica
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Eventos que Impactarán las Ventas
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Cálculo Automático por Histórico
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((evt, idx) => (
          <div 
            key={idx}
            className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 p-5 rounded-2xl transition-all duration-150 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                {getEventIcon(evt.icon_type)}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{evt.event_name}</h4>
                <span className="text-xs font-medium text-slate-400 block">{evt.date_approx}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full block mb-1">
                +{evt.expected_impact_pct}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1">
                <ShieldCheck size={11} className="text-blue-600" /> {evt.confidence}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
