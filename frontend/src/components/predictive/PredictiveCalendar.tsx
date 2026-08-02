import React from 'react';
import { Calendar } from 'lucide-react';
import type { PredictiveCalendarDay } from '../../api/types';

interface Props {
  days: PredictiveCalendarDay[];
}

export const PredictiveCalendar: React.FC<Props> = ({ days }) => {
  const formatBs = (val: number) => `Bs. ${val.toLocaleString('es-BO')}`;

  const getStatusBadge = (color: string, _level: string, isHol?: boolean, holName?: string | null) => {
    if (isHol || color === 'azul') {
      return (
        <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/80">
          🎉 {holName || 'Festividad'}
        </span>
      );
    }
    switch (color) {
      case 'naranja':
        return (
          <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/80">
            🔥 Alta Demanda
          </span>
        );
      case 'rojo':
        return (
          <span className="text-[10px] font-black uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200/80">
            ⚠️ Demanda Crítica
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200/80">
            ✅ Demanda Normal
          </span>
        );
    }
  };

  const getCardBorder = (color: string) => {
    switch (color) {
      case 'azul': return 'border-blue-200 bg-blue-50/20';
      case 'naranja': return 'border-amber-200 bg-amber-50/20';
      case 'rojo': return 'border-rose-200 bg-rose-50/20';
      default: return 'border-slate-200/80 bg-white';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200/60">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
              Planificación Temporal Futura
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Calendario Predictivo de Demanda
            </h3>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] font-extrabold">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ● Normal
          </span>
          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            ● Alta Demanda
          </span>
          <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            ● Crítica
          </span>
          <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            ● Festivo
          </span>
        </div>
      </div>

      {/* Grid of Future Days */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`border rounded-2xl p-3.5 space-y-2.5 transition-all duration-150 hover:shadow-sm ${getCardBorder(day.status_color)}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-400">{day.day_name}</span>
              <span className="text-xs font-black text-slate-900">{day.date}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Esperadas</span>
              <div className="text-base font-black text-slate-900 tracking-tight">
                {formatBs(day.expected_sales)}
              </div>
            </div>

            <div>
              {getStatusBadge(day.status_color, day.demand_level, day.is_holiday, day.holiday_name)}
            </div>

            <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Confianza</span>
              <span className="text-blue-600 font-extrabold">{day.confidence}%</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
