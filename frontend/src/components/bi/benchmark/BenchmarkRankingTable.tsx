import React from 'react';
import { Store, ArrowRight } from 'lucide-react';
import type { StoreKey, StoreRankingItem } from './BenchmarkTypes';

interface Props {
    formatValue: (val: number) => string;
    onSelectStore?: (storeKey: StoreKey) => void;
}

export const BenchmarkRankingTable: React.FC<Props> = ({
    formatValue,
    onSelectStore
}) => {
    const stores: StoreRankingItem[] = [
        {
            id: 'heroinas',
            nombre: 'Heroínas (Cochabamba)',
            ventaActual: 4210.00,
            p50Historico: 3568.00,
            variacionPct: 18.0,
            status: 'alto',
            statusEmoji: '🟢',
            opportunityText: 'Líder en ventas del período'
        },
        {
            id: 'recoleta',
            nombre: 'Recoleta (Cochabamba)',
            ventaActual: 2223.00,
            p50Historico: 2340.00,
            variacionPct: -5.0,
            status: 'bajo',
            statusEmoji: '🟡',
            opportunityText: 'Ligera contracción respecto a mediana P50'
        },
        {
            id: 'calacoto',
            nombre: 'Calacoto (La Paz)',
            ventaActual: 2907.00,
            p50Historico: 3680.00,
            variacionPct: -21.0,
            status: 'critico',
            statusEmoji: '🔴',
            opportunityText: 'Bajo el límite inferior de P25'
        }
    ];

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Rendimiento por Sucursal
                        </h3>
                        <p className="text-xs text-slate-500">
                            Variación porcentual de ventas frente a la mediana histórica por sucursal.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => onSelectStore && onSelectStore('consolidado')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                    <span>Ver detalle</span> <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Branch List */}
            <div className="space-y-2.5">
                {stores.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => onSelectStore && onSelectStore(item.id)}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{item.statusEmoji}</span>
                            <div>
                                <span className="font-bold text-slate-900 text-xs block group-hover:text-indigo-600 transition-colors">
                                    {item.nombre}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                    Actual: {formatValue(item.ventaActual)} (P50: {formatValue(item.p50Historico)})
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className={`text-sm font-black font-mono px-2.5 py-1 rounded-lg border ${
                                item.variacionPct >= 0 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : item.variacionPct >= -10
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                                {item.variacionPct >= 0 ? `+${item.variacionPct}%` : `${item.variacionPct}%`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
