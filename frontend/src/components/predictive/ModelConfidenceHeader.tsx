import React from 'react';
import { ShieldCheck, Database, Calendar, Building2, Package, Sparkles } from 'lucide-react';
import type { ModelConfidenceMeta } from '../../api/types';

interface Props {
  meta: ModelConfidenceMeta;
}

export const ModelConfidenceHeader: React.FC<Props> = ({ meta }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Metric 1: Confiabilidad */}
        <div className="flex items-center gap-3 bg-blue-50/60 border border-blue-100 p-3 rounded-2xl">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-2xs">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Confiabilidad</span>
            <span className="text-lg font-black text-slate-900">{meta.reliability_pct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Metric 2: Transacciones */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
          <div className="p-2 bg-slate-200 text-slate-700 rounded-xl">
            <Database size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Entrenado con</span>
            <span className="text-base font-black text-slate-900">{meta.trained_transactions.toLocaleString()} tx</span>
          </div>
        </div>

        {/* Metric 3: Días Históricos */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
          <div className="p-2 bg-slate-200 text-slate-700 rounded-xl">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Histórico Real</span>
            <span className="text-base font-black text-slate-900">{meta.historical_days} días</span>
          </div>
        </div>

        {/* Metric 4: Festividades */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
          <div className="p-2 bg-slate-200 text-slate-700 rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Festividades</span>
            <span className="text-base font-black text-slate-900">{meta.festivities_count} eventos</span>
          </div>
        </div>

        {/* Metric 5: Sucursales Oficiales */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
          <div className="p-2 bg-slate-200 text-slate-700 rounded-xl">
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Sucursales</span>
            <span className="text-base font-black text-slate-900">{meta.branches_count} sucursales</span>
          </div>
        </div>

        {/* Metric 6: Productos */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
          <div className="p-2 bg-slate-200 text-slate-700 rounded-xl">
            <Package size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Productos</span>
            <span className="text-base font-black text-slate-900">{meta.products_count} catálogos</span>
          </div>
        </div>

      </div>
    </div>
  );
};
