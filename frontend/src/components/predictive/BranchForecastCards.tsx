import React from 'react';
import { Building2, TrendingUp, TrendingDown, DollarSign, ShoppingBag, ShieldCheck } from 'lucide-react';
import type { BranchForecast } from '../../api/types';

interface Props {
  forecasts: BranchForecast[];
}

export const BranchForecastCards: React.FC<Props> = ({ forecasts }) => {
  const formatBs = (val: number) => `Bs. ${val.toLocaleString('es-BO')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            Sucursales Oficiales
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Pronóstico por Sucursal
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Heroínas · Recoleta · Calacoto
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {forecasts.map((b) => {
          const isPos = b.variation_pct >= 0;
          return (
            <div 
              key={b.branch_name}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative group overflow-hidden"
            >
              {/* Subtle top indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${b.branch_name === 'Heroínas' ? 'bg-blue-600' : (b.branch_name === 'Recoleta' ? 'bg-purple-600' : 'bg-emerald-600')}`} />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-2xl text-slate-700">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-none">{b.branch_name}</h4>
                    <span className="text-[11px] font-bold text-slate-400">Sucursal Oficial</span>
                  </div>
                </div>

                <div className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full ${isPos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isPos ? `▲${b.variation_pct}%` : `▼${Math.abs(b.variation_pct)}%`}
                </div>
              </div>

              {/* Main Expected Sales */}
              <div className="space-y-1 my-4">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ventas Esperadas</span>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatBs(b.expected_sales)}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3 text-xs">
                {/* Expected Margin */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Margen Esperado</span>
                  <span className="font-extrabold text-slate-800 text-sm">{formatBs(b.expected_margin)}</span>
                </div>

                {/* Expected Transactions */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Transacciones</span>
                  <span className="font-extrabold text-slate-800 text-sm">{b.expected_transactions.toLocaleString()} tx</span>
                </div>
              </div>

              {/* Confidence Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>Confianza IA</span>
                </div>
                <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {b.confidence}%
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
