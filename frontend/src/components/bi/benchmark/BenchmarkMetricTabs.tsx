import React from 'react';
import { DollarSign, Users, CreditCard, Package, ShoppingCart } from 'lucide-react';
import type { MetricKey } from './BenchmarkTypes';

interface Props {
    activeMetric: MetricKey;
    onChangeMetric: (metric: MetricKey) => void;
}

export const BenchmarkMetricTabs: React.FC<Props> = ({ activeMetric, onChangeMetric }) => {
    const tabs: { key: MetricKey; label: string; sublabel: string; icon: React.ElementType }[] = [
        { key: 'ventas', label: 'Ventas', sublabel: 'por día (Bs.)', icon: DollarSign },
        { key: 'ordenes', label: 'Clientes', sublabel: 'por día', icon: Users },
        { key: 'ticket', label: 'Ticket', sublabel: 'promedio (Bs.)', icon: CreditCard },
        { key: 'unidades', label: 'Productos', sublabel: 'vendidos', icon: Package },
        { key: 'unidades_por_orden', label: 'Productos por', sublabel: 'transacción', icon: ShoppingCart },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMetric === tab.key;

                return (
                    <button
                        key={tab.key}
                        onClick={() => onChangeMetric(tab.key)}
                        className={`p-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-200 text-left border cursor-pointer ${
                            isActive
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300 shadow-2xs'
                        }`}
                    >
                        <div className={`p-1.5 rounded-xl shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-black truncate leading-tight">{tab.label}</div>
                            <div className={`text-[10px] truncate font-semibold leading-tight ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {tab.sublabel}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
