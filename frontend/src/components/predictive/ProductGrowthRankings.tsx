import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import type { ProductGrowthItem, ProductRiskItem } from '../../api/types';

interface Props {
  topGrowth: ProductGrowthItem[];
  atRisk: ProductRiskItem[];
}

export const ProductGrowthRankings: React.FC<Props> = ({ topGrowth, atRisk }) => {
  const formatBs = (val: number) => `Bs. ${val.toLocaleString('es-BO')}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* ── 4. PRODUCTOS CON MAYOR CRECIMIENTO ESPERADO ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200/60">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                Top Demanda
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Mayor Crecimiento Esperado
              </h3>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Proyección Alcista
          </span>
        </div>

        <div className="space-y-3">
          {topGrowth.map((item, idx) => (
            <div 
              key={item.product_name}
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{item.product_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                    <span>{formatBs(item.current_sales)}</span>
                    <ArrowRight size={12} className="text-slate-400" />
                    <span className="font-bold text-slate-800">{formatBs(item.expected_sales)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-right">
                  <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    ▲{item.growth_pct}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200/60">
                  <ShieldCheck size={13} className="text-blue-600" />
                  <span>{item.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. PRODUCTOS EN RIESGO (Inverse Ranking) ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200/60">
              <TrendingDown size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
                Ranking Inverso
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Productos en Riesgo de Caída
              </h3>
            </div>
          </div>
          <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
            Caída Proyectada
          </span>
        </div>

        <div className="space-y-3">
          {atRisk.map((item, idx) => (
            <div 
              key={item.product_name}
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-xl bg-white border border-slate-200 text-rose-600 text-xs font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{item.product_name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mt-0.5">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>Motivo: {item.reason}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-right">
                  <span className="inline-flex items-center gap-0.5 text-xs font-black text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                    ▼{item.expected_drop_pct}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200/60">
                  <ShieldCheck size={13} className="text-blue-600" />
                  <span>{item.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
