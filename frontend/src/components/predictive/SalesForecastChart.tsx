import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity, HelpCircle } from 'lucide-react';
import type { SalesForecastPoint } from '../../api/types';

interface Props {
  forecast: SalesForecastPoint[];
}

export const SalesForecastChart: React.FC<Props> = ({ forecast }) => {
  // Map forecast data to structure suitable for Amazon Forecast look in Recharts
  const chartData = useMemo(() => {
    return forecast.map((pt) => {
      const isFuture = pt.is_future;
      return {
        date: pt.date,
        real: isFuture ? null : pt.real,
        // Band lower and upper bounds
        p10: pt.pred_p10,
        p50: pt.pred_p50,
        p90: pt.pred_p90,
        // Area range [p10, p90]
        bandRange: [pt.pred_p10, pt.pred_p90],
        isFuture,
        weatherTemp: pt.weather_temp,
      };
    });
  }, [forecast]);

  const formatBs = (val: number) => `Bs. ${val.toLocaleString('es-BO')}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataPt = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl text-xs space-y-2 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-extrabold text-slate-800 text-sm">{label}</span>
          <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${dataPt.isFuture ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-600'}`}>
            {dataPt.isFuture ? '🔮 Proyección IA' : '📊 Histórico Real'}
          </span>
        </div>
        {dataPt.real !== null && dataPt.real !== undefined && (
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-medium">Venta Real:</span>
            <span className="font-black text-slate-900">{formatBs(dataPt.real)}</span>
          </div>
        )}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          <div className="flex justify-between items-center text-emerald-600 font-bold">
            <span>P90 (Optimista):</span>
            <span>{formatBs(dataPt.p90)}</span>
          </div>
          <div className="flex justify-between items-center text-blue-600 font-black">
            <span>P50 (Esperado):</span>
            <span>{formatBs(dataPt.p50)}</span>
          </div>
          <div className="flex justify-between items-center text-amber-600 font-bold">
            <span>P10 (Pesimista):</span>
            <span>{formatBs(dataPt.p10)}</span>
          </div>
        </div>
        {dataPt.weatherTemp && (
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Temp. Máx Clima:</span>
            <span className="font-bold text-slate-600">{dataPt.weatherTemp}°C</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
              Quantile Regression ML
            </span>
            <span className="text-xs text-slate-400 font-medium hidden md:inline">
              GradientBoostingRegressor (P10 · P50 · P90)
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            Pronóstico General de Ventas
          </h3>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="w-3 h-0.5 bg-slate-800 rounded-full" />
            <span className="text-slate-700">Real</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            <span className="w-3 h-0.5 bg-blue-600 rounded-full border-b border-dashed border-blue-600" />
            <span className="text-blue-700">P50 Esperado</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span className="w-3 h-0.5 bg-emerald-500" />
            <span className="text-emerald-700">P90 Optimista</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <span className="w-3 h-0.5 bg-amber-500" />
            <span className="text-amber-700">P10 Pesimista</span>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {/* Shaded quantile band between P10 & P90 */}
              <linearGradient id="quantileBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: '#CBD5E1' }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} axisLine={false} tickFormatter={(val) => `Bs.${val/1000}k`} />
            <Tooltip content={<CustomTooltip />} />

            {/* Shaded Area for Uncertainty Band [P10, P90] */}
            <Area
              type="monotone"
              dataKey="bandRange"
              stroke="none"
              fill="url(#quantileBand)"
              name="Banda P10-P90"
            />

            {/* P10 Curve (Pesimista) */}
            <Line
              type="monotone"
              dataKey="p10"
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="P10 Pesimista"
            />

            {/* P90 Curve (Optimista) */}
            <Line
              type="monotone"
              dataKey="p90"
              stroke="#10B981"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="P90 Optimista"
            />

            {/* P50 Curve (Proyección Esperada Principal) */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#2563EB"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={{ r: 3, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#1D4ED8' }}
              name="P50 Esperado"
            />

            {/* Real Data Line */}
            <Line
              type="monotone"
              dataKey="real"
              stroke="#0F172A"
              strokeWidth={3.5}
              connectNulls={false}
              dot={{ r: 4, fill: '#0F172A' }}
              name="Real Histórico"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Explanatory Footer Pill */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-xs text-slate-500">
        <HelpCircle size={16} className="text-blue-600 shrink-0" />
        <span>
          <strong className="text-slate-800 font-bold">Interpretación estilo Amazon Forecast:</strong> La línea sólida representa ventas pasadas. La línea punteada azul (P50) es la predicción esperada. El área sombreada proyecta el rango de confianza entre la postura pesimista (P10) y optimista (P90).
        </span>
      </div>

    </div>
  );
};
