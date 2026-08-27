import React from 'react';
import { Calendar, Filter, Globe } from 'lucide-react';
import type { BISucursalOption } from '../../../api/biApi';

export type BIPresetType = 'hoy' | 'ayer' | '7dias' | '30dias' | 'historial' | 'custom';

export const getFormattedBoliviaDate = (daysOffset: number = 0): string => {
  const now = new Date();
  const boliviaDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  if (daysOffset === 0) {
    return boliviaDateStr;
  }

  const [y, m, d] = boliviaDateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  dateObj.setDate(dateObj.getDate() + daysOffset);

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface BIFilterHeaderProps {
  preset: BIPresetType;
  startDate: string;
  endDate: string;
  selectedSucursal: string;
  sucursales: BISucursalOption[];
  onPresetChange: (preset: BIPresetType) => void;
  onCustomDateChange: (start: string, end: string) => void;
  onSucursalChange: (sucursalId: string) => void;
}

export const BIFilterHeader: React.FC<BIFilterHeaderProps> = ({
  preset,
  startDate,
  endDate,
  selectedSucursal,
  sucursales,
  onPresetChange,
  onCustomDateChange,
  onSucursalChange
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 my-4 overflow-hidden">
      {/* SECTOR BOTONES DE PRESET (SCROLL HORIZONTAL EN MÓVIL) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full lg:w-auto shrink-0">
        <button
          onClick={() => onPresetChange('hoy')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            preset === 'hoy'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Hoy
        </button>

        <button
          onClick={() => onPresetChange('ayer')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            preset === 'ayer'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Ayer
        </button>

        <button
          onClick={() => onPresetChange('7dias')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            preset === '7dias'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Últimos 7 días
        </button>

        <button
          onClick={() => onPresetChange('30dias')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            preset === '30dias'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Últimos 30 días
        </button>

        <button
          onClick={() => onPresetChange('historial')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            preset === 'historial'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Historial Completo
        </button>
      </div>

      {/* SECTOR INPUTS DE FECHA Y ZONA HORARIA */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex-1 sm:flex-none">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            value={startDate === 'historial' ? '' : startDate}
            onChange={(e) => onCustomDateChange(e.target.value, endDate)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full sm:w-auto"
          />
          <span className="text-slate-400 font-bold text-xs">a</span>
          <input
            type="date"
            value={endDate === 'historial' ? '' : endDate}
            onChange={(e) => onCustomDateChange(startDate, e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full sm:w-auto"
          />
        </div>

        {/* SELECTOR DE SUCURSAL */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex-1 sm:flex-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedSucursal}
            onChange={(e) => onSucursalChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full"
          >
            <option value="all">Todas las Sucursales</option>
            {sucursales.map((s) => (
              <option key={s.sucursal_id} value={s.sucursal_id}>
                {s.nombre} ({s.ciudad})
              </option>
            ))}
          </select>
        </div>

        {/* INDICADOR ZONA HORARIA BOLIVIA */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0">
          <Globe className="w-3 h-3 text-emerald-600" />
          <span>America/La_Paz</span>
        </div>
      </div>
    </div>
  );
};
