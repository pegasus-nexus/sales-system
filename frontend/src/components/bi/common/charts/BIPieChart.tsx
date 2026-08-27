import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

export interface BIPieChartItem {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface BIPieChartProps {
  title: string;
  subtitle?: string;
  data: BIPieChartItem[];
  valuePrefix?: string;
  height?: number;
  emptyMessage?: string;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const BIPieChart: React.FC<BIPieChartProps> = ({
  title,
  subtitle,
  data,
  valuePrefix = 'Bs. ',
  height = 300,
  emptyMessage = 'Sin datos disponibles para esta distribución'
}) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-center items-center text-center" style={{ height }}>
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">{title}</h3>
        <p className="text-xs text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  const chartData = data.map((item, index) => {
    const pct = item.percentage ?? (totalValue > 0 ? (item.value / totalValue) * 100 : 0);
    return {
      name: item.name,
      value: item.value,
      pct: pct.toFixed(2),
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    };
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between backdrop-blur-sm">
      <div className="mb-2">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800">
                      <p className="font-bold text-slate-200">{p.name}</p>
                      <p className="font-extrabold text-blue-400 mt-1">
                        {valuePrefix}{p.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({p.pct}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-slate-700 font-semibold">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
