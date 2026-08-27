import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export interface BIBarChartItem {
  label: string;
  value: number;
  secondaryValue?: number;
  formattedValue?: string;
  color?: string;
}

interface BIBarChartProps {
  title: string;
  subtitle?: string;
  data: BIBarChartItem[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  emptyMessage?: string;
}

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export const BIBarChart: React.FC<BIBarChartProps> = ({
  title,
  subtitle,
  data,
  valuePrefix = 'Bs. ',
  valueSuffix = '',
  height = 300,
  emptyMessage = 'Sin datos disponibles para esta gráfica'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-center items-center text-center" style={{ height }}>
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">{title}</h3>
        <p className="text-xs text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.label,
    val: item.value,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    formatted: item.formattedValue || `${valuePrefix}${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}${valueSuffix}`
  }));

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${valuePrefix}${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800">
                      <p className="font-bold text-slate-200">{p.name}</p>
                      <p className="font-extrabold text-emerald-400 mt-1">{p.formatted}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="val" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
