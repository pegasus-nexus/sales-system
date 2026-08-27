import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type BIKpiVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'purple';

interface BIKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: BIKpiVariant;
  statusBadge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'neutral';
  isPrimary?: boolean;
}

const variantStyles: Record<BIKpiVariant, { bg: string; border: string; iconBg: string; iconColor: string; valueColor: string }> = {
  primary: {
    bg: 'bg-slate-900/90',
    border: 'border-slate-800',
    iconBg: 'bg-blue-950/80 border border-blue-800/60',
    iconColor: 'text-blue-400',
    valueColor: 'text-white'
  },
  secondary: {
    bg: 'bg-slate-900/80',
    border: 'border-slate-800/80',
    iconBg: 'bg-slate-800 border border-slate-700/60',
    iconColor: 'text-slate-300',
    valueColor: 'text-slate-100'
  },
  success: {
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-900/40',
    iconBg: 'bg-emerald-950/80 border border-emerald-800/60',
    iconColor: 'text-emerald-400',
    valueColor: 'text-emerald-300'
  },
  warning: {
    bg: 'bg-amber-950/20',
    border: 'border-amber-900/40',
    iconBg: 'bg-amber-950/80 border border-amber-800/60',
    iconColor: 'text-amber-400',
    valueColor: 'text-amber-300'
  },
  info: {
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-900/40',
    iconBg: 'bg-cyan-950/80 border border-cyan-800/60',
    iconColor: 'text-cyan-400',
    valueColor: 'text-cyan-300'
  },
  purple: {
    bg: 'bg-purple-950/20',
    border: 'border-purple-900/40',
    iconBg: 'bg-purple-950/80 border border-purple-800/60',
    iconColor: 'text-purple-400',
    valueColor: 'text-purple-300'
  }
};

const badgeStyles = {
  success: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
  warning: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
  info: 'bg-blue-950/80 text-blue-300 border-blue-800/60',
  neutral: 'bg-slate-800 text-slate-300 border-slate-700'
};

export const BIKpiCard: React.FC<BIKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  statusBadge,
  badgeType = 'info',
  isPrimary = false
}) => {
  const styles = variantStyles[variant];

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border shadow-lg backdrop-blur-md transition-all duration-200 hover:border-slate-700/80 ${styles.bg} ${styles.border} ${isPrimary ? 'ring-1 ring-blue-500/30' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          {subtitle && (
            <span className="text-[11px] text-slate-400/80 block mt-0.5 font-normal">
              {subtitle}
            </span>
          )}
        </div>

        <div className={`p-2.5 rounded-xl shrink-0 ${styles.iconBg}`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-2">
        <div className={`text-2xl font-bold tracking-tight ${styles.valueColor}`}>
          {value}
        </div>

        {statusBadge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyles[badgeType]}`}>
            {statusBadge}
          </span>
        )}
      </div>
    </div>
  );
};
