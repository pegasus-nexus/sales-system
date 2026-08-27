import React from 'react';
import { CheckCircle2, Clock, Calendar, ShieldCheck } from 'lucide-react';

interface BIBadgeHeaderProps {
  timezone?: string;
  lastUpdated?: string;
  syncStatus?: string;
}

export const BIBadgeHeader: React.FC<BIBadgeHeaderProps> = ({
  timezone = 'America/La_Paz',
  lastUpdated = 'Tiempo Real',
  syncStatus = 'Datos Sincronizados con POS'
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl shadow-md backdrop-blur-md mb-6">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {syncStatus}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700/60 font-medium">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Huso Horario: <strong className="text-white">{timezone}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700/60 font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Actualizado: <strong className="text-white">{lastUpdated}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 text-emerald-300 rounded-lg border border-emerald-800/60 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aislamiento Tenant: <strong className="text-emerald-200">Activo (Strict)</strong></span>
        </div>
      </div>
    </div>
  );
};
