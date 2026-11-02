import React from 'react';
import { ShieldCheck, Crown, Gem, Star, Settings, ShieldAlert } from 'lucide-react';

interface PlanBadgeProps {
    plan: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan }) => {
    const config: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
        'BASICO':     { label: 'Básico',     icon: ShieldCheck, color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100' },
        'PRO':        { label: 'Pro',        icon: Crown,       color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-100' },
        'ENTERPRISE': { label: 'Enterprise', icon: Gem,         color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-100' },
        'ILIMITADO':  { label: 'Ilimitado',  icon: Star,        color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200' },
    };

    let s = config[plan];
    if (!s && plan && plan.startsWith('CUSTOM_')) {
        const cleanName = plan.replace('CUSTOM_', '').replace(/_/g, ' ');
        s = { label: cleanName, icon: Settings, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    }
    s = s || { label: plan || 'Básico', icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' };
    const Icon = s.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.color} ${s.border}`}>
            <Icon size={12} strokeWidth={3} />
            {s.label}
        </span>
    );
};
